import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Calendar as CalendarIcon, Tag, AlertTriangle, Bell, Plus } from 'lucide-react';

export const TaskAddModal = ({ isOpen, onClose, onSave }) => {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [formData, setFormData] = useState({
    title: '',
    date: todayStr,
    startTimeStr: '12:00',
    endTimeStr: '13:00',
    priority: 'LOW',
    category: 'other',
    reminders: [] // Array of { minutesBefore: Number, type: 'notification' | 'alarm' | 'both' }
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        date: todayStr,
        startTimeStr: '12:00',
        endTimeStr: '13:00',
        priority: 'LOW',
        category: 'other',
        reminders: []
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title: formData.title,
      date: formData.date,
      start: formData.startTimeStr,
      end: formData.endTimeStr,
      priority: formData.priority,
      category: formData.category,
      reminders: formData.reminders
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            Add Manual Task
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
              placeholder="e.g. Electricity bill payment, Study OS"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                <Tag className="w-4 h-4" /> Category
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. study, finance, bills"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value.toLowerCase()})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono uppercase text-xs"
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Multi-Reminders */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" /> 
                Multi-Reminders & Alarms
              </label>
              <button 
                type="button"
                onClick={() => setFormData({...formData, reminders: [...formData.reminders, { minutesBefore: 15, type: 'notification' }]})}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded"
              >
                + ADD
              </button>
            </div>
            
            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
              {formData.reminders.map((rem, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 p-2 rounded-lg">
                  <select
                    value={rem.minutesBefore}
                    onChange={(e) => {
                      const newRem = [...formData.reminders];
                      newRem[idx].minutesBefore = parseInt(e.target.value);
                      setFormData({...formData, reminders: newRem});
                    }}
                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded p-1 focus:outline-none"
                  >
                    <option value={0}>At time of event</option>
                    <option value={5}>5 mins before</option>
                    <option value={15}>15 mins before</option>
                    <option value={30}>30 mins before</option>
                    <option value={60}>1 hour before</option>
                    <option value={1440}>1 day before</option>
                    <option value={2880}>2 days before</option>
                  </select>
                  
                  <select
                    value={rem.type}
                    onChange={(e) => {
                      const newRem = [...formData.reminders];
                      newRem[idx].type = e.target.value;
                      setFormData({...formData, reminders: newRem});
                    }}
                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded p-1 focus:outline-none flex-1"
                  >
                    <option value="notification">Push Notification</option>
                    <option value="alarm">Audio Alarm</option>
                    <option value="both">Notification + Alarm</option>
                  </select>

                  <button 
                    type="button"
                    onClick={() => {
                      const newRem = formData.reminders.filter((_, i) => i !== idx);
                      setFormData({...formData, reminders: newRem});
                    }}
                    className="p-1 hover:bg-slate-700 text-slate-500 hover:text-red-400 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {formData.reminders.length === 0 && (
                <p className="text-xs text-slate-500 italic">No reminders set for this task.</p>
              )}
            </div>
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
              Add Task
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
