import React from 'react';

export const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px', color: 'var(--text-muted)' }}>
      <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px', color: 'var(--primary)' }}></div>
      <span style={{ fontSize: '0.9rem' }}>{text}</span>
    </div>
  );
};
