import React, { useEffect, useRef } from 'react';

interface Message {
  role: 'agent' | 'user';
  text: string;
  timestamp: number;
}

interface ConversationLogProps {
  messages: Message[];
}

export const ConversationLog: React.FC<ConversationLogProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>Conversation will appear here...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: '1 1 0',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '1rem',
      minHeight: 0
    }}>
      {messages.map((msg, idx) => (
        <div
          key={msg.timestamp + idx}
          style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '0.75rem 1rem',
            borderRadius: '1rem',
            borderBottomLeftRadius: msg.role === 'agent' ? '0' : '1rem',
            borderBottomRightRadius: msg.role === 'user' ? '0' : '1rem',
            background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-surface)',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontSize: '0.95rem'
          }}
        >
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>
            {msg.role === 'agent' ? 'GovAI Agent' : 'Demo User'}
          </div>
          {msg.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};
