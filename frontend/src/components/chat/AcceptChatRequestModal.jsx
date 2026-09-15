import React, { useState } from 'react';
import { KeyRound, X, Check, Trash2 } from 'lucide-react';
import api from '../../services/api';

export const AcceptChatRequestModal = ({ requestItem, onClose, onRequestAccepted, onRequestRejected }) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!requestItem) return null;

  const senderName = requestItem.sender?.username || 'User';

  const handleAccept = async (e) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the Private Chat Key.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/chat-requests/${requestItem.id}/accept`, {
        passcode: passcode.trim()
      });

      if (res.data && res.data.success) {
        const conversation = res.data.data;
        // Save local passcode for key derivation/unlocking
        localStorage.setItem(`chat_key_user_${requestItem.sender?.id}`, passcode.trim());
        if (onRequestAccepted) onRequestAccepted(conversation);
        onClose();
      } else {
        setError(res.data?.message || 'Failed to accept chat request.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid key. Passcode does not match.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(`Reject chat request from ${senderName}?`)) return;

    try {
      await api.post(`/chat-requests/${requestItem.id}/reject`);
      if (onRequestRejected) onRequestRejected(requestItem.id);
      onClose();
    } catch (err) {
      console.error('Failed to reject chat request:', err);
    }
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
          maxWidth: '440px',
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
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399'
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff', margin: 0 }}>
                Accept Chat Request
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim, #94a3b8)', margin: 0 }}>
                From {senderName} ({requestItem.sender?.email})
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
        <form onSubmit={handleAccept} style={{ padding: '20px' }}>
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
              Enter Private Chat Key
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter the secret key set by sender"
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
            <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-dim, #94a3b8)', marginTop: '6px' }}>
              Ask {senderName} for the secret key if you don't have it yet.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '24px' }}>
            <button
              type="button"
              onClick={handleReject}
              style={{
                padding: '8px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={14} />
              Reject Request
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
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
                disabled={loading}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                <Check size={16} />
                {loading ? 'Unlocking...' : 'Unlock & Accept Chat'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
