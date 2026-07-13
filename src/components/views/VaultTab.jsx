import React, { useState } from 'react';
import { Search, Filter, Trash2, Edit2, CheckCircle2, Circle, CalendarDays, CalendarClock, Plus } from 'lucide-react';
import { InputEngine } from '../InputEngine';
import { TaskAddModal } from '../TaskAddModal';

const VaultTab = ({ tasks, onAddTask, onToggleComplete, onDeleteTask, onEditTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);

  // Calculate Cutoff Date for "This Week" (include first 3 days of next week)
  const cutoffDate = new Date(todayDate);
  const daysToNextMonday = todayDate.getDay() === 0 ? 1 : (8 - todayDate.getDay());
  cutoffDate.setDate(todayDate.getDate() + daysToNextMonday + 2); // Wednesday of next week
  cutoffDate.setHours(23, 59, 59, 999);

  const baseFilteredTasks = tasks.filter(task => {
    // DO NOT show timetable routines
    if (task.isRoutine || !!task.routineId) return false;
    // DO NOT show completed
    if (task.completed) return false;

    const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (task.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  const nextWeekTasks = baseFilteredTasks
    .filter(t => {
      const taskDate = new Date(t.date || t.start);
      return taskDate <= cutoffDate;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcomingTasks = baseFilteredTasks
    .filter(t => {
      const taskDate = new Date(t.date || t.start);
      return taskDate > cutoffDate;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const historyTasks = tasks
    .filter(task => {
      if (task.isRoutine || !!task.routineId) return false;
      if (!task.completed) return false;

      const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (task.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
      
      return matchesSearch && matchesPriority;
    })
    .sort((a, b) => new Date(b.date || b.start) - new Date(a.date || a.start));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-24 md:pb-6 font-sans">
      
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-400" />
            Life Vault & Deadlines
          </h2>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Your centralized master list for life admin, bills, and one-off tasks.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] w-full md:w-auto justify-center cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Add Vault Task
        </button>
      </div>

      <InputEngine onAddTask={onAddTask} />

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search vault tasks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select 
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Render Table Function */}
      {(() => {
        const priorityColors = {
          'CRITICAL': 'text-red-400 bg-red-400/10 border border-red-500/20',
          'HIGH': 'text-orange-400 bg-orange-400/10 border border-orange-500/20',
          'MEDIUM': 'text-cyan-400 bg-cyan-400/10 border border-cyan-500/20',
          'LOW': 'text-slate-400 bg-slate-400/10 border border-slate-700'
        };

        const renderTable = (list, title, icon) => (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-6">
            <div className="p-4 bg-slate-800/30 border-b border-slate-800 flex items-center gap-2">
              {icon}
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">{title}</h3>
              <span className="ml-auto text-xs font-mono bg-slate-800 text-slate-400 px-2 py-1 rounded">{list.length} Items</span>
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 italic">
                        No tasks found in this timeframe.
                      </td>
                    </tr>
                  ) : (
                    list.map(task => (
                      <tr key={task.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                        <td className="p-4 w-16">
                          <button onClick={() => onToggleComplete(task.id)} className="text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer">
                            {task.completed ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Circle className="w-6 h-6" />}
                          </button>
                        </td>
                        <td className="p-4 font-bold text-white max-w-xs">
                          <span className={task.completed ? "line-through text-slate-500 font-normal" : ""}>{task.title}</span>
                          {task.amount !== undefined && (
                            <span className="inline-block ml-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                              ₹{task.amount}
                            </span>
                          )}
                          <div className="text-[10px] text-slate-500 font-mono uppercase mt-1">{task.category}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                          <span className="font-medium text-slate-300">{task.date}</span> <br/> 
                          <span className="text-xs opacity-75 font-mono">
                            {new Date(task.start).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${priorityColors[task.priority] || priorityColors['LOW']}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button onClick={() => onEditTask(task)} className="p-2 text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDeleteTask(task.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors ml-1 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="block md:hidden divide-y divide-slate-800/50">
              {list.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic text-xs">
                  No tasks found in this timeframe.
                </div>
              ) : (
                list.map(task => (
                  <div key={task.id} className="p-4 flex flex-col gap-3.5 hover:bg-slate-800/10 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button onClick={() => onToggleComplete(task.id)} className="text-slate-500 hover:text-emerald-400 transition-colors mt-0.5 shrink-0 cursor-pointer">
                          {task.completed ? <CheckCircle2 className="w-5.5 h-5.5 text-emerald-400" /> : <Circle className="w-5.5 h-5.5" />}
                        </button>
                        <div className="min-w-0">
                          <p className={`font-bold text-slate-200 leading-snug break-words text-sm ${task.completed ? "line-through text-slate-500 font-normal" : ""}`}>
                            {task.title}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {task.amount !== undefined && (
                              <span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                                ₹{task.amount}
                              </span>
                            )}
                            <span className="font-semibold text-slate-400 uppercase tracking-widest text-[8px] bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60">
                              {task.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${priorityColors[task.priority] || priorityColors['LOW']} shrink-0`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-850 text-xs">
                      <div className="text-slate-400 font-medium text-[11px]">
                        <span>{task.date}</span>
                        {task.start && (
                          <span className="ml-1.5 font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {new Date(task.start).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEditTask(task)} className="p-2 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        );

        return (
          <>
            {nextWeekTasks.length > 0 && renderTable(nextWeekTasks, "Due This Week (Next 7-10 Days)", <CalendarDays className="w-4 h-4 text-cyan-400" />)}
            {upcomingTasks.length > 0 && renderTable(upcomingTasks, "Upcoming (Later)", <CalendarClock className="w-4 h-4 text-indigo-400" />)}
            {historyTasks.length > 0 && renderTable(historyTasks, "Vault History (Completed Tasks)", <CheckCircle2 className="w-4 h-4 text-emerald-400" />)}
            {nextWeekTasks.length === 0 && upcomingTasks.length === 0 && historyTasks.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 py-16">
                <CalendarDays className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="font-extrabold text-sm uppercase tracking-wider">Life Vault Empty</p>
                <p className="text-xs text-slate-600 mt-1">Add tasks manually or use the AI Command Console above.</p>
              </div>
            )}
            
            <TaskAddModal 
              isOpen={showAddModal} 
              onClose={() => setShowAddModal(false)} 
              onSave={onAddTask} 
            />
          </>
        );
      })()}

    </div>
  );
};

export default VaultTab;
