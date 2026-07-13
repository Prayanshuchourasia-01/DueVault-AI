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
    <div className={`bg-slate-900/40 p-5 rounded-2xl border ${accentColor} backdrop-blur-md shadow-xl flex flex-col h-fit`}>
      
      {/* Timetable Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <CalendarRange className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm tracking-wide text-slate-200 font-sans">
            {title}
          </h3>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-600">
            <Calendar className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Timeline Empty</p>
            <p className="text-xs text-slate-600 mt-1 max-w-[190px] leading-relaxed">
              No tasks matched for this category today. Add using the input above.
            </p>
          </div>
        ) : (
          sortedTasks.map(task => {
            const status = getTaskStatus(task);
            
            let statusBadgeStyle = '';
            let cardBorderStyle = 'border-slate-800 bg-slate-900/30';
            
            // Premium Status styling
            if (status === 'COMPLETED') {
              statusBadgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              cardBorderStyle = 'border-slate-800/40 border-l-emerald-500 bg-slate-950/20 opacity-60';
            } else if (status === 'ACTIVE') {
              statusBadgeStyle = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
              
              if (task.priority === 'HIGH' || task.priority === 'CRITICAL') {
                cardBorderStyle = 'border-slate-800/80 border-l-rose-500 bg-rose-950/10 shadow-[0_0_15px_rgba(244,63,94,0.05)]';
              } else {
                cardBorderStyle = 'border-slate-800/80 border-l-cyan-500 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.05)]';
              }
            } else if (status === 'MISSED') {
              statusBadgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
              cardBorderStyle = 'border-slate-800/40 border-l-rose-500 bg-rose-950/5 opacity-80';
            } else {
              // UPCOMING
              statusBadgeStyle = 'bg-slate-800/80 text-slate-400 border-slate-700/60';
              cardBorderStyle = 'border-slate-800/80 border-l-slate-700 bg-slate-900/40';
            }

            return (
              <div 
                key={task.id} 
                className={`p-3 rounded-xl border border-l-[3px] transition-all duration-300 flex items-center justify-between gap-3 hover:translate-x-0.5 hover:border-slate-700/80 ${cardBorderStyle}`}
              >
                
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Round Premium Checkbox */}
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all cursor-pointer ${
                      task.completed 
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                        : 'border-slate-600 hover:border-cyan-400 hover:bg-slate-800/60'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Wrapping title without early clip */}
                    <h4 className={`text-sm font-bold tracking-wide leading-snug flex items-center gap-1.5 flex-wrap ${
                      task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}>
                      <span className="break-words">{task.title}</span>
                      {task.amount !== undefined && (
                        <span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                          ₹{task.amount}
                        </span>
                      )}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      {/* Clock range */}
                      <span className="flex items-center gap-1 font-mono text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        {task.date !== new Date().toLocaleDateString('en-CA') && (
                          <span className="text-indigo-400 font-bold mr-0.5">
                            {new Date(task.start || task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {task.start ? new Date(task.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''} 
                        {task.end ? ` - ${new Date(task.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </span>
                      <span className="text-slate-800 font-semibold">&bull;</span>
                      
                      {/* Pill Badge Category */}
                      <span className="font-semibold text-slate-400 uppercase tracking-widest text-[9px] bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
                        {task.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Status Badge */}
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusBadgeStyle}`}>
                    {status}
                  </span>
                  
                  {/* Urgent indicator */}
                  {(task.priority === 'HIGH' || task.priority === 'CRITICAL') && !task.completed && (
                    <span className="p-0.5 text-red-500 animate-pulse" title="High Priority">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </span>
                  )}
                  
                  {/* Delete button */}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
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
