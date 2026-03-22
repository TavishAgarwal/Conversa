import { useEffect, useRef } from 'react';

interface Props {
  audioStream: MediaStream | null;
  isTTSSpeaking: boolean;
}

export function WaveformVisualizer({ audioStream, isTTSSpeaking }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    let mediaSource: MediaStreamAudioSourceNode | null = null;
    
    // Set up real audio routing if stream exists and AI isn't speaking
    if (audioStream && !isTTSSpeaking) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      
      // Connect stream to analyser
      try {
        mediaSource = audioCtxRef.current.createMediaStreamSource(audioStream);
        analyser = audioCtxRef.current.createAnalyser();
        analyser.fftSize = 256;
        mediaSource.connect(analyser);
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      } catch (err) {
        console.warn("Could not connect audio stream to AnalyserNode:", err);
      }
    } else {
      // Close context or disconnect if appropriate to free resources
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    }

    let time = 0;

    const draw = () => {
      time += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      let segments = Math.max(100, Math.floor(width / 2));
      let sliceWidth = width / segments;
      let x = 0;

      if (isTTSSpeaking) {
        // AI Speaking (Simulated Teal/Green waveform)
        ctx.strokeStyle = '#10b981';
        for (let i = 0; i <= segments; i++) {
          const val = Math.sin(time * 3 + i * 0.1) * 15 
                    + Math.sin(time * 5 - i * 0.2) * 5
                    + (Math.random() - 0.5) * 6; 
          const y = (height / 2) + val;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
      } else if (analyser && dataArray) {
        // User Speaking (Real Indigo waveform)
        ctx.strokeStyle = '#6366f1';
        analyser.getByteTimeDomainData(dataArray as any);
        sliceWidth = width / dataArray.length;
        
        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * height / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
      } else {
        // Idle / Silent (Subtle muted pulse)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'; 
        for (let i = 0; i <= segments; i++) {
          const val = Math.sin(time + i * 0.05) * 3; 
          const y = (height / 2) + val;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
      }

      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (mediaSource) mediaSource.disconnect();
      if (analyser) analyser.disconnect();
    };
  }, [audioStream, isTTSSpeaking]);

  // Handle canvas inner resolution to avoid pixelation
  useEffect(() => {
    const handleResize = () => {
      const c = canvasRef.current;
      if (c && c.parentElement) {
        c.width = c.parentElement.clientWidth * window.devicePixelRatio;
        c.height = c.parentElement.clientHeight * window.devicePixelRatio;
        const ctx = c.getContext('2d');
        if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };
    handleResize(); // Initial sizing
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width: '100%', height: '80px', margin: '8px 0', overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }} 
      />
    </div>
  );
}
