import React, { useMemo } from 'react';
import { Activity, CheckCircle2, TrendingUp, Clock, Code2, Briefcase, BrainCircuit, CheckSquare, Square } from 'lucide-react';
import { combineDateAndTime } from '../../utils/timeUtils';

const DashboardTab = ({ tasks, routines, onToggleComplete }) => {
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA');
  
  // Calculate upcoming 7 days
  const upcomingWeek = useMemo(() => {
    let weekTasks = [];
    
    // Add explicitly scheduled tasks for the next 7 days
    tasks.forEach(t => {
      const tDate = new Date(t.date);
      const diff = (tDate - today) / (1000 * 60 * 60 * 24);
      if (diff >= -1 && diff <= 7) weekTasks.push(t);
    });

    // Simulate routine spawns for the next 7 days
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

    return weekTasks.sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [tasks, routines]);

  const deepWorkCategories = ['coding', 'logic', 'study', 'class', 'lab', 'hackathon', 'development', 'engineering'];
  
  // Analytics Calculations
  const analytics = useMemo(() => {
    let deepWorkMs = 0;
    let adminMs = 0;
    let completedCount = 0;
    let totalCount = 0;

    upcomingWeek.forEach(t => {
      if (t.date === todayStr) {
        totalCount++;
        if (t.completed) completedCount++;
      }

      if (t.start && t.end) {
        const duration = new Date(t.end) - new Date(t.start);
        if (duration > 0) {
          const cat = (t.category || '').toLowerCase();
          if (deepWorkCategories.some(dw => cat.includes(dw))) {
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
  }, [upcomingWeek, todayStr]);

  // Group tasks by date for the pipeline
  const pipelineElements = useMemo(() => {
    const elements = [];
    let currentDateStr = null;

    upcomingWeek.forEach(task => {
      if (task.date !== currentDateStr) {
        currentDateStr = task.date;
        const taskDate = new Date(task.date);
        const dateDisplay = taskDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        const isToday = task.date === todayStr;

        elements.push(
          <div key={`divider-${task.date}`} className="snap-center shrink-0 flex flex-col items-center justify-center px-4">
            <div className={`h-10 w-px ${isToday ? 'bg-cyan-500/50' : 'bg-slate-700'}`}></div>
            <div className={`py-2 px-4 rounded-full font-bold text-xs uppercase tracking-widest my-2 whitespace-nowrap ${isToday ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              {isToday ? 'TODAY' : dateDisplay}
            </div>
            <div className={`h-10 w-px ${isToday ? 'bg-cyan-500/50' : 'bg-slate-700'}`}></div>
          </div>
        );
      }

      const timeDisplay = new Date(task.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const isToday = task.date === todayStr;
      
      const priorityColors = {
        'CRITICAL': 'border-red-500/50 bg-red-500/10 text-red-400',
        'HIGH': 'border-orange-500/50 bg-orange-500/10 text-orange-400',
        'MEDIUM': 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400',
        'LOW': 'border-slate-700 bg-slate-800 text-slate-300'
      };

      elements.push(
        <div key={task.id} className={`snap-center shrink-0 w-72 rounded-xl border p-5 flex flex-col gap-3 relative overflow-hidden transition-all hover:scale-[1.02] ${isToday ? 'shadow-[0_0_15px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500/30' : ''} ${priorityColors[task.priority] || priorityColors['LOW']}`}>
          
          {task.isRoutine && (
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-black/40 text-[9px] font-bold uppercase tracking-widest text-indigo-400 rounded-bl-lg">
              Routine
            </div>
          )}

          <div className="flex justify-between items-start pt-2">
            <span className="text-xs font-bold px-2 py-1 bg-black/30 rounded uppercase tracking-wider border border-current/20">
              {task.category}
            </span>
            {onToggleComplete && (
              <button 
                onClick={() => onToggleComplete(task.id)}
                className="hover:scale-110 transition-transform cursor-pointer"
              >
                {task.completed ? <CheckSquare className="w-5 h-5 text-current opacity-80" /> : <Square className="w-5 h-5 text-current opacity-50" />}
              </button>
            )}
          </div>
          
          <h4 className={`font-bold text-lg line-clamp-2 leading-tight mt-1 ${task.completed ? 'line-through opacity-50' : ''}`}>{task.title}</h4>
          
          <div className="mt-auto pt-4 flex flex-col gap-1 text-sm font-medium opacity-80">
            <span className="font-mono">{timeDisplay}</span>
          </div>
        </div>
      );
    });

    return elements;
  }, [upcomingWeek, todayStr, onToggleComplete]);

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
        <div className="absolute top-1/2 -translate-y-1/2 right-10 opacity-10">
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
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Full Schedule Pipeline (7 Days)
        </h3>
        
        <div className="flex items-center overflow-x-auto pb-8 pt-4 gap-4 snap-x snap-mandatory hide-scrollbar">
          {upcomingWeek.length === 0 ? (
            <p className="text-slate-500 italic">No upcoming tasks or routines scheduled.</p>
          ) : (
            pipelineElements
          )}
        </div>
      </div>

    </div>
  );
};

export default DashboardTab;
