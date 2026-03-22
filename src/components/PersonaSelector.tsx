import { useState } from 'react';

const PERSONAS = [
  {
    id: 'study-buddy',
    icon: '🎓',
    name: 'Study Buddy',
    desc: 'Patient tutor, explains concepts clearly',
    prompt: 'You are a patient, encouraging tutor. Explain concepts clearly in simple terms. Ask follow-up questions to check understanding. Keep responses concise for voice.'
  },
  {
    id: 'language-coach',
    icon: '🗣️',
    name: 'Language Coach',
    desc: 'Helps improve fluency and pronunciation',
    prompt: 'You are a friendly language coach. Help the user practice conversational English. Gently correct grammar mistakes. Keep responses short and spoken naturally.'
  },
  {
    id: 'daily-assistant',
    icon: '🤝',
    name: 'Daily Assistant',
    desc: 'Friendly helper for tasks and questions',
    prompt: 'You are a helpful, concise voice assistant. Answer questions directly. Keep all responses under 3 sentences for voice delivery.'
  }
];

interface Props {
  onStart: (systemPrompt: string) => void;
}

export function PersonaSelector({ onStart }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleStart = () => {
    const selected = PERSONAS.find(p => p.id === selectedId);
    if (selected) {
      onStart(selected.prompt);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Choose your Assistant</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Select a persona for your voice session.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', width: '100%', maxWidth: '800px', marginBottom: '32px' }}>
        {PERSONAS.map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{
                background: isSelected ? 'var(--bg-input)' : 'var(--bg-card)',
                border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: '24px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '48px', lineHeight: 1 }}>{p.icon}</div>
              <h3 style={{ fontSize: '16px', color: 'var(--text)', margin: 0 }}>{p.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{p.desc}</p>
            </button>
          );
        })}
      </div>

      <button 
        className="btn btn-primary btn-lg" 
        disabled={!selectedId} 
        onClick={handleStart}
        style={{ opacity: selectedId ? 1 : 0.5, transition: 'opacity 0.2s' }}
      >
        Start Conversation
      </button>
    </div>
  );
}
