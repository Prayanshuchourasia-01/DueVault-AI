import React, { useState, useEffect } from 'react';
import { Settings2, Key, Bell, Volume2, Save, ShieldAlert, Code, UploadCloud, DownloadCloud, AlertTriangle } from 'lucide-react';
import { useAudioAlarm } from '../../hooks/useAudioAlarm';
import { useNotifications } from '../../hooks/useNotifications';
import HTMLImporter from '../HTMLImporter';
import { auth, db } from '../../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';

const SettingsTab = ({ onTasksExtracted, clearRoutines }) => {
  const [apiKey, setApiKey] = useState('');
  const [ringtone, setRingtone] = useState('modern-chime');
  const [savedMessage, setSavedMessage] = useState('');
  
  const { testAlarm } = useAudioAlarm();
  const { permission, askPermission } = useNotifications();

  useEffect(() => {
    const user = auth.currentUser;
    const keyName = user ? `duevault_gemini_key_${user.uid}` : 'duevault_gemini_key';
    let savedKeyBase64 = localStorage.getItem(keyName) || '';
    let decodedKey = '';
    if (savedKeyBase64) {
      try {
        decodedKey = atob(savedKeyBase64);
      } catch(e) {
        decodedKey = savedKeyBase64;
      }
    }
    const savedRingtone = localStorage.getItem('duevault_ringtone') || 'modern-chime';
    setApiKey(decodedKey);
    setRingtone(savedRingtone);
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    const keyName = user ? `duevault_gemini_key_${user.uid}` : 'duevault_gemini_key';
    const encodedKey = apiKey.trim() ? btoa(apiKey.trim()) : '';
    if (encodedKey) {
      localStorage.setItem(keyName, encodedKey);
    } else {
      localStorage.removeItem(keyName);
    }
    localStorage.setItem('duevault_ringtone', ringtone);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { geminiApiKey: encodedKey }, { merge: true });
      } catch (err) {
        console.error("Error saving API key to Firestore:", err);
      }
    }

    setSavedMessage('Settings saved successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleExportData = () => {
    const data = {
      tasks: JSON.parse(localStorage.getItem('duevault_tasks') || '[]'),
      routines: JSON.parse(localStorage.getItem('duevault_routines') || '[]'),
      finances: JSON.parse(localStorage.getItem('duevault_finances') || '{}'),
      config: JSON.parse(localStorage.getItem('duevault_timetable_config') || '{}')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duevault_backup_${new Date().toLocaleDateString('en-CA')}.json`;
    a.click();
  };

  const handleCustomRingtoneUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      localStorage.setItem('duevault_custom_ringtone_data', event.target.result);
      setRingtone('custom');
      setSavedMessage('Custom ringtone loaded! Click Save Settings to apply.');
      setTimeout(() => setSavedMessage(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.tasks) localStorage.setItem('duevault_tasks', JSON.stringify(data.tasks));
        if (data.routines) localStorage.setItem('duevault_routines', JSON.stringify(data.routines));
        if (data.finances) localStorage.setItem('duevault_finances', JSON.stringify(data.finances));
        if (data.config) localStorage.setItem('duevault_timetable_config', JSON.stringify(data.config));
        
        alert("Backup restored successfully! The app will now reload to apply changes.");
        window.location.reload();
      } catch (err) {
        alert("Failed to parse JSON backup file.");
      }
    };
    reader.readAsText(file);
  };

  const ringtones = [
    { id: 'modern-chime', label: 'Modern Chime', desc: 'Gentle cascading sine wave melody.' },
    { id: 'soft-pulse', label: 'Soft Pulse', desc: 'Slow, pulsing low-pass triangle wave.' },
    { id: 'urgent-alarm', label: 'Urgent Alarm', desc: 'Fast-paced, high-attention double beep.' },
    { id: 'custom', label: 'Custom Audio', desc: 'Your uploaded ringtone file.' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-fade-in pb-20 md:pb-4">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5 flex items-center gap-2">
            <Settings2 className="w-5.5 h-5.5 text-indigo-400" />
            System Configuration
          </h2>
          <p className="text-slate-400 text-xs">Manage local API keys, personalize Focus HUD ringtones, and import routines.</p>
        </div>
        
        {/* Compact Save Button on header */}
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>

      {savedMessage && (
        <div className="bg-emerald-950/40 border border-emerald-900/20 text-emerald-400 p-2.5 rounded-xl text-xs font-bold animate-pulse text-center">
          {savedMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left Column Wrapper */}
        <div className="space-y-4 flex flex-col h-fit">
          {/* API Key Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key className="w-4.5 h-4.5 text-cyan-400" />
              Gemini API Key
            </h3>
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 flex gap-2.5 text-amber-200 text-[11px] leading-relaxed">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <p>Your API key is stored locally in your browser and synced securely to your private Firestore profile document for cross-device access.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Google API Key</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-850 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Data Portability Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <UploadCloud className="w-4.5 h-4.5 text-indigo-400" />
              Data Backup & Restore
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Keep regular backups of your offline local storage data. If you clear your browser cache, offline records may be lost.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button 
                onClick={handleExportData}
                className="flex-1 flex justify-center items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition-all border border-slate-700 text-xs cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4" /> Export Data (JSON)
              </button>
              <div className="flex-1 relative">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full flex justify-center items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl transition-all border border-slate-700 pointer-events-none text-xs">
                  <UploadCloud className="w-4 h-4" /> Import Backup
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-amber-500/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Importing a backup will completely overwrite your current schedules and ledger.</span>
            </div>
          </div>
        </div>

        {/* Right Column Wrapper */}
        <div className="space-y-4 flex flex-col h-fit">
          {/* Audio Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Bell className="w-4.5 h-4.5 text-indigo-400" />
              Notifications & Audio
            </h3>
            
            <div className="bg-slate-850/40 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-300">Browser Push Notifications</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Status: <span className={permission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}>{permission.toUpperCase()}</span></p>
              </div>
              {permission !== 'granted' && (
                <button onClick={askPermission} className="px-3 py-1 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer">
                  Enable
                </button>
              )}
            </div>

            {/* Ringtones 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {ringtones.map(tone => (
                <label key={tone.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${ringtone === tone.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-850/60 border-slate-800 hover:border-slate-700'}`}>
                  <input 
                    type="radio" 
                    name="ringtone" 
                    value={tone.id} 
                    checked={ringtone === tone.id}
                    onChange={() => setRingtone(tone.id)}
                    className="mt-1 sr-only"
                  />
                  <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${ringtone === tone.id ? 'border-indigo-400' : 'border-slate-650'}`}>
                    {ringtone === tone.id && <div className="w-2 h-2 bg-indigo-400 rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-200 text-xs truncate leading-snug">{tone.label}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">{tone.desc}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); testAlarm(tone.id); }}
                    className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-850 rounded transition-colors shrink-0"
                    title="Test Sound"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </label>
              ))}
            </div>
            
            <div className="pt-2 border-t border-slate-850">
              <label className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-750 bg-slate-850/20 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors">
                <div>
                  <p className="font-semibold text-slate-350 text-xs">Upload Custom Audio</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Choose an MP3, WAV, or OGG file.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 shrink-0">
                  <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-300">Browse...</span>
                </div>
                <input type="file" accept="audio/*" className="hidden" onChange={handleCustomRingtoneUpload} />
              </label>
            </div>
          </div>

          {/* HTML Importer Panel */}
          <HTMLImporter onTasksExtracted={onTasksExtracted} clearRoutines={clearRoutines} />
        </div>

      </div>

    </div>
  );
};

export default SettingsTab;
