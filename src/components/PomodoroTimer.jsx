import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, Coffee, BrainCircuit, Settings2, X, ChevronRight } from 'lucide-react';
import { auth } from '../utils/firebase';

const STORAGE_KEY = () => {
  const user = auth.currentUser;
  return user ? `duevault_pomodoro_${user.uid}` : 'duevault_pomodoro_guest';
};

const loadConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY());
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { focusMin: 25, breakMin: 5, breakCount: 1 };
};

const saveConfig = (config) => {
  try { localStorage.setItem(STORAGE_KEY(), JSON.stringify(config)); } catch (e) {}
};

// Build session queue: [WORK, BREAK, WORK, BREAK, ..., WORK]
const buildQueue = (focusMin, breakMin, breakCount) => {
  const totalBreaks = Math.max(0, breakCount);
  const workBlocks = totalBreaks + 1;
  const workSecondsPerBlock = Math.round((focusMin * 60) / workBlocks);
  const breakSeconds = breakMin * 60;

  const queue = [];
  for (let i = 0; i < workBlocks; i++) {
    queue.push({ type: 'WORK', duration: workSecondsPerBlock, label: `Focus ${i + 1}/${workBlocks}` });
    if (i < totalBreaks) {
      queue.push({ type: 'BREAK', duration: breakSeconds, label: `Break ${i + 1}/${totalBreaks}` });
    }
  }
  return queue;
};

