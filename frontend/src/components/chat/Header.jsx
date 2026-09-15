import React from 'react';
import { MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { NotificationBell } from '../common/NotificationBell';

export const Header = ({
  pendingRequests = [],
  notifications = [],
  onAcceptRequestClick,
  onNotificationClick,
  onClearNotifications
}) => {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 10
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <MessageSquare size={20} color="#fff" />
        </div>
        <span style={{ fontWeight: '700', fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
          Real-Time Chat
        </span>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Real-time Notification Bell */}
          <NotificationBell
            pendingRequests={pendingRequests}
            notifications={notifications}
            onAcceptRequestClick={onAcceptRequestClick}
            onNotificationClick={onNotificationClick}
            onClearNotifications={onClearNotifications}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar name={user.username} size="sm" online />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                {user.username}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {user.email}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            icon={LogOut}
            title="Log Out"
          >
            Logout
          </Button>
        </div>
      )}
    </header>
  );
};
