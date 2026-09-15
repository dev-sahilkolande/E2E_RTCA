import React from 'react';
import { Search, UserPlus, X, Users } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const UserSearch = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  searchResults = [],
  loading = false,
  onSelectUser,
  onClearSearch,
  onOpenFriendsModal
}) => {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          style={{ position: 'relative', flex: 1 }}
        >
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
          />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '36px', paddingRight: searchQuery ? '36px' : '12px', fontSize: '0.88rem' }}
            placeholder="Search users to add..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          )}
        </form>

        {/* Friends List Button */}
        <button
          onClick={onOpenFriendsModal}
          style={{
            height: '38px',
            padding: '0 12px',
            backgroundColor: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--primary-light, #a78bfa)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
          title="My Friends List & Favorites"
        >
          <Users size={16} />
          Friends
        </button>
      </div>

      {/* Results Dropdown / Panel */}
      {searchQuery.trim().length > 0 && (
        <div
          className="glass-panel"
          style={{
            borderRadius: 'var(--radius-md)',
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {loading ? (
            <LoadingSpinner text="Searching users..." />
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => onSelectUser(user)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar name={user.username} size="sm" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '600' }}>{user.username}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user.email}</span>
                  </div>
                </div>
                <UserPlus size={16} color="var(--primary-light)" />
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No registered users found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
