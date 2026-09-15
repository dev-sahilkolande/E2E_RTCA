import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChatLayout } from './components/chat/ChatLayout';
import { UserSearch } from './components/chat/UserSearch';
import { ConversationList } from './components/chat/ConversationList';
import { ConversationView } from './components/chat/ConversationView';
import api from './services/api';
import { websocketService } from './services/websocketService';

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

  // Fetch active user conversations on mount / login
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchConversations();
      // Initialize STOMP WebSocket connection
      websocketService.connect(
        token,
        () => setIsConnected(true),
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

  // Load chat history & subscribe to STOMP topic when activeConversation changes
  useEffect(() => {
    if (!activeConversation || !isAuthenticated) return;

    // 1. Fetch persistent chat history from REST API
    const fetchHistory = async () => {
      setLoadingMessages(true);
      try {
        const res = await api.get(`/conversations/${activeConversation.id}/messages`);
        if (res.data && res.data.success) {
          setMessages(res.data.data);
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
      (incomingMsg) => {
        setMessages((prevMessages) => {
          // Replace matching pending message or append new message if not present
          const existingIndex = prevMessages.findIndex(
            (m) => (m.id && m.id === incomingMsg.id) || (m.status === 'pending' && m.content === incomingMsg.content)
          );

          if (existingIndex !== -1) {
            const updated = [...prevMessages];
            updated[existingIndex] = incomingMsg;
            return updated;
          }

          return [...prevMessages, incomingMsg];
        });

        // Refresh conversation sidebar
        fetchConversations();
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [activeConversation, isAuthenticated]);

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

  // Real-time message publish via STOMP
  const handleSendMessage = (content) => {
    if (!activeConversation || !content.trim()) return;

    // Optimistic pending message preview
    const pendingMsg = {
      id: `pending-${Date.now()}`,
      conversationId: activeConversation.id,
      sender: user,
      senderId: user?.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    setMessages((prev) => [...prev, pendingMsg]);

    // Publish via STOMP WebSocket
    const sent = websocketService.sendMessage(activeConversation.id, content.trim());
    if (!sent) {
      // Mark failed if socket disconnected
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
            onSelectConversation={setActiveConversation}
            loading={loadingConversations}
            currentUserId={user?.id}
          />
        </>
      }
      mainContent={
        <ConversationView
          activeConversation={activeConversation}
          messages={messages}
          currentUserId={user?.id}
          onSendMessage={handleSendMessage}
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
