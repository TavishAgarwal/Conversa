import React from 'react';

export const Transcript: React.FC<{
  userText: string;
  aiText: string;
  isStreaming: boolean;
}> = ({ userText, aiText, isStreaming }) => {
  if (!userText && !aiText) return null;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm mt-8 relative overflow-hidden">
      {/* User Transcript */}
      {userText && (
        <div className="flex flex-col items-end animate-in fade-in slide-in-from-bottom-2">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-semibold">You</div>
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-2xl rounded-tr-sm inline-block max-w-[85%] text-right font-medium leading-relaxed">
            {userText}
          </div>
        </div>
      )}

      {/* AI Transcript */}
      {(aiText || isStreaming) && (
        <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 mt-2">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-widest font-semibold flex items-center gap-2">
            Assistant
            {isStreaming && (
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </div>
          <div className="bg-muted text-foreground px-4 py-3 rounded-2xl rounded-tl-sm inline-block max-w-[85%] font-medium leading-relaxed">
            {aiText}
            {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-primary align-middle animate-pulse" />}
          </div>
        </div>
      )}
    </div>
  );
};
