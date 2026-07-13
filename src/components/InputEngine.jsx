import React, { useState } from 'react';
import { Sparkles, Terminal, ArrowRight, Loader2, Info } from 'lucide-react';
import { useGeminiParser } from '../hooks/useGeminiParser';
import { auth } from '../utils/firebase';

const SUGGESTIONS = [
  "Add Practice coding today from 16:00 to 18:00",
  "WiFi bill payment due at 19:30, high urgency",
  "Schedule break from 15:30 to 15:50"
];

export const InputEngine = ({ apiKey, onAddTask, onOpenSettings }) => {
  const [inputText, setInputText] = useState('');
  const { isParsing, parseError, parseTaskText } = useGeminiParser();
  const [successMsg, setSuccessMsg] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const user = auth.currentUser;
    const keyName = user ? `duevault_gemini_key_${user.uid}` : 'duevault_gemini_key';
    let apiKey = localStorage.getItem(keyName);
    if (!apiKey && user) {
      apiKey = localStorage.getItem('duevault_gemini_key');
    }
    if (!apiKey) {
      setLocalError("Gemini API Key is missing. Please go to the Settings tab on the left to add it.");
      return;
    }

    setLocalError(null);
    setSuccessMsg(false);

    try {
      const parsedTask = await parseTaskText(inputText, apiKey);
      onAddTask(parsedTask);
      setInputText('');
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
    setLocalError(null);
  };

  const errorToDisplay = localError || parseError;

  return (
    <div className="glass-panel p-4 rounded-xl border border-cyber-card-border shadow-lg relative overflow-hidden w-full animate-in fade-in slide-in-from-top duration-300">
      
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-48 h-12 bg-cyber-indigo/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        
        {/* Terminal Header */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Terminal className="w-5 h-5 text-cyber-indigo" />
          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-200 font-sans">
              AI Command Console
            </h3>
            <p className="text-4xs text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
              Execute Natural Language Schedules
            </p>
          </div>
        </div>

        {/* NLP Input Form */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-3xl w-full">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder="e.g. Schedule coding study block today from 14:00 to 16:30..."
              disabled={isParsing}
              className="w-full bg-slate-950 border border-slate-800/80 focus:border-cyber-indigo focus:ring-1 focus:ring-cyber-indigo rounded-lg pl-4 pr-12 py-2.5 text-slate-100 placeholder:text-slate-600 text-xs focus:outline-none transition-all font-sans"
            />
            <button
              type="submit"
              disabled={isParsing || !inputText.trim()}
              className="absolute right-1.5 p-1.5 bg-cyber-indigo/15 hover:bg-cyber-indigo/30 text-cyber-indigo disabled:opacity-40 disabled:hover:bg-cyber-indigo/15 rounded-md transition-all duration-150 flex items-center justify-center cursor-pointer"
              title="Execute Parse Command"
            >
              {isParsing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Suggestions Inline */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0 max-w-md">
          {SUGGESTIONS.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="text-4xs bg-slate-900/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-300 border border-slate-800/80 hover:border-slate-700/80 px-2 py-1 rounded transition-all text-left truncate max-w-[170px]"
              title={suggestion}
            >
              {suggestion}
            </button>
          ))}
        </div>

      </div>

      {/* Live feedback reports */}
      {isParsing && (
        <div className="text-4xs text-cyber-cyan flex items-center gap-1.5 animate-pulse mt-2 pl-1.5">
          <Sparkles className="w-3 h-3" />
          <span>Compiling sentence structure via Google Gemini NLP...</span>
        </div>
      )}

      {successMsg && (
        <div className="text-4xs text-cyber-emerald flex items-center gap-1.5 mt-2 bg-emerald-950/20 border border-emerald-900/20 py-1.5 px-3 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
          <Sparkles className="w-3 h-3" />
          <span>Task parsed and appended to active LocalStorage vault successfully.</span>
        </div>
      )}

      {errorToDisplay && (
        <div className="text-4xs text-cyber-crimson mt-2 bg-red-950/25 border border-red-900/20 p-2.5 rounded-lg space-y-1.5 flex flex-col">
          <div className="flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyber-crimson flex-shrink-0 mt-0.5" />
            <span className="font-sans leading-relaxed">{errorToDisplay}</span>
          </div>
        </div>
      )}

    </div>
  );
};
