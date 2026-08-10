import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, AlertTriangle, Coffee, Timer, Clock, CalendarClock } from 'lucide-react';
import { 
  formatCountdown, 
  getTaskProgress, 
  formatFriendlyTime, 
  calculateRemainingTime 
} from '../utils/timeUtils';

export const FocusHUD = ({ activeTask, nextTask, todaysRoutines = [], onToggleComplete }) => {
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
  const hasNext = !!nextTask;
  
  // Check if there are truly NO more blocks left today (all ended)
  const now = new Date();
  const hasRemainingBlocks = todaysRoutines.some(t => {
    if (t.completed) return false;
    const endTime = new Date(t.end);
    return !isNaN(endTime.getTime()) && endTime > now;
  });

  const title = hasActive ? activeTask.title : (hasNext ? nextTask.title : "Free Time / Focus Prep");
  const urgency = hasActive ? (activeTask.priority || activeTask.urgency) : "LOW";
  const type = hasActive ? (activeTask.category || activeTask.type || "TASK") : (hasNext ? (nextTask.category || "UPCOMING") : "Break");
  const targetTime = hasActive ? activeTask.end : (hasNext ? nextTask.start : null);
  
  const countdownStr = targetTime ? formatCountdown(targetTime) : "--:--:--";
  const progressPercent = hasActive && activeTask.start && activeTask.end ? getTaskProgress(activeTask.start, activeTask.end) : 0;

  // STATE 1: All blocks truly completed for today
  if (!hasActive && !hasNext && !hasRemainingBlocks) {
    return (
      <div className="bg-emerald-950/20 md:bg-emerald-950/30 md:backdrop-blur-md py-10 px-4 md:p-8 md:rounded-2xl border-b md:border border-emerald-500/20 md:border-emerald-500/30 md:shadow-xl md:shadow-emerald-950/20 text-center space-y-4 animate-fade-in w-full">
        <div className="inline-flex p-4 bg-emerald-500/20 text-emerald-400 rounded-full animate-bounce">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-emerald-400 tracking-tight">Today's Work Completed!</h2>
        <p className="text-slate-300 text-sm max-w-sm mx-auto leading-relaxed">
          You've completed all scheduled timetable blocks and routines for today. Great job staying focused!
        </p>
        <div className="text-xs font-mono text-emerald-500 bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-800/30 inline-block">
          {currentTime.toLocaleTimeString('en-US', { hour12: true })}
        </div>
      </div>
    );
  }

  // STATE 2: No active block, but there are upcoming blocks
  if (!hasActive && hasNext) {
    return (
      <div className="md:bg-slate-900/80 md:backdrop-blur-md pt-2 pb-6 px-4 md:p-8 md:rounded-2xl border-b md:border transition-all duration-300 md:shadow-xl border-indigo-500/30 md:border-indigo-500/50 md:shadow-indigo-900/20 bg-indigo-950/10 md:bg-slate-900/80">
        <div className="flex flex-col gap-6 relative z-10">
          
          {/* Header Tags */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400">
                {type}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                <CalendarClock className="w-3 h-3" />
                UPCOMING
              </span>
            </div>
            <div className="text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              {currentTime.toLocaleTimeString('en-US', { hour12: true })}
            </div>
          </div>
          
          {/* Main Countdown & Title */}
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white line-clamp-2">
              {nextTask.title}
            </h1>
            
            <div className="flex flex-col">
              <span className="text-5xl md:text-6xl font-mono font-black tracking-tight text-white drop-shadow-md">
                {countdownStr}
              </span>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-2 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                Until Block Starts
              </span>
            </div>
          </div>

          {/* Next block time info */}
          <div className="pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">Next Block</span>
                <span className="text-sm font-medium text-white">
                  {formatFriendlyTime(nextTask.start)} — {formatFriendlyTime(nextTask.end)}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // STATE 3: A block is currently active
  return (
    <div className={`md:bg-slate-900/80 md:backdrop-blur-md pt-2 pb-6 px-4 md:p-8 md:rounded-2xl border-b md:border transition-all duration-300 md:shadow-xl ${
      hasActive 
        ? (urgency === 'HIGH' ? 'border-rose-500/30 md:border-rose-500/50 md:shadow-rose-900/20 bg-rose-950/10 md:bg-slate-900/80' : 'border-indigo-500/30 md:border-indigo-500/50 md:shadow-indigo-900/20 bg-indigo-950/10 md:bg-slate-900/80')
        : 'border-slate-800'
    }`}>
      
      <div className="flex flex-col gap-6 relative z-10">
        
        {/* Header Tags */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
              hasActive 
                ? ((urgency === 'HIGH' || urgency === 'CRITICAL') ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400')
                : 'bg-slate-800 text-slate-400'
            }`}>
              {type}
            </span>
            {hasActive && (urgency === 'HIGH' || urgency === 'CRITICAL') && (
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
              {hasActive ? "Remaining" : "System Idle"}
            </span>
          </div>
        </div>

        {/* Action / Progress Area */}
        {hasActive ? (
          <div className="space-y-4 pt-4 border-t border-slate-800/50">
            <div className="flex justify-between items-center text-sm text-slate-400 font-medium">
              <span>{activeTask.start ? formatFriendlyTime(activeTask.start) : 'No Start Time'} - {activeTask.end ? formatFriendlyTime(activeTask.end) : 'No End Time'}</span>
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
                  (urgency === 'HIGH' || urgency === 'CRITICAL')
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
              <span className="text-sm">No tasks scheduled. Take a break!</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
