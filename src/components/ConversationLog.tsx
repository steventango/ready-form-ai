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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="glass" style={{
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.2)',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Live Transcription</h3>
          <p>Conversation will appear here...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass" style={{
      padding: '1.5rem',
      borderRadius: 'var(--radius-lg)',
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      background: 'rgba(0, 0, 0, 0.2)',
      minHeight: 0
    }}>
      <h3 style={{ position: 'sticky', top: 0, background: 'var(--bg-app)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', margin: '-1rem -1rem 0.5rem -1rem', padding: '1rem', zIndex: 10 }}>
        Live Transcription
      </h3>

      {messages.map((msg, idx) => (
        <div
          key={msg.timestamp + idx}
          style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
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