export const PomodoroTimer = ({ startAlarm, sendNotification }) => {
  const [config, setConfig] = useState(loadConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [queue, setQueue] = useState(() => buildQueue(config.focusMin, config.breakMin, config.breakCount));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(() => {
    const q = buildQueue(config.focusMin, config.breakMin, config.breakCount);
    return q.length > 0 ? q[0].duration : 0;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const intervalRef = useRef(null);

  const currentSegment = queue[currentIndex] || null;
  const isWork = currentSegment?.type === 'WORK';

  // Tick every second
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft > 0]);

  // Handle segment completion
  useEffect(() => {
    if (!isRunning || timeLeft > 0) return;

    const segment = queue[currentIndex];
    if (!segment) return;

    const tone = localStorage.getItem('duevault_ringtone') || 'modern-chime';
    if (segment.type === 'WORK') {
      if (currentIndex + 1 < queue.length) {
        const msg = "Great focus! Time for a break. Relax and recharge.";
        startAlarm?.(tone, { title: "FOCUS COMPLETE — BREAK TIME", message: msg });
        sendNotification?.("Break Time!", msg);
      } else {
        const msg = "All focus blocks and breaks are done. Excellent session!";
        startAlarm?.(tone, { title: "SESSION COMPLETE", message: msg });
        sendNotification?.("Session Complete!", msg);
        setIsRunning(false);
        setIsComplete(true);
        return;
      }
    } else {
      const msg = "Break is over. Time to get back to focused work!";
      startAlarm?.(tone, { title: "BREAK OVER — BACK TO WORK", message: msg });
      sendNotification?.("Back to Work!", msg);
    }

    const nextIdx = currentIndex + 1;
    if (nextIdx < queue.length) {
      setCurrentIndex(nextIdx);
      setTimeLeft(queue[nextIdx].duration);
    } else {
      setIsRunning(false);
      setIsComplete(true);
    }
  }, [timeLeft, isRunning]);

  const handlePlay = () => {
    if (isComplete) {
      const newQueue = buildQueue(config.focusMin, config.breakMin, config.breakCount);
      setQueue(newQueue);
      setCurrentIndex(0);
      setTimeLeft(newQueue[0]?.duration || 0);
      setIsComplete(false);
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleStop = () => {
    setIsRunning(false);
    setCurrentIndex(0);
    const newQueue = buildQueue(config.focusMin, config.breakMin, config.breakCount);
    setQueue(newQueue);
    setTimeLeft(newQueue[0]?.duration || 0);
    setIsComplete(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(currentSegment?.duration || 0);
  };

  const applySettings = () => {
    saveConfig(config);
    const newQueue = buildQueue(config.focusMin, config.breakMin, config.breakCount);
    setQueue(newQueue);
    setCurrentIndex(0);
    setTimeLeft(newQueue[0]?.duration || 0);
    setIsRunning(false);
    setIsComplete(false);
    setShowSettings(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTime = currentSegment?.duration || 1;
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  const totalSessionSec = queue.reduce((sum, s) => sum + s.duration, 0);
  const elapsedSec = queue.slice(0, currentIndex).reduce((sum, s) => sum + s.duration, 0) + (totalTime - timeLeft);
  const overallProgress = totalSessionSec > 0 ? (elapsedSec / totalSessionSec) * 100 : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-1 ${isWork ? 'bg-cyan-500' : 'bg-emerald-500'}`} />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white flex items-center gap-2 text-base">
          {isWork ? <BrainCircuit className="w-5 h-5 text-cyan-400" /> : <Coffee className="w-5 h-5 text-emerald-400" />}
          Pomodoro Timer
        </h3>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-all cursor-pointer ${showSettings ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
          title="Timer Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-slate-950/50 border border-slate-800 rounded-xl relative animate-in fade-in slide-in-from-top-2">
          <button onClick={() => setShowSettings(false)} className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
          <h4 className="text-xs font-bold text-indigo-400 mb-3 uppercase tracking-wider">Smart Session Planner</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Focus (min)</label>
              <input 
                type="number" min="5" max="180"
                value={config.focusMin}
                onChange={e => setConfig(c => ({ ...c, focusMin: Math.max(5, parseInt(e.target.value) || 5) }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Breaks</label>
              <input 
                type="number" min="0" max="10"
                value={config.breakCount}
                onChange={e => setConfig(c => ({ ...c, breakCount: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Break (min)</label>
              <input 
                type="number" min="1" max="30"
                value={config.breakMin}
                onChange={e => setConfig(c => ({ ...c, breakMin: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-slate-900/60 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Session Preview</p>
            <div className="flex items-center gap-1 flex-wrap">
              {buildQueue(config.focusMin, config.breakMin, config.breakCount).map((seg, i, arr) => (
                <div key={i} className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${seg.type === 'WORK' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {Math.round(seg.duration / 60)}m
                  </span>
                  {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={applySettings}
            className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs transition-all cursor-pointer"
          >
            Apply & Reset Timer
          </button>
        </div>
      )}

      {/* Session Timeline */}
      <div className="flex items-center gap-1.5 mb-6">
        {queue.map((seg, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-2 w-full rounded-full transition-all ${
                isDone ? (seg.type === 'WORK' ? 'bg-cyan-500' : 'bg-emerald-500')
                  : isActive ? (seg.type === 'WORK' ? 'bg-cyan-500/70 shadow-[0_0_8px_#06b6d4]' : 'bg-emerald-500/70 shadow-[0_0_8px_#10b981]')
                  : 'bg-slate-800'
              }`} />
              <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                isActive ? (seg.type === 'WORK' ? 'text-cyan-400' : 'text-emerald-400')
                  : isDone ? 'text-slate-500' : 'text-slate-700'
              }`}>
                {seg.type === 'WORK' ? 'W' : 'B'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Segment Label */}
      <div className="text-center mb-4">
        <span className={`text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full ${
          isComplete ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isWork ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        }`}>
          {isComplete ? '✓ Session Complete' : currentSegment?.label || 'Ready'}
        </span>
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center justify-center py-4 px-2 space-y-5">
        <div className={`text-5xl md:text-6xl font-mono font-black tracking-tight leading-none drop-shadow-md text-center ${
          isComplete ? 'text-emerald-400' : isWork ? 'text-cyan-400' : 'text-emerald-400'
        }`}>
          {isComplete ? '00:00' : formatTime(timeLeft)}
        </div>

        <div className="w-full max-w-xs space-y-2.5">
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-750">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${isWork ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />
          </div>

          <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full rounded-full bg-indigo-500/60 transition-all duration-1000"
              style={{ width: `${Math.max(0, Math.min(100, overallProgress))}%` }}
            />
          </div>
        </div>

        {/* Controls — spacious and unblocked */}
        <div className="flex items-center justify-center gap-5 pt-3">
          <button 
            onClick={isRunning ? handlePause : handlePlay}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isRunning ? 'bg-slate-800 text-amber-400 border border-amber-500/30 hover:bg-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)]'
            }`}
            title={isRunning ? 'Pause' : (isComplete ? 'Restart' : 'Start')}
          >
            {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>

          <button 
            onClick={handleStop}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-800 text-rose-400 border border-rose-500/20 hover:bg-slate-700 hover:text-rose-300 transition-all cursor-pointer"
            title="Stop & Reset"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>

          <button 
            onClick={handleReset}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
            title="Reset Current Segment"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
