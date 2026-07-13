import React, { useState, useEffect } from 'react';
import { Settings2, Key, Bell, Volume2, Save, ShieldAlert, Code, UploadCloud, DownloadCloud, AlertTriangle } from 'lucide-react';
import { useAudioAlarm } from '../../hooks/useAudioAlarm';
import { useNotifications } from '../../hooks/useNotifications';
import HTMLImporter from '../HTMLImporter';
import { auth } from '../../utils/firebase';

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
    if (!savedKeyBase64 && user) {
      savedKeyBase64 = localStorage.getItem('duevault_gemini_key') || '';
    }
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

  const handleSave = () => {
    const user = auth.currentUser;
    const keyName = user ? `duevault_gemini_key_${user.uid}` : 'duevault_gemini_key';
    if (apiKey.trim()) {
      localStorage.setItem(keyName, btoa(apiKey.trim()));
    } else {
      localStorage.removeItem(keyName);
    }
    localStorage.setItem('duevault_ringtone', ringtone);
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
    { id: 'custom', label: 'Custom Audio', desc: 'Your uploaded ringtone.' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-24 md:pb-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-indigo-400" />
          System Configuration
        </h2>
        <p className="text-slate-400">Manage your local API keys and personalize the Focus HUD experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column Wrapper */}
        <div className="space-y-6 flex flex-col h-fit">
          {/* API Key Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
              <Key className="w-5 h-5 text-cyan-400" />
              Gemini API Key
            </h3>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-200 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p><strong>Privacy Guarantee:</strong> Your API key is stored strictly in your browser's <code>localStorage</code>. It is never sent to any external server other than Google's Gemini endpoint.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">API Key</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Data Portability Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              Data Backup & Restore
            </h3>
            <p className="text-sm text-slate-400">
              DueVault is a privacy-first application. All data is stored in your browser's Local Storage. 
              If you clear your browser cache, you will lose everything. Please backup your Vault regularly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={handleExportData}
                className="flex-1 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all border border-slate-700"
              >
                <DownloadCloud className="w-5 h-5" /> Export Data (JSON)
              </button>
              <div className="flex-1 relative">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all border border-slate-700 pointer-events-none">
                  <UploadCloud className="w-5 h-5" /> Import Backup
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-500/80 bg-amber-500/10 p-2 rounded">
              <AlertTriangle className="w-4 h-4" />
              Warning: Importing a backup will completely overwrite your current Vault and Finances.
            </div>
          </div>
        </div>

        {/* Right Column Wrapper */}
        <div className="space-y-6 flex flex-col h-fit">
          {/* Audio Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
              <Bell className="w-5 h-5 text-indigo-400" />
              Notifications & Audio
            </h3>
            
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm">Browser Push Notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">Status: <span className={permission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}>{permission.toUpperCase()}</span></p>
              </div>
              {permission !== 'granted' && (
                <button onClick={askPermission} className="px-4 py-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors rounded-lg text-xs font-bold uppercase tracking-wider">
                  Enable
                </button>
              )}
            </div>

            <div className="space-y-4 pt-2">
              {ringtones.map(tone => (
                <label key={tone.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${ringtone === tone.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                  <input 
                    type="radio" 
                    name="ringtone" 
                    value={tone.id} 
                    checked={ringtone === tone.id}
                    onChange={() => setRingtone(tone.id)}
                    className="mt-1 sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${ringtone === tone.id ? 'border-indigo-400' : 'border-slate-500'}`}>
                    {ringtone === tone.id && <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{tone.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{tone.desc}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); testAlarm(tone.id); }}
                    className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Test Sound"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </label>
              ))}
              
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-700 bg-slate-800/30 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors">
                  <div>
                    <p className="font-semibold text-white text-sm">Upload Custom Audio</p>
                    <p className="text-xs text-slate-400 mt-1">Select an MP3, WAV, or OGG file.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-300">Browse...</span>
                  </div>
                  <input type="file" accept="audio/*" className="hidden" onChange={handleCustomRingtoneUpload} />
                </label>
              </div>
            </div>
          </div>

          {/* HTML Importer Panel */}
          <HTMLImporter onTasksExtracted={onTasksExtracted} clearRoutines={clearRoutines} />
        </div>

      </div>

      {/* Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
        {savedMessage ? (
          <p className="text-emerald-400 text-sm font-medium animate-pulse">{savedMessage}</p>
        ) : <div />}
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
        >
          <Save className="w-5 h-5" />
          Save Settings
        </button>
      </div>

    </div>
  );
};

export default SettingsTab;
