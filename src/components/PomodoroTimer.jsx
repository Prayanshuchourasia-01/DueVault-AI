import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, BrainCircuit, Settings2, X } from 'lucide-react';

export const PomodoroTimer = ({ startAlarm }) => {
  const [customFocusMin, setCustomFocusMin] = useState(30);
  const [customRestMin, setCustomRestMin] = useState(2);
  const [showSettings, setShowSettings] = useState(false);

  // Dynamic durations based on custom settings
  const FOCUS_TIME = customFocusMin * 60;
  const REST_TIME = customRestMin * 60;

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
  }, [isRunning, timeLeft, mode, startAlarm, FOCUS_TIME, REST_TIME]);

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

  const applyCustomSettings = () => {
    setShowSettings(false);
    setTimeLeft(mode === 'FOCUS' ? customFocusMin * 60 : customRestMin * 60);
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
        
        <div className="flex bg-slate-800 rounded-lg p-1 items-center">
          <button 
            onClick={() => switchMode('FOCUS')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'FOCUS' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Focus ({customFocusMin}m)
          </button>
          <button 
            onClick={() => switchMode('REST')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mode === 'REST' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Rest ({customRestMin}m)
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`ml-2 p-1.5 rounded-md transition-all ${showSettings ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            title="Custom Timer Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-slate-950/50 border border-slate-800 rounded-xl relative animate-in fade-in slide-in-from-top-2">
          <button onClick={() => setShowSettings(false)} className="absolute top-2 right-2 text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
          <h4 className="text-xs font-bold text-indigo-400 mb-3 uppercase tracking-wider">Custom Timer Durations</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Focus Time (min)</label>
              <input 
                type="number" 
                min="1" 
                max="120"
                value={customFocusMin}
                onChange={e => setCustomFocusMin(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Rest Time (min)</label>
              <input 
                type="number" 
                min="1" 
                max="60"
                value={customRestMin}
                onChange={e => setCustomRestMin(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <button 
            onClick={applyCustomSettings}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs transition-all"
          >
            Apply Durations
          </button>
        </div>
      )}

      <div className="flex flex-col items-center justify-center py-6">
        <div className={`text-6xl font-mono font-extrabold tracking-widest ${mode === 'FOCUS' ? 'text-cyan-400' : 'text-emerald-400'} drop-shadow-md mb-6`}>
          {formatTime(timeLeft)}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 mb-8">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${mode === 'FOCUS' ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
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
