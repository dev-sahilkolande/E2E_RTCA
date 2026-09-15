import React from 'react';
import { MessageSquare } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = MessageSquare,
  title = 'No Data Found',
  description = 'There is nothing to display here yet.',
  action
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        gap: '12px'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-dim)',
          marginBottom: '4px'
        }}
      >
        <Icon size={28} />
      </div>
      <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '600' }}>{title}</h4>
      <p style={{ fontSize: '0.88rem', maxWidth: '300px', margin: 0 }}>{description}</p>
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
};
