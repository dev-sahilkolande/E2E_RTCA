import React, { useEffect, useRef } from 'react';
import { Star, Lock, Unlock, UserMinus, Trash2 } from 'lucide-react';

export const ContextMenu = ({
  x,
  y,
  conversation,
  isStarred,
  isLocked,
  onClose,
  onToggleStar,
  onToggleLock,
  onRemoveFriend,
  onDeleteConversation
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust positioning to stay inside screen bounds
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 200);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        width: '200px',
        backgroundColor: 'var(--bg-elevated, #1e1e2e)',
        border: '1px solid var(--border-color, #2f2f45)',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
        zIndex: 2000,
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}
    >
      {/* Star / Unstar Favorite */}
      <button
        onClick={() => {
          onClose();
          if (onToggleStar) onToggleStar(conversation);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          borderRadius: '8px',
          color: isStarred ? '#f59e0b' : 'var(--text-main, #e2e8f0)',
          fontSize: '0.82rem',
          fontWeight: '500',
          cursor: 'pointer',
          textAlign: 'left'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Star size={16} fill={isStarred ? '#f59e0b' : 'none'} color={isStarred ? '#f59e0b' : 'currentColor'} />
        {isStarred ? 'Unstar Favorite' : 'Star as Favorite'}
      </button>

      {/* Lock / Unlock Chat */}
      <button
        onClick={() => {
          onClose();
          if (onToggleLock) onToggleLock(conversation);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          borderRadius: '8px',
          color: 'var(--text-main, #e2e8f0)',
          fontSize: '0.82rem',
          fontWeight: '500',
          cursor: 'pointer',
          textAlign: 'left'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {isLocked ? <Unlock size={16} color="#10b981" /> : <Lock size={16} color="var(--primary-light, #a78bfa)" />}
        {isLocked ? 'Unlock Conversation' : 'Lock Conversation'}
      </button>

      <div style={{ height: '1px', backgroundColor: 'var(--border-color, #2f2f45)', margin: '4px 0' }} />

      {/* Remove from Friends */}
      <button
        onClick={() => {
          onClose();
          if (onRemoveFriend) onRemoveFriend(conversation);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          borderRadius: '8px',
          color: '#f87171',
          fontSize: '0.82rem',
          fontWeight: '500',
          cursor: 'pointer',
          textAlign: 'left'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <UserMinus size={16} />
        Remove from Friends
      </button>

      {/* Delete Conversation */}
      <button
        onClick={() => {
          onClose();
          if (onDeleteConversation) onDeleteConversation(conversation);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          borderRadius: '8px',
          color: '#ef4444',
          fontSize: '0.82rem',
          fontWeight: '500',
          cursor: 'pointer',
          textAlign: 'left'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Trash2 size={16} />
        Delete Conversation
      </button>
    </div>
  );
};
