import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Calendar as CalendarIcon, Tag, AlertTriangle, CalendarDays } from 'lucide-react';

const RoutineEditModal = ({ routine, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    start: '',
    end: '',
    validFrom: '',
    validUntil: ''
  });

  const [applyMode, setApplyMode] = useState('ALL'); // 'ALL' or 'SPECIFIC_DATE'
  const [specificDate, setSpecificDate] = useState(new Date().toLocaleDateString('en-CA'));

  useEffect(() => {
    if (routine && isOpen) {
      setFormData({
        title: routine.title || '',
        category: routine.category || '',
        start: routine.start || '',
        end: routine.end || '',
        validFrom: routine.validFrom || '',
        validUntil: routine.validUntil || ''
      });
      setApplyMode('ALL');
    }
  }, [routine, isOpen]);

  if (!isOpen || !routine) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(routine.id, formData, applyMode, specificDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            Edit Timetable Routine
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Routine Title</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
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
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono uppercase text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Start Time
              </label>
              <input 
                type="time" 
                required
                value={formData.start}
                onChange={(e) => setFormData({...formData, start: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
                <Clock className="w-4 h-4" /> End Time
              </label>
              <input 
                type="time" 
                required
                value={formData.end}
                onChange={(e) => setFormData({...formData, end: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <label className="text-sm font-bold text-white mb-2 block">Apply Changes To:</label>
            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-700 hover:border-indigo-500/50 cursor-pointer bg-slate-800/50">
                <input 
                  type="radio" 
                  name="applyMode" 
                  checked={applyMode === 'ALL'} 
                  onChange={() => setApplyMode('ALL')}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-white">All occurrences</p>
                  <p className="text-xs text-slate-400">Permanently update this routine in the weekly timetable.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-700 hover:border-indigo-500/50 cursor-pointer bg-slate-800/50">
                <input 
                  type="radio" 
                  name="applyMode" 
                  checked={applyMode === 'SPECIFIC_DATE'} 
                  onChange={() => setApplyMode('SPECIFIC_DATE')}
                  className="mt-1"
                />
                <div>
                  <p className="font-semibold text-white">A specific date only</p>
                  <p className="text-xs text-slate-400">Create a one-time exception for this routine.</p>
                  {applyMode === 'SPECIFIC_DATE' && (
                    <input 
                      type="date" 
                      value={specificDate}
                      onChange={(e) => setSpecificDate(e.target.value)}
                      className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Routine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoutineEditModal;
