import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChatLayout } from './components/chat/ChatLayout';
import { UserSearch } from './components/chat/UserSearch';
import { ConversationList } from './components/chat/ConversationList';
import { ConversationView } from './components/chat/ConversationView';
import api from './services/api';
import { websocketService } from './services/websocketService';
import { cryptoService } from './services/cryptoService';

const MainApp = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('login');
  
  // User Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Conversations & Real-Time Messaging State
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Real-Time Presence & Typing State
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  // Cache user public keys to optimize E2EE key lookups
  const userPublicKeyCache = useRef(new Map());

  const getUserPublicKeys = async (targetUserId) => {
    if (userPublicKeyCache.current.has(targetUserId)) {
      return userPublicKeyCache.current.get(targetUserId);
    }
    try {
      const res = await api.get(`/users/${targetUserId}/keys`);
      if (res.data && res.data.success) {
        const keys = res.data.data;
        userPublicKeyCache.current.set(targetUserId, keys);
        return keys;
      }
    } catch (err) {
      console.warn(`Failed to fetch public keys for user ${targetUserId}:`, err);
    }
    return null;
  };

  const getOtherParticipant = (participants, currentUserId) => {
    if (!participants || !Array.isArray(participants)) return null;
    for (const p of participants) {
      const pId = p.user ? p.user.id : p.id;
      if (pId !== currentUserId) {
        return p.user ? p.user : p;
      }
    }
    return null;
  };

  const decryptSingleMessage = async (msg, currentUserId, otherUser) => {
    if (!msg.ciphertext || !msg.iv || !msg.isEncrypted) return msg;

    const senderId = msg.sender?.id || msg.senderId;
    let targetPublicKeys = null;

    if (senderId === currentUserId) {
      if (otherUser) {
        targetPublicKeys = await getUserPublicKeys(otherUser.id);
      }
    } else {
      targetPublicKeys = await getUserPublicKeys(senderId);
    }

    if (!targetPublicKeys || !targetPublicKeys.publicEcdhKey) {
      return msg;
    }

    try {
      const plaintext = await cryptoService.decryptMessage(
        currentUserId,
        msg.ciphertext,
        msg.iv,
        msg.signature,
        targetPublicKeys.publicEcdhKey,
        targetPublicKeys.publicEcdsaKey
      );
      return {
        ...msg,
        content: plaintext,
        isEncrypted: true
      };
    } catch (err) {
      console.warn('Failed to decrypt message:', err);
      return msg;
    }
  };

  // Fetch active user conversations & initialize WebSocket/Presence on mount / login
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchConversations();

      // Fetch initial list of online user IDs
      api.get('/presence')
        .then((res) => {
          if (res.data && res.data.success && Array.isArray(res.data.data)) {
            setOnlineUserIds(new Set(res.data.data));
          }
        })
        .catch((err) => console.warn('Failed to fetch initial presence list:', err));

      // Initialize STOMP WebSocket connection
      websocketService.connect(
        token,
        () => {
          setIsConnected(true);
          // Subscribe to global presence broadcasts
          websocketService.subscribeToPresence((event) => {
            if (event && event.userId) {
              setOnlineUserIds((prev) => {
                const next = new Set(prev);
                if (event.status === 'ONLINE') {
                  next.add(event.userId);
                } else {
                  next.delete(event.userId);
                }
                return next;
              });
            }
          });
        },
        () => setIsConnected(false)
      );
    } else {
      websocketService.disconnect();
      setIsConnected(false);
    }

    return () => {
      websocketService.disconnect();
    };
  }, [isAuthenticated, token]);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await api.get('/conversations');
      if (res.data && res.data.success) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch user conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load chat history & subscribe to STOMP topics when activeConversation changes
  useEffect(() => {
    if (!activeConversation || !isAuthenticated) return;

    setIsOtherUserTyping(false);
    const otherUser = getOtherParticipant(activeConversation.participants, user?.id);

    // 1. Fetch persistent chat history from REST API
    const fetchHistory = async () => {
      setLoadingMessages(true);
      try {
        const res = await api.get(`/conversations/${activeConversation.id}/messages`);
        if (res.data && res.data.success) {
          const rawMessages = res.data.data;
          const decryptedList = await Promise.all(
            rawMessages.map((m) => decryptSingleMessage(m, user?.id, otherUser))
          );
          setMessages(decryptedList);
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchHistory();

    // 2. Subscribe to STOMP real-time topic /topic/conversation.{id}
    const subscription = websocketService.subscribeToConversation(
      activeConversation.id,
      async (incomingMsg) => {
        const processedMsg = await decryptSingleMessage(incomingMsg, user?.id, otherUser);

        setMessages((prevMessages) => {
          const existingIndex = prevMessages.findIndex(
            (m) => (m.id && m.id === processedMsg.id) || (m.status === 'pending' && m.ciphertext === processedMsg.ciphertext)
          );

          if (existingIndex !== -1) {
            const updated = [...prevMessages];
            updated[existingIndex] = processedMsg;
            return updated;
          }

          return [...prevMessages, processedMsg];
        });

        // Refresh conversation sidebar
        fetchConversations();
      }
    );

    // 3. Subscribe to STOMP typing indicators topic /topic/conversation.{id}.typing
    const typingSub = websocketService.subscribeToTyping(
      activeConversation.id,
      (typingEvent) => {
        if (typingEvent && typingEvent.userId !== user?.id) {
          setIsOtherUserTyping(!!typingEvent.typing);
        }
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      if (typingSub) {
        typingSub.unsubscribe();
      }
    };
  }, [activeConversation, isAuthenticated, user]);

  // Debounced User Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/users/search?query=${encodeURIComponent(searchQuery.trim())}`);
        if (res.data && res.data.success) {
          setSearchResults(res.data.data);
        }
      } catch (err) {
        console.error('User search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle selecting a user from search -> Create or open direct conversation
  const handleSelectUser = async (targetUser) => {
    try {
      const res = await api.post('/conversations', { targetUserId: targetUser.id });
      if (res.data && res.data.success) {
        const conv = res.data.data;
        setActiveConversation(conv);
        setSearchQuery('');
        setSearchResults([]);
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to open/create conversation:', err);
    }
  };

  const handleTyping = (isTyping) => {
    if (!activeConversation) return;
    websocketService.sendTypingIndicator(activeConversation.id, isTyping);
  };

  // Real-time message publish via STOMP (with ECDH + AES-GCM-256 E2EE)
  const handleSendMessage = async (content) => {
    if (!activeConversation || !content.trim()) return;

    const plainContent = content.trim();
    const otherUser = getOtherParticipant(activeConversation.participants, user?.id);

    let ciphertext = null;
    let iv = null;
    let signature = null;
    let fallbackContent = "[Encrypted Message]";

    if (otherUser && user?.id) {
      const recipientKeys = await getUserPublicKeys(otherUser.id);
      if (recipientKeys && recipientKeys.publicEcdhKey) {
        try {
          const encResult = await cryptoService.encryptMessage(
            user.id,
            plainContent,
            recipientKeys.publicEcdhKey
          );
          ciphertext = encResult.ciphertext;
          iv = encResult.iv;
          signature = encResult.signature;
        } catch (err) {
          console.warn('Encryption failed, sending unencrypted fallback:', err);
          fallbackContent = plainContent;
        }
      } else {
        fallbackContent = plainContent;
      }
    } else {
      fallbackContent = plainContent;
    }

    // Optimistic pending message preview
    const pendingMsg = {
      id: `pending-${Date.now()}`,
      conversationId: activeConversation.id,
      sender: user,
      senderId: user?.id,
      content: plainContent,
      ciphertext,
      iv,
      signature,
      createdAt: new Date().toISOString(),
      status: 'pending',
      isEncrypted: !!ciphertext
    };

    setMessages((prev) => [...prev, pendingMsg]);

    // Publish via STOMP WebSocket
    const sent = websocketService.sendMessage(
      activeConversation.id,
      fallbackContent,
      ciphertext,
      iv,
      signature
    );

    if (!sent) {
      setMessages((prev) =>
        prev.map((m) => (m.id === pendingMsg.id ? { ...m, status: 'failed' } : m))
      );
    }
  };

  if (!isAuthenticated) {
    if (currentScreen === 'register') {
      return <RegisterPage onNavigateLogin={() => setCurrentScreen('login')} />;
    }
    return <LoginPage onNavigateRegister={() => setCurrentScreen('register')} />;
  }

  return (
    <ChatLayout
      sidebarContent={
        <>
          <UserSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={() => {}}
            searchResults={searchResults}
            loading={searching}
            onSelectUser={handleSelectUser}
            onClearSearch={() => setSearchQuery('')}
          />
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?.id}
            onSelectConversation={(conv) => {
              setActiveConversation(conv);
              setIsOtherUserTyping(false);
            }}
            loading={loadingConversations}
            currentUserId={user?.id}
            onlineUserIds={onlineUserIds}
          />
        </>
      }
      mainContent={
        <ConversationView
          activeConversation={activeConversation}
          messages={messages}
          currentUserId={user?.id}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          isOtherUserTyping={isOtherUserTyping}
          loadingMessages={loadingMessages}
          isConnected={isConnected}
        />
      }
    />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
