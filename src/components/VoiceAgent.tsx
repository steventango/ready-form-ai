import { Mic, MicOff } from 'lucide-react';
import React from 'react';

interface VoiceAgentProps {
  isListening: boolean;
  isSpeaking: boolean;
  lastTranscript: string;
  onToggle: () => void;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({
  isListening,
  isSpeaking,
  lastTranscript,
  onToggle
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      width: '100%',
    }}>
      <div className="flex-center" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: isListening ? '#22c55e' : isSpeaking ? 'var(--accent)' : 'var(--text-muted)',
            boxShadow: isListening ? '0 0 15px #22c55e' : isSpeaking ? '0 0 15px var(--accent)' : 'none',
            transition: 'all 0.3s ease'
          }} />
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>GovAI Agent</span>
        </div>
        <button
          onClick={onToggle}
          style={{
            background: isListening ? '#ef4444' : 'var(--primary)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          {isListening ? <MicOff size={20} color="white" /> : <Mic size={20} color="white" />}
        </button>
      </div>

      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '1rem',
        borderRadius: 'var(--radius-sm)',
        minHeight: '60px',
        fontSize: '0.95rem',
        color: lastTranscript ? 'var(--text-main)' : 'var(--text-muted)',
        fontStyle: lastTranscript ? 'normal' : 'italic'
      }}>
        {lastTranscript || (isListening ? "Listening..." : "Click microphone to start")}
      </div>
    </div>
  );
};
