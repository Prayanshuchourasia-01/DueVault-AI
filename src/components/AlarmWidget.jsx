import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Trash2, Plus } from 'lucide-react';

export const AlarmWidget = ({ startAlarm }) => {
  const [alarms, setAlarms] = useState([]);
  const [newAlarmTime, setNewAlarmTime] = useState('');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('duevault_alarms');
    if (saved) {
      try {
        setAlarms(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse alarms");
      }
    }
  }, []);

  // Save to local storage whenever alarms change
  useEffect(() => {
    localStorage.setItem('duevault_alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Check alarms every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      
      alarms.forEach(alarm => {
        if (alarm.isActive && alarm.time === currentTime && !alarm.hasRungToday) {
          // Trigger alarm
          const tone = localStorage.getItem('duevault_ringtone') || 'modern-chime';
          startAlarm(tone, {
            title: "ALARM: " + (alarm.label || "Reminder"),
            message: `It is now ${currentTime}`
          });
          
          // Mark as rung for this minute so it doesn't spam
          setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, hasRungToday: true } : a));
          
          // Reset the hasRungToday flag after a minute has passed
          setTimeout(() => {
            setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, hasRungToday: false } : a));
          }, 61000);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [alarms, startAlarm]);

  const addAlarm = (e) => {
    e.preventDefault();
    if (!newAlarmTime) return;
    
    const newAlarm = {
      id: Date.now().toString(),
      time: newAlarmTime,
      label: newAlarmLabel.trim() || 'Reminder',
      isActive: true,
      hasRungToday: false
    };
    
    setAlarms([...alarms, newAlarm].sort((a, b) => a.time.localeCompare(b.time)));
    setNewAlarmTime('');
    setNewAlarmLabel('');
  };

  const toggleAlarm = (id) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const deleteAlarm = (id) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-amber-400" />
        <h3 className="font-bold text-white">Custom Alarms</h3>
      </div>
      
      <form onSubmit={addAlarm} className="flex gap-2 mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
        <input 
          type="time" 
          value={newAlarmTime}
          onChange={(e) => setNewAlarmTime(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 w-28"
          required
        />
        <input 
          type="text"
          placeholder="Label (optional)"
          value={newAlarmLabel}
          onChange={(e) => setNewAlarmLabel(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 flex-1 min-w-0"
        />
        <button 
          type="submit"
          className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-lg transition-colors flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2">
        {alarms.length === 0 ? (
          <div className="text-center text-slate-500 text-xs italic py-6">
            No active alarms.
          </div>
        ) : (
          alarms.map(alarm => (
            <div key={alarm.id} className={`flex items-center justify-between p-3 rounded-xl border ${alarm.isActive ? 'bg-slate-800/60 border-amber-500/30' : 'bg-slate-900/40 border-slate-800 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleAlarm(alarm.id)}
                  className={`w-10 h-6 rounded-full relative transition-colors ${alarm.isActive ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${alarm.isActive ? 'left-5' : 'left-1'}`} />
                </button>
                <div>
                  <div className={`text-lg font-mono font-bold ${alarm.isActive ? 'text-amber-400' : 'text-slate-400'}`}>
                    {alarm.time}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[120px]">
                    {alarm.label}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => deleteAlarm(alarm.id)}
                className="text-slate-500 hover:text-red-400 p-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
