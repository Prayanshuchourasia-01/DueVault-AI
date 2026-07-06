import React, { useState } from 'react';
import { Search, Filter, Trash2, Edit2, CheckCircle2, Circle, CalendarDays, CalendarClock } from 'lucide-react';

const VaultTab = ({ tasks, onToggleComplete, onDeleteTask, onEditTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  
  const nextWeekDate = new Date(todayDate);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);

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
    .filter(t => new Date(t.date) <= nextWeekDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcomingTasks = baseFilteredTasks
    .filter(t => new Date(t.date) > nextWeekDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

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
      </div>

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
            <div className="overflow-x-auto">
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
                          <button onClick={() => onToggleComplete(task.id)} className="text-slate-500 hover:text-emerald-400 transition-colors">
                            <Circle className="w-6 h-6" />
                          </button>
                        </td>
                        <td className="p-4 font-bold text-white max-w-xs truncate">
                          <span>{task.title}</span>
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
                          <button onClick={() => onEditTask(task)} className="p-2 text-slate-500 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDeleteTask(task.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

        return (
          <>
            {renderTable(nextWeekTasks, "Due This Week (Next 7 Days)", <CalendarDays className="w-4 h-4 text-cyan-400" />)}
            {renderTable(upcomingTasks, "Upcoming (Later)", <CalendarClock className="w-4 h-4 text-indigo-400" />)}
          </>
        );
      })()}

    </div>
  );
};

export default VaultTab;
