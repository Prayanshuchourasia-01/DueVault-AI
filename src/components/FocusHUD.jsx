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

  useEffect(() => {
    const interval = setInterval(() => {
      setTicks(t => t + 1);
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasActive = !!activeTask;
  
  const title = hasActive ? activeTask.title : "Free Time / Focus Prep";
  const urgency = hasActive ? activeTask.urgency : "LOW";
  const type = hasActive ? activeTask.type : "Break";
  const targetTime = hasActive ? activeTask.end : (nextTask ? nextTask.start : null);
  
  const countdownStr = targetTime ? formatCountdown(targetTime) : "--:--:--";
  const progressPercent = hasActive ? getTaskProgress(activeTask.start, activeTask.end) : 0;

  return (
    <div className={`bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border transition-all duration-300 shadow-xl ${
      hasActive 
        ? (urgency === 'HIGH' ? 'border-rose-500/50 shadow-rose-900/20' : 'border-indigo-500/50 shadow-indigo-900/20')
        : 'border-slate-800'
    }`}>
      
      <div className="flex flex-col gap-6 relative z-10">
        
        {/* Header Tags */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
              hasActive 
                ? (urgency === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400')
                : 'bg-slate-800 text-slate-400'
            }`}>
              {type}
            </span>
            {hasActive && urgency === 'HIGH' && (
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                HIGH PRIORITY
              </span>
            )}
          </div>
          <div className="text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            {currentTime.toLocaleTimeString('en-US', { hour12: true })}
          </div>
        </div>
        
        {/* Main Countdown & Title */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white line-clamp-2">
            {title}
          </h1>
          
          <div className="flex flex-col">
            <span className="text-5xl md:text-6xl font-mono font-black tracking-tight text-white drop-shadow-md">
              {countdownStr}
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-2 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" />
              {hasActive ? "Remaining" : (nextTask ? "Until Next Task" : "System Idle")}
            </span>
          </div>
        </div>

        {/* Action / Progress Area */}
        {hasActive ? (
          <div className="space-y-4 pt-4 border-t border-slate-800/50">
            <div className="flex justify-between items-center text-sm text-slate-400 font-medium">
              <span>{formatFriendlyTime(activeTask.start)} - {formatFriendlyTime(activeTask.end)}</span>
              <span className="font-mono text-white">{progressPercent}%</span>
            </div>
            
            {/* Linear Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div 
                className={`h-full transition-all duration-1000 rounded-full ${
                  urgency === 'HIGH' ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-indigo-600 to-cyan-400'
                }`} 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onToggleComplete(activeTask.id)}
                className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  urgency === 'HIGH'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                Mark Complete
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="p-2 bg-slate-800 rounded-lg">
                <Coffee className="w-5 h-5" />
              </div>
              {nextTask ? (
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider font-semibold">Up Next</span>
                  <span className="text-sm font-medium text-white">{nextTask.title} <span className="text-slate-500 font-normal">at {formatFriendlyTime(nextTask.start)}</span></span>
                </div>
              ) : (
                <span className="text-sm">No tasks scheduled. Take a break!</span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
