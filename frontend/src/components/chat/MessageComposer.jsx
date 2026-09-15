import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../common/Button';

export const MessageComposer = ({ onSendMessage, disabled = false }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;
    onSendMessage(content.trim());
    setContent('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-glass)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      <input
        type="text"
        className="input-field"
        placeholder="Type a private message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{ flex: 1, padding: '12px 16px', fontSize: '0.92rem' }}
      />

      <Button
        type="submit"
        variant="primary"
        disabled={!content.trim() || disabled}
        icon={Send}
        style={{ borderRadius: 'var(--radius-md)', padding: '12px 20px' }}
      >
        Send
      </Button>
    </form>
  );
};
