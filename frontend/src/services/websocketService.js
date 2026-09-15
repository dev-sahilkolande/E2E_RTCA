import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080/ws';

class WebSocketService {
  constructor() {
    this.client = null;
    this.activeSubscriptions = new Map();
    this.isConnected = false;
  }

  connect(token, onConnected, onError) {
    if (this.client && this.client.active) {
      if (onConnected) onConnected();
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => {},
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      this.isConnected = true;
      if (onConnected) onConnected();
    };

    this.client.onStompError = (frame) => {
      this.isConnected = false;
      console.error('STOMP Error:', frame.headers['message'], frame.body);
      if (onError) onError(frame);
    };

    this.client.onWebSocketClose = () => {
      this.isConnected = false;
    };

    this.client.activate();
  }

  subscribeToConversation(conversationId, onMessageReceived) {
    if (!this.client || !this.client.active) {
      console.warn('STOMP client is not active yet. Subscription queued.');
      return null;
    }

    const topic = `/topic/conversation.${conversationId}`;

    // Unsubscribe from existing topic subscription if any
    if (this.activeSubscriptions.has(topic)) {
      this.activeSubscriptions.get(topic).unsubscribe();
      this.activeSubscriptions.delete(topic);
    }

    const subscription = this.client.subscribe(topic, (message) => {
      if (message.body) {
        try {
          const payload = JSON.parse(message.body);
          onMessageReceived(payload);
        } catch (e) {
          console.error('Failed to parse STOMP message payload:', e);
        }
      }
    });

    this.activeSubscriptions.set(topic, subscription);
    return subscription;
  }

  sendMessage(conversationId, content) {
    if (!this.client || !this.client.active) {
      console.error('Cannot send STOMP message: Client disconnected.');
      return false;
    }

    this.client.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify({
        conversationId,
        content,
      }),
    });

    return true;
  }

  disconnect() {
    if (this.client) {
      this.activeSubscriptions.forEach((sub) => sub.unsubscribe());
      this.activeSubscriptions.clear();
      this.client.deactivate();
      this.isConnected = false;
      this.client = null;
    }
  }
}

export const websocketService = new WebSocketService();
