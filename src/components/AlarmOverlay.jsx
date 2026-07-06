import React from 'react';
import { AlertOctagon, Volume2 } from 'lucide-react';

export const AlarmOverlay = ({ isVisible, title = "SYSTEM ALARM", message = "An alarm has been triggered. Audio alarms are active.", onDismiss }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center p-6 bg-slate-950/90 animate-pulse-alarm text-center">
      
      {/* Glow Rings */}
      <div className="relative flex items-center justify-center w-32 h-32 mb-6">
        <div className="absolute inset-0 rounded-full bg-cyber-crimson/25 animate-ping opacity-75"></div>
        <div className="absolute inset-4 rounded-full bg-cyber-crimson/40 animate-pulse"></div>
        <div className="relative w-20 h-20 rounded-full bg-cyber-crimson border-4 border-slate-950 flex items-center justify-center shadow-lg">
          <AlertOctagon className="w-10 h-10 text-slate-100 animate-bounce" />
        </div>
      </div>

      {/* Warning Text */}
      <div className="max-w-md space-y-4 mb-8">
        <h2 className="text-2xs uppercase tracking-widest text-cyber-crimson font-extrabold font-mono">
          CRITICAL INTENSITY ALERT
        </h2>
        
        <h1 className="text-2xl md:text-3xl font-black tracking-wide text-slate-100 uppercase font-sans leading-snug drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]">
          {title}
        </h1>
        
        <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-sm mx-auto">
          {message}
        </p>
      </div>

      {/* Wave Visualizer Mock */}
      <div className="flex justify-center items-end gap-1 h-8 mb-10 w-full max-w-[140px] pointer-events-none">
        {[0.6, 0.9, 0.4, 0.85, 0.5, 0.95, 0.35, 0.75, 0.55].map((val, idx) => (
          <div 
            key={idx} 
            className="w-1 bg-cyber-crimson rounded-t-sm animate-pulse"
            style={{ 
              height: `${val * 100}%`,
              animationDelay: `${idx * 0.1}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="py-3 px-8 rounded-lg bg-cyber-crimson text-slate-950 hover:bg-slate-100 border border-cyber-crimson font-black text-sm uppercase tracking-widest transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.7)]"
      >
        Dismiss Active Alarm
      </button>

    </div>
  );
};
