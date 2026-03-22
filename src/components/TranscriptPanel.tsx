import { useEffect, useRef } from 'react';

export interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface Props {
  messages: TranscriptMessage[];
  onClear: () => void;
}

export function TranscriptPanel({ messages, onClear }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-card)', borderRadius: 'var(--radius)', marginTop: '16px', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', margin: 0 }}>Conversation Log</h3>
          <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--green)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🔒</span> All processing on-device &middot; 0 bytes sent externally
          </span>
        </div>
        <button className="btn btn-sm" onClick={onClear} disabled={messages.length === 0}>
          Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
            No transcript yet. Start speaking!
          </div>
        ) : (
          messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const timeString = msg.timestamp 
              ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginLeft: '4px', marginRight: '4px' }}>
                  <strong>{isUser ? 'You' : 'Conversa'}</strong> &middot; {timeString}
                </div>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderBottomRightRadius: isUser ? '4px' : '12px',
                  borderBottomLeftRadius: !isUser ? '4px' : '12px',
                  backgroundColor: isUser ? '#6366f1' : 'var(--bg-input)',
                  color: isUser ? 'white' : 'var(--text)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
