import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Activity, CheckCircle2, TrendingUp, Clock, Code2, Briefcase, BrainCircuit, CheckSquare, Square, Filter } from 'lucide-react';
import { combineDateAndTime } from '../../utils/timeUtils';

// Drag-to-Scroll Hook
const useDragScroll = () => {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };
  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

  return { ref, onMouseDown, onMouseLeave, onMouseUp, onMouseMove, style: { cursor: isDragging ? 'grabbing' : 'grab' } };
};

const DEEP_WORK_CATEGORIES = ['coding', 'logic', 'study', 'class', 'lab', 'hackathon', 'development', 'engineering'];

const DashboardTab = ({ tasks, routines, onToggleComplete }) => {
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA');
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('en-CA');

  const [timeFilter, setTimeFilter] = useState('TODAY'); // 'TODAY', 'TOMORROW', 'WEEK'

  const dragScrollProps = useDragScroll();
  const activeBlockRef = useRef(null);

  // Auto-scroll on mount or filter change
  useEffect(() => {
    if (activeBlockRef.current && dragScrollProps.ref.current) {
      setTimeout(() => {
        activeBlockRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 300);
    }
  }, [timeFilter]);

  // Calculate upcoming 7 days
  const fullUpcomingWeek = useMemo(() => {
    let weekTasks = [];
    
    // Simulate routine spawns for the next 7 days (timetable page blocks only)
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + i);
      const targetDateStr = targetDate.toLocaleDateString('en-CA');
      const targetDayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

      routines.forEach(r => {
        if (r.dayOfWeek !== targetDayName) return;
        if (r.validFrom && targetDateStr < r.validFrom) return;
        if (r.validUntil && targetDateStr > r.validUntil) return;
        
        const exception = (r.exceptions && r.exceptions[targetDateStr]) ? r.exceptions[targetDateStr] : null;
        if (exception && exception.type === 'deleted') return;

        const rStart = exception?.start || r.start;
        const rEnd = exception?.end || r.end;
        const rTitle = exception?.title || r.title;
        const rCat = exception?.category || r.category;
        const isCompleted = exception?.completed || false;

        weekTasks.push({
          id: `routine-spawn-${r.id}-${targetDateStr}`,
          title: rTitle,
          category: rCat,
          date: targetDateStr,
          start: combineDateAndTime(targetDateStr, rStart),
          end: combineDateAndTime(targetDateStr, rEnd),
          priority: 'MEDIUM',
          completed: isCompleted,
          isRoutine: true
        });
      });
    }

    return weekTasks.sort((a, b) => new Date(a.start || a.date) - new Date(b.start || b.date));
  }, [routines]);

  // Filter based on UI toggle
  const upcomingWeek = useMemo(() => {
    if (timeFilter === 'TODAY') return fullUpcomingWeek.filter(t => t.date === todayStr);
    if (timeFilter === 'TOMORROW') return fullUpcomingWeek.filter(t => t.date === tomorrowStr);
    return fullUpcomingWeek;
  }, [fullUpcomingWeek, timeFilter, todayStr, tomorrowStr]);

  // Analytics Calculations (always calculated on full week for consistency, or just today)
  const analytics = useMemo(() => {
    let deepWorkMs = 0;
    let adminMs = 0;
    let completedCount = 0;
    let totalCount = 0;

    fullUpcomingWeek.forEach(t => {
      if (t.date === todayStr) {
        totalCount++;
        if (t.completed) completedCount++;
      }

      if (t.start && t.end) {
        const duration = new Date(t.end) - new Date(t.start);
        if (duration > 0) {
          const cat = (t.category || '').toLowerCase();
          if (DEEP_WORK_CATEGORIES.some(dw => cat.includes(dw))) {
            deepWorkMs += duration;
          } else {
            adminMs += duration;
          }
        }
      }
    });

    return {
      deepWorkHours: (deepWorkMs / (1000 * 60 * 60)).toFixed(1),
      adminHours: (adminMs / (1000 * 60 * 60)).toFixed(1),
      completedToday: completedCount,
      totalToday: totalCount,
      completionRate: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
    };
  }, [fullUpcomingWeek, todayStr]);

  // Group tasks by date for the pipeline
  const pipelineElements = useMemo(() => {
    const elements = [];
    let currentDateStr = null;
    let foundActive = false;

    upcomingWeek.forEach(task => {
      if (task.date !== currentDateStr) {
        currentDateStr = task.date;
        const taskDate = new Date(task.date);
        const dateDisplay = taskDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        const isToday = task.date === todayStr;

        elements.push(
          <div key={`divider-${task.date}`} className="snap-center shrink-0 flex flex-col items-center justify-center px-4 pointer-events-none">
            <div className={`h-10 w-px ${isToday ? 'bg-cyan-500/50' : 'bg-slate-700'}`}></div>
            <div className={`py-2 px-4 rounded-full font-bold text-xs uppercase tracking-widest my-2 whitespace-nowrap ${isToday ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              {isToday ? 'TODAY' : dateDisplay}
            </div>
            <div className={`h-10 w-px ${isToday ? 'bg-cyan-500/50' : 'bg-slate-700'}`}></div>
          </div>
        );
      }

      const timeDisplay = task.start ? new Date(task.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'All Day';
      const isToday = task.date === todayStr;
      const isBillOrReminder = ['finance', 'bill'].includes(task.category?.toLowerCase()) || (task.reminderDays && task.reminderDays.length > 0);
      
      const isOver = task.end && new Date(task.end) < new Date();
      const isMissed = !task.completed && isOver;

      let priorityColors = {
        'CRITICAL': 'border-red-500/50 bg-red-500/10 text-red-400',
        'HIGH': 'border-orange-500/50 bg-orange-500/10 text-orange-400',
        'MEDIUM': 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
        'LOW': 'border-slate-700 bg-slate-800 text-slate-300'
      };

      if (isBillOrReminder) {
        priorityColors = {
          'CRITICAL': 'border-rose-500 bg-rose-500/20 text-rose-300',
          'HIGH': 'border-rose-500 bg-rose-500/20 text-rose-300',
          'MEDIUM': 'border-rose-500 bg-rose-500/20 text-rose-300',
          'LOW': 'border-rose-500 bg-rose-500/20 text-rose-300'
        };
      }

      if (isMissed) {
        priorityColors = {
          'CRITICAL': 'border-red-800/80 bg-red-950/40 text-red-400 opacity-70',
          'HIGH': 'border-red-800/80 bg-red-950/40 text-red-400 opacity-70',
          'MEDIUM': 'border-red-800/80 bg-red-950/40 text-red-400 opacity-70',
          'LOW': 'border-red-800/80 bg-red-950/40 text-red-400 opacity-70'
        };
      }

      const isActiveCandidate = (timeFilter === 'TOMORROW')
        ? (!task.completed && !foundActive)
        : (isToday && !task.completed && !foundActive);
      
      if (isActiveCandidate) {
        foundActive = true;
      }

      const visualState = task.completed 
        ? 'opacity-40 grayscale' 
        : (isActiveCandidate 
            ? 'shadow-[0_0_20px_rgba(34,211,238,0.2)] ring-2 ring-cyan-400 scale-[1.03] z-10' 
            : 'opacity-90');

      elements.push(
        <div 
          key={task.id} 
          ref={isActiveCandidate ? activeBlockRef : null}
          className={`snap-center shrink-0 w-72 rounded-xl border p-5 flex flex-col gap-3 relative overflow-hidden transition-all ${visualState} select-none ${priorityColors[task.priority] || priorityColors['LOW']}`}
        >
          
          {task.isRoutine && (
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-black/40 text-[9px] font-bold uppercase tracking-widest text-indigo-400 rounded-bl-lg">
              Routine
            </div>
          )}

          {isBillOrReminder && (
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-500/40 text-[9px] font-bold uppercase tracking-widest text-white rounded-bl-lg">
              Action Required
            </div>
          )}

          {isMissed && (
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-red-600 text-[9px] font-bold uppercase tracking-widest text-white rounded-bl-lg">
              TIME OVER
            </div>
          )}

          <div className="flex justify-between items-start pt-2">
            <span className={`text-xs font-bold px-2 py-1 bg-black/30 rounded uppercase tracking-wider border border-current/20 ${isBillOrReminder ? 'text-rose-400' : ''}`}>
              {task.category || 'TASK'}
            </span>
            {onToggleComplete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
                className="hover:scale-110 transition-transform cursor-pointer z-20"
              >
                {task.completed ? <CheckSquare className="w-6 h-6 text-emerald-400" /> : <Square className="w-6 h-6 text-current opacity-50" />}
              </button>
            )}
          </div>
          
          <h4 className={`font-bold text-lg line-clamp-2 leading-tight mt-1 ${task.completed ? 'line-through' : ''}`}>{task.title}</h4>
          
          <div className="mt-auto pt-4 flex flex-col gap-1 text-sm font-medium opacity-80">
            <span className="font-mono">{timeDisplay}</span>
          </div>
        </div>
      );
    });

    return elements;
  }, [upcomingWeek, todayStr, onToggleComplete, timeFilter]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 md:pb-6 font-sans">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            Engineering Analytics HUD
          </h2>
          <p className="text-slate-400 mt-2">Track your deep work density vs. administrative overhead for the next 7 days.</p>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-10 opacity-10 pointer-events-none">
          <BrainCircuit className="w-32 h-32 text-cyan-400" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 group hover:border-cyan-500/50 transition-colors">
          <div className="p-4 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
            <Code2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Deep Work (7D)</p>
            <p className="text-3xl font-bold text-white">{analytics.deepWorkHours} <span className="text-sm text-slate-500 font-medium">hrs</span></p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 group hover:border-indigo-500/50 transition-colors">
          <div className="p-4 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
            <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Admin / Chores (7D)</p>
            <p className="text-3xl font-bold text-white">{analytics.adminHours} <span className="text-sm text-slate-500 font-medium">hrs</span></p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Today's Load</p>
            <p className="text-3xl font-bold text-white">{analytics.completedToday} <span className="text-slate-500 text-lg">/ {analytics.totalToday}</span></p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-4 bg-purple-500/10 rounded-xl text-purple-400">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Daily Completion</p>
            <p className="text-3xl font-bold text-white">{analytics.completionRate}%</p>
          </div>
        </div>

      </div>

      {/* Horizontal Scrolling Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Schedule Pipeline
          </h3>
          
          <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['TODAY', 'TOMORROW', 'WEEK'].map(f => (
              <button 
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeFilter === f ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        
        <div 
          {...dragScrollProps}
          className="flex items-center overflow-x-auto pb-8 pt-4 gap-4 snap-x snap-mandatory hide-scrollbar select-none"
        >
          {upcomingWeek.length === 0 ? (
            <p className="text-slate-500 italic pl-2">No upcoming tasks found for this view.</p>
          ) : (
            pipelineElements
          )}
        </div>
      </div>

    </div>
  );
};

export default DashboardTab;
