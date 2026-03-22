import { useState, useEffect } from 'react';
import type { LoaderState } from '../hooks/useModelLoader';

interface Props {
  state: LoaderState;
  progress: number;
  error: string | null;
  onLoad: () => void;
  label: string;
}

export function ModelBanner({ state, progress, error, onLoad, label }: Props) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (state !== 'ready') {
      setVisible(true);
      setFadingOut(false);
    } else if (visible && !fadingOut) {
      setFadingOut(true);
      const timer = setTimeout(() => setVisible(false), 500); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [state, visible, fadingOut]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--bg)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      opacity: fadingOut ? 0 : 1,
      transition: 'opacity 0.5s ease-in-out',
      pointerEvents: fadingOut ? 'none' : 'auto'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>One-time setup</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.5' }}>
          Conversa downloads AI models to your device. After this, everything runs offline — no internet needed, ever.
        </p>

        {state === 'idle' && (
          <button className="btn btn-primary btn-lg" onClick={onLoad} style={{ width: '100%', marginBottom: '32px' }}>
            Download &amp; Start ({label})
          </button>
        )}

        {(state === 'downloading' || state === 'loading') && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>{state === 'downloading' ? `Downloading ${label}...` : `Loading ${label} into engine...`}</span>
              <span>{(progress * 100).toFixed(0)}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Downloading once. Running forever.
            </div>
          </div>
        )}

        {state === 'error' && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ color: 'var(--red)', marginBottom: '16px', fontSize: '14px' }}>{error}</div>
            <button className="btn btn-primary" onClick={onLoad}>Retry Download</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '32px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '20px' }}>⚡</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Sub-100ms responses</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lightning fast local execution</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '20px' }}>🔒</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>100% private</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Data never leaves your device</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '20px' }}>✈️</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Works in airplane mode</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fully offline capable</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
