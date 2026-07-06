import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, BrainCircuit } from 'lucide-react';

export const PomodoroTimer = ({ startAlarm }) => {
  const FOCUS_TIME = 30 * 60; // 30 minutes
  const REST_TIME = 2 * 60;   // 2 minutes

  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('FOCUS'); // 'FOCUS' or 'REST'

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      // Phase Complete
      const tone = localStorage.getItem('duevault_ringtone') || 'modern-chime';
      startAlarm(tone, {
        title: mode === 'FOCUS' ? "FOCUS PHASE COMPLETE" : "REST PHASE COMPLETE",
        message: mode === 'FOCUS' ? "Great job. Time to take a short break." : "Break is over. Get ready to focus."
      });
      
      // Auto-switch mode
      if (mode === 'FOCUS') {
        setMode('REST');
        setTimeLeft(REST_TIME);
      } else {
        setMode('FOCUS');
        setTimeLeft(FOCUS_TIME);
        setIsRunning(false); // Stop after a full cycle
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, startAlarm]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'FOCUS' ? FOCUS_TIME : REST_TIME);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(newMode === 'FOCUS' ? FOCUS_TIME : REST_TIME);
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTime = mode === 'FOCUS' ? FOCUS_TIME : REST_TIME;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background Accents */}
      <div className={`absolute top-0 left-0 w-full h-1 ${mode === 'FOCUS' ? 'bg-cyan-500' : 'bg-emerald-500'}`} />
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          {mode === 'FOCUS' ? <BrainCircuit className="w-5 h-5 text-cyan-400" /> : <Coffee className="w-5 h-5 text-emerald-400" />}
          Paradroma Timer
        </h3>
        
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button 
            onClick={() => switchMode('FOCUS')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'FOCUS' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Focus (30m)
          </button>
          <button 
            onClick={() => switchMode('REST')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'REST' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Rest (2m)
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <div className={`text-6xl font-mono font-extrabold tracking-widest ${mode === 'FOCUS' ? 'text-cyan-400' : 'text-emerald-400'} drop-shadow-md mb-6`}>
          {formatTime(timeLeft)}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 mb-8">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${mode === 'FOCUS' ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <button 
            onClick={toggleTimer}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isRunning 
                ? 'bg-slate-800 text-red-400 hover:bg-slate-700' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)]'
            }`}
          >
            {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>
          <button 
            onClick={resetTimer}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

    </div>
  );
};
