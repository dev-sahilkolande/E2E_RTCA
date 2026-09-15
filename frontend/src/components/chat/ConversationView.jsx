import React, { useState, useEffect } from 'react';
import { Avatar } from '../common/Avatar';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';
import { EmptyState } from '../common/EmptyState';
import { MessageSquare, ArrowLeft, Lock, Unlock, Key } from 'lucide-react';
import { LockConversationModal } from './LockConversationModal';

export const ConversationView = ({
  activeConversation,
  messages = [],
  currentUserId,
  onSendMessage,
  onTyping,
  isOtherUserTyping = false,
  loadingMessages = false,
  onBackMobile,
  isConnected = true
}) => {
  const [showLockModal, setShowLockModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');
  const [unlockError, setUnlockError] = useState('');

  useEffect(() => {
    if (activeConversation) {
      const lockedState = localStorage.getItem(`chat_locked_${activeConversation.id}`) === 'true';
      setIsLocked(lockedState);
      setUnlockInput('');
      setUnlockError('');
    }
  }, [activeConversation]);

  if (!activeConversation) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
        <EmptyState
          icon={MessageSquare}
          title="Select a Conversation"
          description="Choose an existing conversation from the list or search for a registered user to send a private chat request."
        />
      </div>
    );
  }

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

  const handleUnlockSubmit = (e) => {
    e.preventDefault();
    const savedPin = localStorage.getItem(`lock_pin_${activeConversation.id}`);
    if (savedPin && savedPin !== unlockInput.trim()) {
      setUnlockError('Incorrect lock passcode / PIN.');
      return;
    }
    localStorage.setItem(`chat_locked_${activeConversation.id}`, 'false');
    setIsLocked(false);
    setUnlockInput('');
    setUnlockError('');
  };

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
            {isOtherUserTyping ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontStyle: 'italic', fontWeight: '500' }}>
                typing...
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {displayEmail}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Lock Conversation Toggle Button */}
          <button
            onClick={() => setShowLockModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(124, 58, 237, 0.15)',
              border: isLocked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(124, 58, 237, 0.3)',
              color: isLocked ? '#f87171' : 'var(--primary-light)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            title={isLocked ? 'Conversation Locked - Click to Unlock' : 'Lock Conversation with Private Passcode'}
          >
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            {isLocked ? 'Locked' : 'Lock Chat'}
          </button>

          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}
            title="Messages are encrypted on your device using ECDH P-256 and AES-GCM-256"
          >
            <Lock size={12} />
            E2E Encrypted
          </span>
        </div>
      </div>

      {/* Main Body (Locked Overlay or Message View) */}
      {isLocked ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--bg-dark)'
          }}
        >
          <div
            style={{
              maxWidth: '360px',
              width: '100%',
              backgroundColor: 'var(--bg-elevated, #1e1e2e)',
              border: '1px solid var(--border-color, #2f2f45)',
              borderRadius: '16px',
              padding: '28px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <Lock size={28} />
            </div>

            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>
              Conversation Locked
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '20px' }}>
              This private conversation with {displayName} is locked with a passcode.
            </p>

            <form onSubmit={handleUnlockSubmit}>
              {unlockError && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    marginBottom: '12px'
                  }}
                >
                  {unlockError}
                </div>
              )}

              <input
                type="password"
                value={unlockInput}
                onChange={(e) => setUnlockInput(e.target.value)}
                placeholder="Enter passcode to unlock..."
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-dark, #12121e)',
                  border: '1px solid var(--border-color, #2f2f45)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  marginBottom: '16px'
                }}
              />

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Unlock size={16} />
                Unlock Conversation
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Message List */}
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            loading={loadingMessages}
          />

          {/* Message Composer */}
          <MessageComposer
            onSendMessage={onSendMessage}
            onTyping={onTyping}
            disabled={!isConnected}
          />
        </>
      )}

      {/* Lock Conversation Modal */}
      {showLockModal && (
        <LockConversationModal
          conversationId={activeConversation.id}
          isCurrentlyLocked={isLocked}
          onClose={() => setShowLockModal(false)}
          onLockStateChanged={(newLockedState) => setIsLocked(newLockedState)}
        />
      )}
    </div>
  );
};
