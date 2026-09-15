import React from 'react';
import { Check, Clock, AlertCircle, Lock } from 'lucide-react';

export const MessageBubble = ({ message, isOutgoing }) => {
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const isPending = message.status === 'pending';
  const isFailed = message.status === 'failed';
  const isEncrypted = message.isEncrypted || !!message.ciphertext;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOutgoing ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        maxWidth: '75%',
        alignSelf: isOutgoing ? 'flex-end' : 'flex-start'
      }}
    >
      {!isOutgoing && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px', marginLeft: '4px' }}>
          {message.sender?.username || 'User'}
        </span>
      )}
      <div
        style={{
          padding: '10px 16px',
          borderRadius: isOutgoing ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
          backgroundColor: isOutgoing ? 'var(--primary)' : 'var(--bg-elevated)',
          color: '#ffffff',
          boxShadow: isOutgoing ? 'var(--shadow-glow)' : '0 2px 6px rgba(0,0,0,0.2)',
          fontSize: '0.92rem',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          border: isOutgoing ? 'none' : '1px solid var(--border-color)',
          opacity: isPending ? 0.7 : 1
        }}
      >
        {message.content}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
        {isEncrypted && (
          <Lock size={11} color="var(--primary-light)" title="End-to-End Encrypted (AES-GCM-256)" style={{ marginRight: '2px' }} />
        )}
        <span>{formatTime(message.createdAt)}</span>
        {isOutgoing && (
          <>
            {isPending && <Clock size={12} title="Sending..." />}
            {isFailed && <AlertCircle size={12} color="var(--error)" title="Delivery failed" />}
            {!isPending && !isFailed && <Check size={12} color="var(--primary-light)" title="Delivered" />}
          </>
        )}
      </div>
    </div>
  );
};
