import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChatLayout } from './components/chat/ChatLayout';
import { UserSearch } from './components/chat/UserSearch';
import { ConversationList } from './components/chat/ConversationList';
import { ConversationView } from './components/chat/ConversationView';
import { SendChatRequestModal } from './components/chat/SendChatRequestModal';
import { AcceptChatRequestModal } from './components/chat/AcceptChatRequestModal';
import { FriendsListModal } from './components/chat/FriendsListModal';
import { ContextMenu } from './components/common/ContextMenu';
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

  // Friends & Starred Favorites State
  const [friends, setFriends] = useState([]);
  const [starredFriendIds, setStarredFriendIds] = useState(new Set());
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  // Context Menu State (Right Click)
  const [contextMenu, setContextMenu] = useState(null); // { x, y, conversation }

  // Pending Chat Requests & Notifications State
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedUserForRequest, setSelectedUserForRequest] = useState(null);
  const [selectedRequestForAccept, setSelectedRequestForAccept] = useState(null);

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
    if (!msg) return msg;

    if (msg.content && msg.content !== '[Encrypted Message]') {
      return msg;
    }

    if (!msg.ciphertext || !msg.iv) return msg;

    const senderId = msg.sender?.id || msg.senderId;
    const otherUserId = otherUser ? otherUser.id : (senderId === currentUserId ? null : senderId);

    let ecdhPublicKeyToUse = null;
    let ecdsaPublicKeyToUse = null;

    if (senderId === currentUserId) {
      if (otherUser) {
        const recipientKeys = await getUserPublicKeys(otherUser.id);
        const myKeys = await getUserPublicKeys(currentUserId);
        ecdhPublicKeyToUse = recipientKeys?.publicEcdhKey;
        ecdsaPublicKeyToUse = myKeys?.publicEcdsaKey;
      }
    } else {
      const senderKeys = await getUserPublicKeys(senderId);
      ecdhPublicKeyToUse = senderKeys?.publicEcdhKey;
      ecdsaPublicKeyToUse = senderKeys?.publicEcdsaKey;
    }

    try {
      const plaintext = await cryptoService.decryptMessage(
        currentUserId,
        msg.ciphertext,
        msg.iv,
        msg.signature,
        ecdhPublicKeyToUse,
        ecdsaPublicKeyToUse,
        msg.conversationId,
        otherUserId
      );

      if (plaintext) {
        return {
          ...msg,
          content: plaintext,
          isEncrypted: true
        };
      }
    } catch (err) {
      console.warn('Failed to decrypt message payload:', err);
    }

    return msg;
  };

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

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get('/chat-requests/pending');
      if (res.data && res.data.success) {
        setPendingRequests(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch pending chat requests:', err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await api.get('/friends');
      if (res.data && res.data.success) {
        const list = res.data.data;
        setFriends(list);
        const starredSet = new Set(
          list.filter((f) => f.isStarred).map((f) => f.friend?.id)
        );
        setStarredFriendIds(starredSet);
      }
    } catch (err) {
      console.warn('Failed to fetch friends list:', err);
    }
  };

  // Initialize WebSockets, Presence, Notifications & Friends on login
  useEffect(() => {
    if (isAuthenticated && token && user?.id) {
      fetchConversations();
      fetchPendingRequests();
      fetchFriends();

      // Fetch initial presence
      api.get('/presence')
        .then((res) => {
          if (res.data && res.data.success && Array.isArray(res.data.data)) {
            setOnlineUserIds(new Set(res.data.data));
          }
        })
        .catch((err) => console.warn('Failed to fetch initial presence list:', err));

      // Connect WebSockets
      websocketService.connect(
        token,
        () => {
          setIsConnected(true);

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

          websocketService.subscribeToUserNotifications(user.id, (notification) => {
            if (notification.type === 'CHAT_REQUEST') {
              fetchPendingRequests();
            }
            if (notification.type === 'CHAT_REQUEST_ACCEPTED') {
              fetchConversations();
              fetchFriends();
            }
            if (notification.type === 'NEW_MESSAGE') {
              fetchConversations();
            }
            setNotifications((prev) => [notification, ...prev]);
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
  }, [isAuthenticated, token, user?.id]);

  // Load chat history & subscribe to STOMP topics when activeConversation changes
  useEffect(() => {
    if (!activeConversation || !isAuthenticated) return;

    setIsOtherUserTyping(false);
    const otherUser = getOtherParticipant(activeConversation.participants, user?.id);

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

        fetchConversations();
      }
    );

    const typingSub = websocketService.subscribeToTyping(
      activeConversation.id,
      (typingEvent) => {
        if (typingEvent && typingEvent.userId !== user?.id) {
          setIsOtherUserTyping(!!typingEvent.typing);
        }
      }
    );

    return () => {
      if (subscription) subscription.unsubscribe();
      if (typingSub) typingSub.unsubscribe();
    };
  }, [activeConversation, isAuthenticated, user]);

  // User search debounce
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

  const handleSelectUser = (targetUser) => {
    setSelectedUserForRequest(targetUser);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleTyping = (isTyping) => {
    if (!activeConversation) return;
    websocketService.sendTypingIndicator(activeConversation.id, isTyping);
  };

  const handleSendMessage = async (content) => {
    if (!activeConversation || !content.trim()) return;

    const plainContent = content.trim();
    const otherUser = getOtherParticipant(activeConversation.participants, user?.id);

    let ciphertext = null;
    let iv = null;
    let signature = null;

    if (otherUser && user?.id) {
      const recipientKeys = await getUserPublicKeys(otherUser.id);
      try {
        const encResult = await cryptoService.encryptMessage(
          user.id,
          plainContent,
          recipientKeys?.publicEcdhKey,
          activeConversation.id,
          otherUser.id
        );
        ciphertext = encResult.ciphertext;
        iv = encResult.iv;
        signature = encResult.signature;
      } catch (err) {
        console.warn('Encryption fallback:', err);
      }
    }

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

    const sent = websocketService.sendMessage(
      activeConversation.id,
      plainContent,
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

  // Right-click context menu handler on conversation items
  const handleConversationContextMenu = (e, conv) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      conversation: conv
    });
  };

  // Context Menu Actions:
  const handleToggleStarFromConv = async (conv) => {
    const otherUser = getOtherParticipant(conv.participants, user?.id);
    if (!otherUser) return;

    try {
      const res = await api.post(`/friends/${otherUser.id}/star`);
      if (res.data && res.data.success) {
        fetchFriends();
      }
    } catch (err) {
      console.error('Failed to star friend:', err);
    }
  };

  const handleRemoveFriendFromConv = async (conv) => {
    const otherUser = getOtherParticipant(conv.participants, user?.id);
    if (!otherUser) return;

    if (!window.confirm(`Remove ${otherUser.username} from your friends list?`)) return;

    try {
      await api.delete(`/friends/${otherUser.id}`);
      fetchFriends();
    } catch (err) {
      console.error('Failed to remove friend:', err);
    }
  };

  const handleDeleteConversation = async (conv) => {
    if (!window.confirm('Delete this conversation from your chat list?')) return;

    setConversations((prev) => prev.filter((c) => c.id !== conv.id));
    if (activeConversation?.id === conv.id) {
      setActiveConversation(null);
    }
  };

  const handleSelectFriendChat = async (friendUser) => {
    try {
      const res = await api.post('/conversations', { targetUserId: friendUser.id });
      if (res.data && res.data.success) {
        const conv = res.data.data;
        setActiveConversation(conv);
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to open friend chat:', err);
    }
  };

  const handleNotificationClick = (item) => {
    if (item.conversationId) {
      const targetConv = conversations.find((c) => c.id === item.conversationId);
      if (targetConv) {
        setActiveConversation(targetConv);
      } else {
        fetchConversations();
      }
    }
  };

  if (!isAuthenticated) {
    if (currentScreen === 'register') {
      return <RegisterPage onNavigateLogin={() => setCurrentScreen('login')} />;
    }
    return <LoginPage onNavigateRegister={() => setCurrentScreen('register')} />;
  }

  const contextOtherUser = contextMenu ? getOtherParticipant(contextMenu.conversation?.participants, user?.id) : null;
  const isContextUserStarred = contextOtherUser ? starredFriendIds.has(contextOtherUser.id) : false;
  const isContextConvLocked = contextMenu ? localStorage.getItem(`chat_locked_${contextMenu.conversation?.id}`) === 'true' : false;

  return (
    <>
      <ChatLayout
        pendingRequests={pendingRequests}
        notifications={notifications}
        onAcceptRequestClick={(req) => setSelectedRequestForAccept(req)}
        onNotificationClick={handleNotificationClick}
        onClearNotifications={() => setNotifications([])}
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
              onOpenFriendsModal={() => setShowFriendsModal(true)}
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
              starredFriendIds={starredFriendIds}
              onConversationContextMenu={handleConversationContextMenu}
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

      {/* Right Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          conversation={contextMenu.conversation}
          isStarred={isContextUserStarred}
          isLocked={isContextConvLocked}
          onClose={() => setContextMenu(null)}
          onToggleStar={handleToggleStarFromConv}
          onToggleLock={(conv) => {
            const currentLocked = localStorage.getItem(`chat_locked_${conv.id}`) === 'true';
            localStorage.setItem(`chat_locked_${conv.id}`, currentLocked ? 'false' : 'true');
            if (activeConversation?.id === conv.id) {
              setActiveConversation({ ...conv });
            }
          }}
          onRemoveFriend={handleRemoveFriendFromConv}
          onDeleteConversation={handleDeleteConversation}
        />
      )}

      {/* Friends List Modal */}
      {showFriendsModal && (
        <FriendsListModal
          onClose={() => setShowFriendsModal(false)}
          onSelectFriendChat={handleSelectFriendChat}
          onlineUserIds={onlineUserIds}
        />
      )}

      {/* Send Chat Request Modal */}
      {selectedUserForRequest && (
        <SendChatRequestModal
          targetUser={selectedUserForRequest}
          onClose={() => setSelectedUserForRequest(null)}
          onRequestSent={() => fetchPendingRequests()}
        />
      )}

      {/* Accept Chat Request Modal */}
      {selectedRequestForAccept && (
        <AcceptChatRequestModal
          requestItem={selectedRequestForAccept}
          onClose={() => setSelectedRequestForAccept(null)}
          onRequestAccepted={(newConv) => {
            fetchConversations();
            fetchPendingRequests();
            fetchFriends();
            if (newConv) setActiveConversation(newConv);
          }}
          onRequestRejected={() => fetchPendingRequests()}
        />
      )}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
