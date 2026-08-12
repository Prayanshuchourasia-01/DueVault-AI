import React, { useState } from 'react';
import { Search, Trash2, Edit2, CheckCircle2, Circle, CalendarDays, CalendarClock, Plus, AlertTriangle, IndianRupee, Clock, CheckSquare } from 'lucide-react';
import { InputEngine } from '../InputEngine';
import { TaskAddModal } from '../TaskAddModal';

const VaultTab = ({ tasks, onAddTask, onToggleComplete, onDeleteTask, onEditTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);

  // Calculate Cutoff Date for "This Week" (next 7 days)
  const cutoffDate = new Date(todayDate);
  const daysToNextMonday = todayDate.getDay() === 0 ? 1 : (8 - todayDate.getDay());
  cutoffDate.setDate(todayDate.getDate() + daysToNextMonday + 2); // Wednesday of next week
  cutoffDate.setHours(23, 59, 59, 999);

  const baseFilteredTasks = tasks.filter(task => {
    // DO NOT show timetable routines
    if (task.isRoutine || !!task.routineId) return false;
    // DO NOT show completed in active lists
    if (task.completed) return false;

    const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (task.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  // 1. OVERDUE TASKS (Date is strictly before today)
  const overdueTasks = baseFilteredTasks
    .filter(t => {
      const taskDate = new Date(t.date || t.start);
      taskDate.setHours(0,0,0,0);
      return taskDate < todayDate;
    })
    .sort((a, b) => new Date(a.date || a.start) - new Date(b.date || b.start));

  // 2. DUE THIS WEEK (Date is from today up to cutoffDate)
  const thisWeekTasks = baseFilteredTasks
    .filter(t => {
      const taskDate = new Date(t.date || t.start);
      taskDate.setHours(0,0,0,0);
      return taskDate >= todayDate && taskDate <= cutoffDate;
    })
    .sort((a, b) => new Date(a.date || a.start) - new Date(b.date || b.start));

  // 3. UPCOMING LATER (Date is after cutoffDate)
  const upcomingTasks = baseFilteredTasks
    .filter(t => {
      const taskDate = new Date(t.date || t.start);
      taskDate.setHours(0,0,0,0);
      return taskDate > cutoffDate;
    })
    .sort((a, b) => new Date(a.date || a.start) - new Date(b.date || b.start));

  // 4. COMPLETED VAULT HISTORY
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

  // Calculate Metrics
  const totalUnpaidAmount = baseFilteredTasks.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalPendingCount = baseFilteredTasks.length;
  const overdueCount = overdueTasks.length;
  const completedCount = historyTasks.length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-4 font-sans">
      
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-400" />
            Life Vault & Deadlines
          </h2>
          <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
            Centralized master hub for life admin, bills, subscriptions, and target deadlines.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] w-full md:w-auto justify-center cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Add Vault Item
        </button>
      </div>

      {/* Production Stat Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`bg-slate-900 border rounded-2xl p-4 flex items-center gap-3.5 ${overdueCount > 0 ? 'border-red-500/50 bg-red-950/10' : 'border-slate-800'}`}>
          <div className={`p-3 rounded-xl ${overdueCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue / Missed</p>
            <p className={`text-2xl font-extrabold ${overdueCount > 0 ? 'text-red-400' : 'text-white'}`}>{overdueCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due This Week</p>
            <p className="text-2xl font-extrabold text-white">{thisWeekTasks.length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Unpaid Bills</p>
            <p className="text-2xl font-extrabold text-white">₹{totalUnpaidAmount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Items</p>
            <p className="text-2xl font-extrabold text-white">{completedCount}</p>
          </div>
        </div>
      </div>

      <InputEngine onAddTask={onAddTask} />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search vault tasks, categories, or bills..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select 
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
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

        const renderTable = (list, title, icon, headerStyle = "border-slate-800 bg-slate-900") => (
          <div className={`border rounded-2xl overflow-hidden mb-6 ${headerStyle}`}>
            <div className="p-4 bg-slate-800/30 border-b border-slate-800 flex items-center gap-2">
              {icon}
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">{title}</h3>
              <span className="ml-auto text-xs font-mono bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg font-bold">{list.length} Items</span>
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 italic text-sm">
                        No tasks found in this section.
                      </td>
                    </tr>
                  ) : (
                    list.map(task => {
                      const tDate = new Date(task.date || task.start);
                      tDate.setHours(0,0,0,0);
                      const isOverdue = !task.completed && tDate < todayDate;
                      const daysOverdue = isOverdue ? Math.floor((todayDate - tDate) / (1000 * 60 * 60 * 24)) : 0;

                      return (
                        <tr key={task.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group ${isOverdue ? 'bg-red-950/10' : ''}`}>
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
                            <div className="text-[10px] text-slate-500 font-mono uppercase mt-1 flex items-center gap-2">
                              <span>{task.category}</span>
                              {isOverdue && (
                                <span className="text-red-400 font-bold bg-red-500/20 px-1.5 py-0.5 rounded text-[9px]">
                                  {daysOverdue === 0 ? 'DUE YESTERDAY' : `${daysOverdue} DAY${daysOverdue > 1 ? 'S' : ''} OVERDUE`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                            <span className={`font-medium ${isOverdue ? 'text-red-400 font-bold' : 'text-slate-300'}`}>{task.date}</span> <br/> 
                            <span className="text-xs opacity-75 font-mono">
                              {task.start ? new Date(task.start).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : 'All Day'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${priorityColors[task.priority] || priorityColors['LOW']}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button onClick={() => onEditTask(task)} className="p-2 text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer" title="Edit Item">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDeleteTask(task.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors ml-1 cursor-pointer" title="Delete Item">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="block md:hidden divide-y divide-slate-800/50">
              {list.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic text-xs">
                  No tasks found in this section.
                </div>
              ) : (
                list.map(task => {
                  const tDate = new Date(task.date || task.start);
                  tDate.setHours(0,0,0,0);
                  const isOverdue = !task.completed && tDate < todayDate;
                  const daysOverdue = isOverdue ? Math.floor((todayDate - tDate) / (1000 * 60 * 60 * 24)) : 0;

                  return (
                    <div key={task.id} className={`p-4 flex flex-col gap-3.5 hover:bg-slate-800/10 transition-colors ${isOverdue ? 'bg-red-950/10' : ''}`}>
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
                              {isOverdue && (
                                <span className="text-red-400 font-bold bg-red-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                                  {daysOverdue === 0 ? 'DUE YESTERDAY' : `${daysOverdue}D OVERDUE`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${priorityColors[task.priority] || priorityColors['LOW']} shrink-0`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-850 text-xs">
                        <div className="text-slate-400 font-medium text-[11px]">
                          <span className={isOverdue ? "text-red-400 font-bold" : ""}>{task.date}</span>
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
                  );
                })
              )}
            </div>

          </div>
        );

        return (
          <>
            {overdueTasks.length > 0 && renderTable(overdueTasks, "🚨 Overdue & Pending Action", <AlertTriangle className="w-4 h-4 text-red-400" />, "border-red-500/40 bg-slate-900 shadow-[0_0_20px_rgba(239,68,68,0.1)]")}
            {thisWeekTasks.length > 0 && renderTable(thisWeekTasks, "📅 Due This Week", <CalendarDays className="w-4 h-4 text-cyan-400" />, "border-slate-800 bg-slate-900")}
            {upcomingTasks.length > 0 && renderTable(upcomingTasks, "🔮 Upcoming (Later)", <CalendarClock className="w-4 h-4 text-indigo-400" />, "border-slate-800 bg-slate-900")}
            {historyTasks.length > 0 && renderTable(historyTasks, "✅ Vault History (Completed)", <CheckCircle2 className="w-4 h-4 text-emerald-400" />, "border-slate-800 bg-slate-900")}
            {overdueTasks.length === 0 && thisWeekTasks.length === 0 && upcomingTasks.length === 0 && historyTasks.length === 0 && (
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
