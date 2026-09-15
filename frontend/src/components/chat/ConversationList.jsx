import React from 'react';
import { Avatar } from '../common/Avatar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { MessageSquare, Star, Lock } from 'lucide-react';

export const ConversationList = ({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  loading = false,
  currentUserId,
  onlineUserIds = new Set(),
  starredFriendIds = new Set(),
  onConversationContextMenu
}) => {
  if (loading) {
    return <LoadingSpinner text="Loading conversations..." />;
  }

  if (!conversations || conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No Conversations Yet"
        description="Search for a registered user above to start a private chat."
      />
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

  // Sort: Starred conversations float to top
  const sortedConversations = [...conversations].sort((a, b) => {
    const otherA = getOtherParticipant(a.participants, currentUserId);
    const otherB = getOtherParticipant(b.participants, currentUserId);
    const isStarredA = otherA ? starredFriendIds.has(otherA.id) : false;
    const isStarredB = otherB ? starredFriendIds.has(otherB.id) : false;
    if (isStarredA && !isStarredB) return -1;
    if (!isStarredA && isStarredB) return 1;
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
      {sortedConversations.map((conv) => {
        const otherParticipant = getOtherParticipant(conv.participants, currentUserId);
        const displayName = otherParticipant ? otherParticipant.username : 'Chat';
        const isOnline = otherParticipant ? onlineUserIds.has(otherParticipant.id) : false;
        const isStarred = otherParticipant ? starredFriendIds.has(otherParticipant.id) : false;
        const isLocked = localStorage.getItem(`chat_locked_${conv.id}`) === 'true';
        const isActive = conv.id === activeConversationId;

        return (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (onConversationContextMenu) onConversationContextMenu(e, conv);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-color)',
              cursor: 'pointer',
              backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'all var(--transition-fast)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Avatar name={displayName} size="md" online={isOnline} />
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isStarred && <Star size={14} fill="#f59e0b" color="#f59e0b" title="Starred Favorite" />}
                  {isLocked && <Lock size={12} color="#f87171" title="Locked Chat" />}
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Private 1-on-1 Chat
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
