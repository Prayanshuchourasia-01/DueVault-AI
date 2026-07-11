import React from 'react';
import { CalendarRange, Check, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { isTaskActive, isTaskOver } from '../utils/timeUtils';

export const Timetable = ({ 
  title, 
  tasks, 
  onToggleComplete, 
  onDeleteTask, 
  accentColor = 'border-slate-800'
}) => {
  
  // Sort tasks chronologically
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.start) - new Date(b.start));

  const getTaskStatus = (task) => {
    if (task.completed) return 'COMPLETED';
    if (isTaskActive(task.start, task.end)) return 'ACTIVE';
    if (isTaskOver(task.end)) return 'MISSED';
    return 'UPCOMING';
  };

  return (
    <div className={`bg-slate-900/50 p-4 rounded-xl border ${accentColor} shadow-lg flex flex-col h-fit max-h-[500px]`}>
      
      {/* Timetable Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-slate-300" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-300 font-sans">
            {title}
          </h3>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-600">
            <Calendar className="w-6 h-6 text-slate-700 mb-1.5" />
            <p className="text-3xs font-bold uppercase tracking-wider">Timeline Empty</p>
            <p className="text-4xs text-slate-600 mt-1 max-w-[170px] leading-relaxed">
              No tasks matched for this category today. Add using the terminal above.
            </p>
          </div>
        ) : (
          sortedTasks.map(task => {
            const status = getTaskStatus(task);
            
            let statusBadgeStyle = '';
            let cardBorderStyle = 'border-slate-800 bg-slate-800/20';
            
            if (status === 'COMPLETED') {
              statusBadgeStyle = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
              cardBorderStyle = 'border-emerald-900/20 bg-slate-900/50 opacity-50';
            } else if (status === 'ACTIVE') {
              statusBadgeStyle = 'bg-cyan-950/40 text-cyan-400 border-cyan-400/40';
              cardBorderStyle = (task.priority === 'HIGH' || task.priority === 'CRITICAL')
                ? 'border-red-500/50 bg-red-950/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                : 'border-cyan-500/40 bg-cyan-950/10 shadow-[0_0_10px_rgba(6,182,212,0.1)]';
            } else if (status === 'MISSED') {
              statusBadgeStyle = 'bg-red-950/40 text-red-400 border-red-900/30';
              cardBorderStyle = 'border-red-900/25 bg-red-950/5 opacity-80';
            } else {
              statusBadgeStyle = 'bg-slate-900 text-slate-400 border-slate-700';
            }

            return (
              <div 
                key={task.id} 
                className={`p-2.5 rounded-lg border transition-all duration-300 flex items-center justify-between gap-2.5 ${cardBorderStyle}`}
              >
                
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className={`w-4.5 h-4.5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all cursor-pointer ${
                      task.completed 
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                        : 'border-slate-600 hover:border-cyan-400 hover:bg-slate-800'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3 stroke-[3px]" />}
                  </button>

                  <div className="min-w-0 space-y-0.5">
                    <h4 className={`text-sm font-extrabold tracking-wide flex items-center gap-1 flex-wrap ${
                      task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}>
                      <span className="truncate">{task.title}</span>
                      {task.amount !== undefined && (
                        <span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] px-1 py-0.5 rounded font-mono font-bold">
                          ₹{task.amount}
                        </span>
                      )}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-0.5 font-mono text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        {task.date !== new Date().toLocaleDateString('en-CA') && <span className="text-indigo-400 font-bold mr-1">{new Date(task.start || task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        {task.start ? new Date(task.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''} 
                        {task.end ? ` - ${new Date(task.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </span>
                      <span className="text-slate-700">&bull;</span>
                      <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">{task.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${statusBadgeStyle}`}>
                    {status}
                  </span>
                  
                  {(task.priority === 'HIGH' || task.priority === 'CRITICAL') && !task.completed && (
                    <span className="p-0.5 text-red-500 animate-pulse" title="High Priority">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </span>
                  )}
                  
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default Timetable;
