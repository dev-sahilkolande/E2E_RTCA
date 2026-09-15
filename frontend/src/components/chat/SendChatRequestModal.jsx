import React, { useState } from 'react';
import { Lock, Key, X, Send } from 'lucide-react';
import api from '../../services/api';

export const SendChatRequestModal = ({ targetUser, onClose, onRequestSent }) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!targetUser) return null;

  const handleGenerateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let randKey = '';
    for (let i = 0; i < 8; i++) {
      randKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasscode(randKey);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter or generate a Private Chat Key.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/chat-requests', {
        receiverId: targetUser.id,
        passcode: passcode.trim()
      });

      if (res.data && res.data.success) {
        // Save local key for this target user so sender can decrypt
        localStorage.setItem(`chat_key_user_${targetUser.id}`, passcode.trim());
        if (onRequestSent) onRequestSent(res.data.data, passcode.trim());
        onClose();
      } else {
        setError(res.data?.message || 'Failed to send chat request.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending request. A request may already exist.');
    } finally {
      setLoading(false);
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
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-light, #a78bfa)'
              }}
            >
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff', margin: 0 }}>
                Private Chat Request
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim, #94a3b8)', margin: 0 }}>
                Send request to {targetUser.username}
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
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
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
              Private Chat Key / Passcode
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Set a secret key (e.g. secret123)"
                required
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  backgroundColor: 'var(--bg-dark, #12121e)',
                  border: '1px solid var(--border-color, #2f2f45)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <Key
                size={16}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim, #94a3b8)'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim, #94a3b8)' }}>
                Recipient must enter this key to accept chat.
              </span>
              <button
                type="button"
                onClick={handleGenerateKey}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-light, #a78bfa)',
                  fontSize: '0.76rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Auto Generate Key
              </button>
            </div>
          </div>

          {passcode && (
            <div
              style={{
                padding: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.8rem',
                color: '#93c5fd'
              }}
            >
              🔑 <strong>Your Private Key:</strong> <code style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{passcode}</code>
              <br />
              Share this key with {targetUser.username} so they can unlock your request!
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color, #2f2f45)',
                borderRadius: '8px',
                color: 'var(--text-main, #e2e8f0)',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 20px',
                backgroundColor: 'var(--primary, #7c3aed)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Send size={15} />
              {loading ? 'Sending Request...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
