import React, { useState, useRef, useEffect } from 'react';
import { Bell, KeyRound, MessageSquare, CheckCircle, X } from 'lucide-react';

export const NotificationBell = ({
  pendingRequests = [],
  notifications = [],
  onAcceptRequestClick,
  onNotificationClick,
  onClearNotifications
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const totalCount = pendingRequests.length + notifications.length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          color: 'var(--text-main, #e2e8f0)',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}
        title="Notifications & Requests"
      >
        <Bell size={20} />
        {totalCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: '700',
              borderRadius: '10px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
            }}
          >
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '320px',
            maxHeight: '420px',
            backgroundColor: 'var(--bg-elevated, #1e1e2e)',
            border: '1px solid var(--border-color, #2f2f45)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color, #2f2f45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }}
          >
            <span style={{ fontWeight: '600', fontSize: '0.88rem', color: '#fff' }}>
              Notifications ({totalCount})
            </span>
            {notifications.length > 0 && (
              <button
                onClick={onClearNotifications}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-light, #a78bfa)',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Clear Alerts
              </button>
            )}
          </div>

          {/* List Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {totalCount === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim, #94a3b8)', fontSize: '0.82rem' }}>
                No new notifications or requests.
              </div>
            ) : (
              <>
                {/* Pending Chat Requests Section */}
                {pendingRequests.length > 0 && (
                  <div style={{ borderBottom: '1px solid var(--border-color, #2f2f45)' }}>
                    <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary-light, #a78bfa)', textTransform: 'uppercase' }}>
                      Pending Chat Requests ({pendingRequests.length})
                    </div>
                    {pendingRequests.map((req) => (
                      <div
                        key={`req-${req.id}`}
                        style={{
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          backgroundColor: 'rgba(124, 58, 237, 0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#7c3aed',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}
                          >
                            {(req.sender?.username || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.84rem', fontWeight: '600', color: '#fff' }}>
                              {req.sender?.username}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim, #94a3b8)' }}>
                              Sent chat request • {formatTime(req.createdAt)}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsOpen(false);
                            if (onAcceptRequestClick) onAcceptRequestClick(req);
                          }}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#10b981',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <KeyRound size={12} />
                          Enter Key
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notifications Section */}
                {notifications.length > 0 && (
                  <div>
                    <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-dim, #94a3b8)', textTransform: 'uppercase' }}>
                      Recent Alerts
                    </div>
                    {notifications.map((item, idx) => (
                      <div
                        key={`notif-${idx}`}
                        onClick={() => {
                          setIsOpen(false);
                          if (onNotificationClick) onNotificationClick(item);
                        }}
                        style={{
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: item.conversationId ? 'pointer' : 'default',
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <MessageSquare size={16} color="var(--primary-light, #a78bfa)" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: '500' }}>
                            {item.message}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim, #94a3b8)', marginTop: '2px' }}>
                            {formatTime(item.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
