import React from 'react';
import { Header } from './Header';

export const ChatLayout = ({ sidebarContent, mainContent, showMobileSidebar = true }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 64px)', overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar Panel */}
        <aside
          style={{
            width: '340px',
            minWidth: '300px',
            borderRight: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-glass)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2,
            transition: 'transform 0.3s ease'
          }}
          className="chat-sidebar"
        >
          {sidebarContent}
        </aside>

        {/* Main Conversation View Panel */}
        <main style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}>
          {mainContent}
        </main>
      </div>
    </div>
  );
};
