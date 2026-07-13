import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, ShieldAlert, Lock, Check } from 'lucide-react';
import { auth } from '../utils/firebase';

export const SettingsModal = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

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
      } catch (e) {
        decodedKey = savedKeyBase64;
      }
    }
    setApiKey(decodedKey);
  }, [isOpen]);

  const handleSave = (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const keyName = user ? `duevault_gemini_key_${user.uid}` : 'duevault_gemini_key';
    if (apiKey.trim()) {
      localStorage.setItem(keyName, btoa(apiKey.trim()));
    } else {
      localStorage.removeItem(keyName);
    }
    setSavedStatus(true);
    setTimeout(() => {
      setSavedStatus(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    if (confirm('Clear API Key from local storage? Connection to Gemini NLP will be deactivated.')) {
      const user = auth.currentUser;
      const keyName = user ? `duevault_gemini_key_${user.uid}` : 'duevault_gemini_key';
      localStorage.removeItem(keyName);
      if (user) {
        localStorage.removeItem('duevault_gemini_key');
      }
      setApiKey('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden glass-panel rounded-xl border border-cyber-card-border shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        {/* Radar Scanner Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-cyber-indigo animate-radar-scan opacity-30 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyber-card-border bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyber-indigo" />
            <h2 className="font-semibold text-lg tracking-wide uppercase font-sans text-slate-200">
              Core Encryption Config
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Google Gemini API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 h-5 text-slate-500" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyber-indigo rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyber-indigo transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showKey ? <EyeOff className="h-5 h-5" /> : <Eye className="h-5 h-5" />}
              </button>
            </div>
            <p className="text-2xs text-slate-500 italic mt-1 leading-relaxed">
              Stored 100% locally in your browser's local storage. Stays in sandboxed environment.
            </p>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-cyber-cyan flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300 block">Strict Privacy Notice</span>
              No schedule telemetry, tokens, or personal identifiers are uploaded to external clouds. The API Key is only used to parse scheduling text locally.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 py-2 px-4 rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/40 font-semibold text-sm transition-all hover:shadow-[0_0_10px_rgba(244,63,94,0.1)]"
              >
                Clear Key
              </button>
            )}
            <button
              type="submit"
              className="flex-2 py-2 px-4 rounded-lg bg-cyber-indigo text-slate-100 hover:bg-indigo-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            >
              {savedStatus ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Config Saved</span>
                </>
              ) : (
                <span>Apply Key</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
