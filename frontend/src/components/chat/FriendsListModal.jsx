import React, { useState, useEffect } from 'react';
import { Users, Star, MessageSquare, UserMinus, X, Search } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import api from '../../services/api';

export const FriendsListModal = ({ onClose, onSelectFriendChat, onlineUserIds = new Set() }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' or 'starred'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await api.get('/friends');
      if (res.data && res.data.success) {
        setFriends(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleToggleStar = async (friendId) => {
    try {
      const res = await api.post(`/friends/${friendId}/star`);
      if (res.data && res.data.success) {
        setFriends((prev) =>
          prev.map((f) =>
            f.friend?.id === friendId ? { ...f, isStarred: res.data.data } : f
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle star status:', err);
    }
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    if (!window.confirm(`Remove ${friendName} from your friends list?`)) return;

    try {
      await api.delete(`/friends/${friendId}`);
      setFriends((prev) => prev.filter((f) => f.friend?.id !== friendId));
    } catch (err) {
      console.error('Failed to remove friend:', err);
    }
  };

  const filteredFriends = friends.filter((item) => {
    const friend = item.friend;
    if (!friend) return false;
    const matchesSearch =
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'starred') {
      return matchesSearch && item.isStarred;
    }
    return matchesSearch;
  });

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
          maxWidth: '500px',
          maxHeight: '80vh',
          backgroundColor: 'var(--bg-elevated, #1e1e2e)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #2f2f45)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
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
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff', margin: 0 }}>
                My Friends & Contacts
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim, #94a3b8)', margin: 0 }}>
                Manage your chat partners and starred favorites
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

        {/* Search & Tabs Toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color, #2f2f45)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim, #94a3b8)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends by name or email..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                backgroundColor: 'var(--bg-dark, #12121e)',
                border: '1px solid var(--border-color, #2f2f45)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setFilterTab('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: filterTab === 'all' ? 'var(--primary, #7c3aed)' : 'transparent',
                color: filterTab === 'all' ? '#fff' : 'var(--text-dim, #94a3b8)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              All Friends ({friends.length})
            </button>
            <button
              onClick={() => setFilterTab('starred')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: filterTab === 'starred' ? '#f59e0b' : 'transparent',
                color: filterTab === 'starred' ? '#fff' : 'var(--text-dim, #94a3b8)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Star size={14} fill={filterTab === 'starred' ? '#fff' : 'none'} />
              Favorites ({friends.filter((f) => f.isStarred).length})
            </button>
          </div>
        </div>

        {/* Friends List Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {loading ? (
            <LoadingSpinner text="Loading friends..." />
          ) : filteredFriends.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim, #94a3b8)', fontSize: '0.85rem' }}>
              {filterTab === 'starred' ? 'No starred favorite friends yet.' : 'No friends found.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredFriends.map((item) => {
                const friend = item.friend;
                const isOnline = onlineUserIds.has(friend.id);

                return (
                  <div
                    key={`friend-${friend.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color, #2f2f45)',
                      borderRadius: '10px',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar name={friend.username} size="sm" online={isOnline} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: '600', color: '#fff' }}>
                          {friend.username}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim, #94a3b8)' }}>
                          {friend.email}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Star / Favorite Button */}
                      <button
                        onClick={() => handleToggleStar(friend.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: item.isStarred ? '#f59e0b' : 'var(--text-dim, #94a3b8)',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px'
                        }}
                        title={item.isStarred ? 'Unstar Favorite' : 'Star as Favorite'}
                      >
                        <Star size={18} fill={item.isStarred ? '#f59e0b' : 'none'} />
                      </button>

                      {/* Start / Open Chat Button */}
                      <button
                        onClick={() => {
                          onClose();
                          if (onSelectFriendChat) onSelectFriendChat(friend);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--primary, #7c3aed)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <MessageSquare size={14} />
                        Chat
                      </button>

                      {/* Remove Friend Button */}
                      <button
                        onClick={() => handleRemoveFriend(friend.id, friend.username)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px'
                        }}
                        title="Remove Friend"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
