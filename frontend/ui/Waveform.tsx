import React, { useEffect, useRef } from 'react';

/**
 * Animated waveform UI using canvas for voice visualization
 */
export const Waveform: React.FC<{
  isActive: boolean;
  color?: string;
}> = ({ isActive, color = 'var(--primary)' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrame = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.beginPath();
      ctx.moveTo(0, centerY);
      
      const amplitude = isActive ? 20 + Math.sin(time * 0.1) * 10 : 2;
      const frequency = isActive ? 0.05 : 0.02;

      for (let i = 0; i < width; i++) {
        const y = centerY + Math.sin(i * frequency + time * 0.2) * Math.sin(i * 0.01) * amplitude;
        ctx.lineTo(i, y);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = isActive ? 3 : 1;
      ctx.stroke();

      time++;
      animFrame.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [isActive, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full max-w-xs transition-opacity duration-300 pointer-events-none"
      style={{ opacity: isActive ? 1 : 0.4 }}
    />
  );
};
