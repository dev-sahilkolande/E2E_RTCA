import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../common/Button';

export const MessageComposer = ({ onSendMessage, onTyping, disabled = false }) => {
  const [content, setContent] = useState('');
  const typingTimerRef = useRef(null);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setContent(val);

    if (onTyping) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (onTyping) onTyping(false);

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
        onChange={handleInputChange}
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
