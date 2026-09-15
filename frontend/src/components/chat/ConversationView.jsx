import React from 'react';
import { Avatar } from '../common/Avatar';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { EmptyState } from '../common/EmptyState';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export const ConversationView = ({
  activeConversation,
  messages = [],
  currentUserId,
  onSendMessage,
  loadingMessages = false,
  onBackMobile,
  isConnected = true
}) => {
  if (!activeConversation) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
        <EmptyState
          icon={MessageSquare}
          title="Select a Conversation"
          description="Choose an existing conversation from the list or search for a registered user to start messaging."
        />
      </div>
    );
  }

  // Safely extract other participant (handles both direct UserDto and nested participant.user objects)
  const getOtherParticipant = (participants, userId) => {
    if (!participants || !Array.isArray(participants)) return null;
    for (const p of participants) {
      const pId = p.user ? p.user.id : p.id;
      if (pId !== userId) {
        return p.user ? p.user : p;
      }
    }
    return null;
  };

  const otherParticipant = getOtherParticipant(activeConversation.participants, currentUserId);
  const displayName = otherParticipant ? otherParticipant.username : 'Private Chat';
  const displayEmail = otherParticipant ? otherParticipant.email : '';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-dark)', position: 'relative' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 5
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '4px'
              }}
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <Avatar name={displayName} size="md" online={isConnected} />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', fontSize: '0.98rem', color: 'var(--text-main)' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {displayEmail}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              color: isConnected ? 'var(--success)' : 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? 'var(--success)' : 'var(--warning)'
              }}
            />
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Message List */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        loading={loadingMessages}
      />

      {/* Message Composer */}
      <MessageComposer
        onSendMessage={onSendMessage}
        disabled={!isConnected}
      />
    </div>
  );
};
