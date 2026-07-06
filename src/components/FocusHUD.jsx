import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, AlertTriangle, Coffee, Timer } from 'lucide-react';
import { 
  formatCountdown, 
  getTaskProgress, 
  formatFriendlyTime, 
  calculateRemainingTime 
} from '../utils/timeUtils';

export const FocusHUD = ({ activeTask, nextTask, onToggleComplete }) => {
  const [ticks, setTicks] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Hook into ticking interval to force local re-render every 1s
  useEffect(() => {
    const interval = setInterval(() => {
      setTicks(t => t + 1);
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasActive = !!activeTask;
  
  // Calculate details for current state
  const title = hasActive ? activeTask.title : "Free Time / Focus Prep";
  const urgency = hasActive ? activeTask.urgency : "LOW";
  const type = hasActive ? activeTask.type : "Break";
  const targetTime = hasActive ? activeTask.end : (nextTask ? nextTask.start : null);
  
  const countdownStr = targetTime ? formatCountdown(targetTime) : "--:--:--";
  const progressPercent = hasActive ? getTaskProgress(activeTask.start, activeTask.end) : 0;

  // SVG Radial variables
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className={`glass-panel p-6 rounded-xl border relative overflow-hidden transition-all duration-300 ${
      hasActive 
        ? (urgency === 'HIGH' ? 'border-cyber-crimson/35 crimson-glow' : 'border-cyber-cyan/35 cyan-glow')
        : 'border-cyber-card-border'
    }`}>
      
      {/* Background visualizer details */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-40"></div>
      
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        
        {/* Radial Countdown Indicator */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg className="w-56 h-56 transform -rotate-90">
            {/* Background track circle */}
            <circle
              cx="112"
              cy="112"
              r={radius}
              className="stroke-slate-800/60 fill-none"
              strokeWidth="6"
            />
            {/* Active pulsing circle */}
            <circle
              cx="112"
              cy="112"
              r={radius}
              className={`fill-none transition-all duration-1000 ${
                hasActive 
                  ? (urgency === 'HIGH' ? 'stroke-cyber-crimson' : 'stroke-cyber-cyan') 
                  : 'stroke-cyber-indigo/30'
              }`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={hasActive ? strokeDashoffset : circumference}
              strokeLinecap="round"
            />
          </svg>

          {/* Absolute Counter Text */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl md:text-4xl font-mono tracking-wider font-bold text-slate-100 drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              {countdownStr}
            </span>
            <span className="text-3xs uppercase tracking-widest text-slate-500 font-semibold mt-1.5 flex items-center gap-1">
              <Timer className="w-3 h-3 text-slate-500" />
              {hasActive ? "Remaining" : (nextTask ? "Until Next Task" : "System Idle")}
            </span>
            <span className="text-[10px] font-mono text-slate-400 mt-2 px-2 py-0.5 bg-slate-900/50 rounded-full border border-slate-700/50">
              {currentTime.toLocaleTimeString('en-US', { hour12: true })}
            </span>
          </div>
        </div>

        {/* HUD Details Info */}
        <div className="flex-1 space-y-4 text-center md:text-left w-full">
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <span className={`text-3xs font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                hasActive 
                  ? (urgency === 'HIGH' ? 'bg-red-950/40 text-cyber-crimson border-cyber-crimson/30 animate-pulse' : 'bg-cyan-950/40 text-cyber-cyan border-cyber-cyan/30')
                  : 'bg-indigo-950/40 text-cyber-indigo border-cyber-indigo/30'
              }`}>
                {type}
              </span>
              {hasActive && urgency === 'HIGH' && (
                <span className="text-3xs font-bold uppercase tracking-widest px-2 py-0.5 rounded border bg-red-950/60 text-cyber-crimson border-cyber-crimson/50 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-cyber-crimson animate-bounce" />
                  HIGH PRIORITY
                </span>
              )}
            </div>
            
            <h1 className="text-xl md:text-2xl font-extrabold tracking-wide text-slate-100 uppercase font-sans line-clamp-2">
              {title}
            </h1>
          </div>

          {hasActive ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Timeline: {formatFriendlyTime(activeTask.start)} &rarr; {formatFriendlyTime(activeTask.end)}</span>
                <span className="font-mono">{progressPercent}%</span>
              </div>
              
              {/* Micro-Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800/40">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    urgency === 'HIGH' ? 'bg-cyber-crimson shadow-[0_0_8px_#f43f5e]' : 'bg-cyber-cyan shadow-[0_0_8px_#06b6d4]'
                  }`} 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="pt-2 flex justify-center md:justify-start">
                <button
                  onClick={() => onToggleComplete(activeTask.id)}
                  className={`py-2 px-5 rounded-lg border font-semibold text-xs transition-all duration-250 flex items-center gap-2 ${
                    urgency === 'HIGH'
                      ? 'bg-red-950/20 text-cyber-crimson border-cyber-crimson/40 hover:bg-cyber-crimson hover:text-slate-950 hover:border-cyber-crimson hover:shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                      : 'bg-cyan-950/20 text-cyber-cyan border-cyber-cyan/40 hover:bg-cyber-cyan hover:text-slate-950 hover:border-cyber-cyan hover:shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark Complete</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <div className="flex items-center justify-center md:justify-start gap-2.5 text-slate-400 text-xs">
                <Coffee className="w-4.5 h-4.5 text-cyber-cyan" />
                {nextTask ? (
                  <span>
                    Up Next: <strong className="text-slate-200">{nextTask.title}</strong> at {formatFriendlyTime(nextTask.start)}
                  </span>
                ) : (
                  <span>No tasks scheduled today. Take a break!</span>
                )}
              </div>
              <p className="text-2xs text-slate-500 italic">
                Use the AI Scheduling engine below to command new deadlines.
              </p>
            </div>
          )}

        </div>
      </div>
      
    </div>
  );
};
