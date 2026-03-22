import { useState } from 'react';

interface Props {
  wordsSpoken: number;
  aiResponses: number;
}

export function PrivacyStats({ wordsSpoken, aiResponses }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px'
    }}>
      {expanded && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          fontSize: '13px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '200px',
          animation: 'fadeInUp 0.2s ease-out'
        }}>
          <h4 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Session Privacy Stats</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎙️</span> <span>Words spoken: <strong>{wordsSpoken}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🤖</span> <span>AI responses: <strong>{aiResponses}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)' }}>
            <span>☁️</span> <span>Data sent to cloud: <strong>0 bytes</strong></span>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: expanded ? 'var(--primary)' : 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: expanded ? 'white' : 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'all 0.2s'
        }}
        title="Privacy Stats"
      >
        🛡️
      </button>
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
