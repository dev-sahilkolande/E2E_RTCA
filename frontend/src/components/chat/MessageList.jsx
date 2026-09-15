import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { MessageSquare } from 'lucide-react';

export const MessageList = ({ messages = [], currentUserId, loading = false }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return <LoadingSpinner text="Loading message history..." />;
  }

  if (!messages || messages.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No Messages Yet"
        description="Type a message below to start this private conversation."
      />
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {messages.map((msg, index) => {
        const isOutgoing = msg.sender?.id === currentUserId || msg.senderId === currentUserId;
        return (
          <MessageBubble
            key={msg.id || `msg-${index}`}
            message={msg}
            isOutgoing={isOutgoing}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
