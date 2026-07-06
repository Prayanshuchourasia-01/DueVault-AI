import React, { useState } from 'react';
import { CalendarClock, Clock, Edit2, Trash2, Copy, ClipboardPaste, Calendar, ArrowRightLeft } from 'lucide-react';
import RoutineEditModal from '../RoutineEditModal';

const TimetableTab = ({ 
  routineTasks, 
  timetableConfig, 
  setTimetableConfig,
  addRoutineException,
  updateRoutineAll,
  deleteRoutine,
  replaceDayRoutines 
}) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [copiedDay, setCopiedDay] = useState(null);
  const [layoutMode, setLayoutMode] = useState('VERTICAL'); // 'VERTICAL' or 'HORIZONTAL'

  const today = new Date();
  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; 
  
  const weekDates = daysOfWeek.map((day, index) => {
    const diff = index - currentDayIndex;
    const date = new Date(today);
    date.setDate(date.getDate() + diff);
    return {
      name: day,
      dateStr: date.toLocaleDateString('en-CA'),
      displayStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: diff === 0
    };
  });

  const handleEditSave = (id, formData, applyMode, specificDate) => {
    if (applyMode === 'ALL') {
      updateRoutineAll(id, {
        title: formData.title,
        category: formData.category,
        start: formData.start,
        end: formData.end
      });
    } else if (applyMode === 'SPECIFIC_DATE') {
      addRoutineException(id, specificDate, 'modified', {
        title: formData.title,
        category: formData.category,
        start: formData.start,
        end: formData.end
      });
    }
  };

  const handleDelete = (task) => {
    const applyMode = window.confirm("Delete this block permanently from all future days?\n\nClick OK for ALL days.\nClick Cancel for JUST TODAY (exception).");
    if (applyMode) {
      deleteRoutine(task.id);
    } else {
      const specificDate = prompt("Enter the specific date to remove it from (YYYY-MM-DD):", new Date().toLocaleDateString('en-CA'));
      if (specificDate) {
        addRoutineException(task.id, specificDate, 'deleted');
      }
    }
  };

  const handlePasteDay = (targetDay) => {
    if (!copiedDay) return;
    const confirm = window.confirm(`Paste ${copiedDay}'s schedule onto ${targetDay}? This will replace existing routines on ${targetDay}.`);
    if (confirm) {
      replaceDayRoutines(copiedDay, [targetDay]);
    }
  };

  const renderTaskCard = (task) => (
    <div key={task.id} className="group/card bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 shadow-sm hover:border-indigo-500/50 transition-colors relative min-w-[200px] flex-shrink-0">
      <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 group-hover/card:opacity-100 transition-opacity bg-slate-800/80 backdrop-blur rounded p-1 z-10">
        <button onClick={() => setEditingRoutine(task)} className="p-1 text-slate-400 hover:text-indigo-400">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => handleDelete(task)} className="p-1 text-slate-400 hover:text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-black/40 rounded uppercase text-indigo-400 tracking-wider">
          {task.category}
        </span>
      </div>
      <h4 className="font-bold text-white text-sm line-clamp-2 pr-10">{task.title}</h4>
      <div className="mt-2 text-xs text-slate-400 flex items-center gap-1 font-mono">
        <Clock className="w-3 h-3" />
        {task.start} - {task.end}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-fade-in pb-24 md:pb-6 font-sans">
      
      {/* Header & Global Config */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-indigo-400" />
            Timetable Manager
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Configure your repeating weekly schedules. Use the Axis Swap for dense academic block views. You can copy/paste entire days or create single-date exceptions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center w-full xl:w-auto">
          <button 
            onClick={() => setLayoutMode(prev => prev === 'VERTICAL' ? 'HORIZONTAL' : 'VERTICAL')}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-700 transition-colors w-full sm:w-auto whitespace-nowrap"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Swap Layout Axis
          </button>
          
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 w-full sm:w-auto flex flex-col md:flex-row items-start md:items-center gap-3">
            <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1 uppercase tracking-wider">
              <Calendar className="w-3 h-3" /> Validity
            </h3>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={timetableConfig?.validFrom || ''} 
                onChange={(e) => setTimetableConfig({...timetableConfig, validFrom: e.target.value})}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input 
                type="date" 
                value={timetableConfig?.validUntil || ''} 
                onChange={(e) => setTimetableConfig({...timetableConfig, validUntil: e.target.value})}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Rendering based on Layout Mode */}
      {layoutMode === 'VERTICAL' ? (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory custom-scrollbar min-h-[65vh]">
          {weekDates.map(dayObj => {
            const dayTasks = routineTasks
              .filter(t => t.dayOfWeek === dayObj.name)
              .sort((a, b) => new Date(`1970-01-01T${a.start}:00Z`) - new Date(`1970-01-01T${b.start}:00Z`));

            return (
              <div key={dayObj.name} className={`min-w-[280px] flex-1 snap-start bg-slate-900 border rounded-2xl flex flex-col overflow-hidden transition-all ${dayObj.isToday ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-slate-800'}`}>
                <div className={`p-3 border-b border-slate-700/50 text-center flex justify-between items-center group ${dayObj.isToday ? 'bg-cyan-500/10' : 'bg-slate-800/50'}`}>
                  <div className="flex flex-col text-left">
                    <h3 className={`font-bold uppercase tracking-widest text-sm ${dayObj.isToday ? 'text-cyan-400' : 'text-slate-300'}`}>
                      {dayObj.name}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{dayObj.displayStr} {dayObj.isToday && '(Today)'}</span>
                  </div>
                  <div className="flex gap-1 transition-opacity">
                    <button 
                      onClick={() => setCopiedDay(dayObj.name)}
                      className={`p-1 rounded ${copiedDay === dayObj.name ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                      title="Copy Day"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {copiedDay && copiedDay !== dayObj.name && (
                      <button 
                        onClick={() => handlePasteDay(dayObj.name)}
                        className="p-1 rounded text-cyan-500 hover:text-cyan-300"
                        title={`Paste ${copiedDay}`}
                      >
                        <ClipboardPaste className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-3 flex-1 flex flex-col gap-3 min-h-[250px]">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center italic mt-4">No events.</p>
                  ) : (
                    dayTasks.map(renderTaskCard)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          {weekDates.map((dayObj, index) => {
            const dayTasks = routineTasks
              .filter(t => t.dayOfWeek === dayObj.name)
              .sort((a, b) => new Date(`1970-01-01T${a.start}:00Z`) - new Date(`1970-01-01T${b.start}:00Z`));

            return (
              <div key={dayObj.name} className={`flex flex-col md:flex-row group ${index !== weekDates.length - 1 ? 'border-b border-slate-800' : ''} ${dayObj.isToday ? 'bg-cyan-500/5' : ''}`}>
                
                {/* Row Header */}
                <div className="w-full md:w-48 shrink-0 p-4 border-b md:border-b-0 md:border-r border-slate-800/50 flex flex-row md:flex-col justify-between md:justify-center items-center bg-slate-800/20">
                  <div className="text-center md:text-left">
                    <h3 className={`font-bold uppercase tracking-widest text-sm ${dayObj.isToday ? 'text-cyan-400' : 'text-slate-300'}`}>
                      {dayObj.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{dayObj.displayStr}</p>
                  </div>
                  
                  <div className="flex gap-1 transition-opacity mt-0 md:mt-4">
                    <button onClick={() => setCopiedDay(dayObj.name)} className={`p-1.5 rounded-lg ${copiedDay === dayObj.name ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400 hover:text-white'}`} title="Copy Day">
                      <Copy className="w-4 h-4" />
                    </button>
                    {copiedDay && copiedDay !== dayObj.name && (
                      <button onClick={() => handlePasteDay(dayObj.name)} className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:text-cyan-300" title={`Paste ${copiedDay}`}>
                        <ClipboardPaste className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Horizontal Tasks Scroll Container */}
                <div className="flex-1 p-4 flex gap-4 overflow-x-auto custom-scrollbar items-center min-h-[140px]">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic px-4">No events scheduled.</p>
                  ) : (
                    dayTasks.map(renderTaskCard)
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      <RoutineEditModal 
        routine={editingRoutine} 
        isOpen={!!editingRoutine} 
        onClose={() => setEditingRoutine(null)}
        onSave={handleEditSave}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 41, 59, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.8); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.8); }
      `}</style>
    </div>
  );
};

export default TimetableTab;
