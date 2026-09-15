import React from 'react';

export const Avatar = ({ name = '', size = 'md', online = false }) => {
  const getInitials = (str) => {
    if (!str) return '?';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  const sizes = {
    sm: { box: '32px', font: '0.8rem' },
    md: { box: '42px', font: '0.95rem' },
    lg: { box: '56px', font: '1.2rem' }
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          width: currentSize.box,
          height: currentSize.box,
          borderRadius: '50%',
          background: 'var(--accent-gradient)',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: currentSize.font,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px var(--primary-glow)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        {getInitials(name)}
      </div>
      {online && (
        <span
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: '10px',
            height: '10px',
            backgroundColor: 'var(--success)',
            borderRadius: '50%',
            border: '2px solid var(--bg-dark)'
          }}
        />
      )}
    </div>
  );
};
