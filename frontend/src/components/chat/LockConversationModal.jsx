import React, { useState } from 'react';
import { Lock, Unlock, X, ShieldCheck } from 'lucide-react';

export const LockConversationModal = ({ conversationId, isCurrentlyLocked, onClose, onLockStateChanged }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const savedPin = localStorage.getItem(`lock_pin_${conversationId}`);

  const handleToggleLock = (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Please enter a lock passcode / PIN.');
      return;
    }

    if (isCurrentlyLocked) {
      // Unlocking
      if (savedPin && savedPin !== pin.trim()) {
        setError('Incorrect passcode / PIN.');
        return;
      }
      localStorage.setItem(`chat_locked_${conversationId}`, 'false');
      if (onLockStateChanged) onLockStateChanged(false);
      onClose();
    } else {
      // Locking
      localStorage.setItem(`lock_pin_${conversationId}`, pin.trim());
      localStorage.setItem(`chat_locked_${conversationId}`, 'true');
      if (onLockStateChanged) onLockStateChanged(true);
      onClose();
    }
  };

  const handleRemoveLock = () => {
    localStorage.removeItem(`lock_pin_${conversationId}`);
    localStorage.setItem(`chat_locked_${conversationId}`, 'false');
    if (onLockStateChanged) onLockStateChanged(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--bg-elevated, #1e1e2e)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #2f2f45)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color, #2f2f45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: isCurrentlyLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCurrentlyLocked ? '#f87171' : '#60a5fa'
              }}
            >
              {isCurrentlyLocked ? <Lock size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff', margin: 0 }}>
                {isCurrentlyLocked ? 'Unlock Conversation' : 'Lock Conversation'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim, #94a3b8)', margin: 0 }}>
                {isCurrentlyLocked ? 'Enter passcode to view messages' : 'Protect this chat with a local PIN'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim, #94a3b8)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleToggleLock} style={{ padding: '20px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.82rem',
                marginBottom: '16px'
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: '500',
                color: 'var(--text-main, #e2e8f0)',
                marginBottom: '6px'
              }}
            >
              {isCurrentlyLocked ? 'Enter Lock Passcode' : 'Set Lock Passcode / PIN'}
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="e.g. 1234 or secret"
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
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '20px' }}>
            {savedPin && (
              <button
                type="button"
                onClick={handleRemoveLock}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Disable Lock
              </button>
            )}

            <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color, #2f2f45)',
                  borderRadius: '8px',
                  color: 'var(--text-main, #e2e8f0)',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 18px',
                  backgroundColor: isCurrentlyLocked ? '#10b981' : '#7c3aed',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isCurrentlyLocked ? <Unlock size={16} /> : <Lock size={16} />}
                {isCurrentlyLocked ? 'Unlock' : 'Lock Chat'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
