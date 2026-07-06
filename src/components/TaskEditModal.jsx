import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Calendar as CalendarIcon, Tag, AlertTriangle, Bell } from 'lucide-react';

const TaskEditModal = ({ task, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTimeStr: '',
    endTimeStr: '',
    priority: 'LOW',
    category: '',
    reminderDaysStr: '',
    reminderTime: ''
  });

  useEffect(() => {
    if (task && isOpen) {
      const sDate = new Date(task.start);
      const eDate = new Date(task.end);
      
      setFormData({
        title: task.title,
        date: task.date || sDate.toLocaleDateString('en-CA'),
        startTimeStr: sDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        endTimeStr: eDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        priority: task.priority || 'LOW',
        category: task.category || 'other',
        reminderDaysStr: task.reminderDays ? task.reminderDays.join(', ') : '',
        reminderTime: task.reminderTime || ''
      });
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = { ...formData };
    
    // Parse reminder days (e.g. "5, 1" -> [5, 1])
    updatedData.reminderDays = formData.reminderDaysStr
      .split(',')
      .map(d => parseInt(d.trim(), 10))
      .filter(d => !isNaN(d));
    
    delete updatedData.reminderDaysStr;
    
    onSave(task.id, updatedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <EditIcon className="w-5 h-5 text-cyan-400" />
            Edit Task
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Task Title</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" /> Date
              </label>
              <input 
                type="date" 
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                <Tag className="w-4 h-4" /> Category
              </label>
              <input 
                type="text" 
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value.toLowerCase()})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono uppercase text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Start Time
              </label>
              <input 
                type="time" 
                required
                value={formData.startTimeStr}
                onChange={(e) => setFormData({...formData, startTimeStr: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                <Clock className="w-4 h-4" /> End Time
              </label>
              <input 
                type="time" 
                required
                value={formData.endTimeStr}
                onChange={(e) => setFormData({...formData, endTimeStr: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <Bell className="w-4 h-4" /> Reminders (Days Before)
            </label>
            <input 
              type="text" 
              placeholder="e.g. 5, 1, 0"
              value={formData.reminderDaysStr}
              onChange={(e) => setFormData({...formData, reminderDaysStr: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
            />
            <p className="text-xs text-slate-500">Enter comma-separated numbers. 0 means on the day of the event.</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Exact Reminder Time (Alarm)
            </label>
            <input 
              type="time" 
              value={formData.reminderTime}
              onChange={(e) => setFormData({...formData, reminderTime: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <p className="text-xs text-slate-500">Will sound an alarm at this exact time on the task date.</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Priority Level
            </label>
            <div className="flex gap-2">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(level => {
                const isActive = formData.priority === level;
                const activeClasses = {
                  'LOW': 'bg-slate-700 border-slate-500 text-white',
                  'MEDIUM': 'bg-cyan-900 border-cyan-500 text-cyan-200',
                  'HIGH': 'bg-orange-900 border-orange-500 text-orange-200',
                  'CRITICAL': 'bg-red-900 border-red-500 text-red-200'
                };
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({...formData, priority: level})}
                    className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${isActive ? activeClasses[level] : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

// Simple Edit Icon component inline
const EditIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);

export default TaskEditModal;
