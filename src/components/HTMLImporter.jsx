import React, { useState } from 'react';
import { FileUp, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useGeminiParser } from '../hooks/useGeminiParser';
import { auth } from '../utils/firebase';

const HTMLImporter = ({ onTasksExtracted, clearRoutines }) => {
  const [file, setFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingTasks, setPendingTasks] = useState(null);
  const { parseHTMLSchedule, isParsing, parseError } = useGeminiParser();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'text/html') {
      setFile(selected);
      setSuccessMsg('');
      setPendingTasks(null);
    } else {
      alert("Please select a valid .html file");
    }
  };

  const handleUpload = () => {
    if (!file) return;

    const user = auth.currentUser;
    const keyName = user ? `duevault_gemini_key_${user.uid}` : 'duevault_gemini_key';
    let apiKey = localStorage.getItem(keyName);
    if (!apiKey && user) {
      apiKey = localStorage.getItem('duevault_gemini_key');
    }
    if (!apiKey) {
      alert("Please save your Gemini API Key in the settings panel first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const htmlContent = e.target.result;
      try {
        const extractedTasks = await parseHTMLSchedule(htmlContent, apiKey);
        if (extractedTasks.length > 0) {
          setPendingTasks(extractedTasks);
        } else {
          alert("Gemini couldn't find any schedule data in this file.");
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = (replace = false) => {
    if (replace && clearRoutines) {
      clearRoutines();
    }
    onTasksExtracted(pendingTasks);
    setSuccessMsg(`Successfully ${replace ? 'replaced' : 'appended'} ${pendingTasks.length} routines!`);
    setPendingTasks(null);
    setFile(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-4">
        <FileUp className="w-5 h-5 text-indigo-400" />
        HTML Timetable Importer
      </h3>
      
      <p className="text-sm text-slate-400">
        Upload a `.html` file of your university schedule or weekly timetable. DueVault AI will automatically extract classes, labs, and deadlines and inject them into your Vault.
      </p>

      {!pendingTasks ? (
        <>
          <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 transition-colors text-center cursor-pointer relative">
            <input 
              type="file" 
              accept=".html" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <FileUp className={`w-8 h-8 mb-2 ${file ? 'text-indigo-400' : 'text-slate-500'}`} />
              <p className="font-semibold text-slate-300">
                {file ? file.name : "Drag & drop your HTML file here"}
              </p>
              {!file && <p className="text-xs text-slate-500 mt-1">or click to browse</p>}
            </div>
          </div>

          {parseError && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
              {parseError}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <button 
            onClick={handleUpload}
            disabled={!file || isParsing}
            className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all"
          >
            {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
            {isParsing ? 'Extracting via AI...' : 'Parse & Import Schedule'}
          </button>
        </>
      ) : (
        <div className="border border-indigo-500/50 bg-indigo-500/10 rounded-xl p-6 text-center space-y-4 animate-fade-in">
          <div className="flex justify-center text-indigo-400 mb-2">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h4 className="font-bold text-white text-lg">AI Found {pendingTasks.length} Routines</h4>
          <p className="text-sm text-slate-300">How would you like to apply these to your schedule?</p>
          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={() => confirmImport(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              Replace Existing Timetable
            </button>
            <button 
              onClick={() => confirmImport(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              Append to Current Timetable
            </button>
            <button 
              onClick={() => { setPendingTasks(null); setFile(null); }}
              className="text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors mt-2"
            >
              Cancel Import
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default HTMLImporter;
