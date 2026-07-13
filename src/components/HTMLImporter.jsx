import React, { useState, useEffect } from 'react';
import { FileUp, Loader2, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { useGeminiParser } from '../hooks/useGeminiParser';
import { auth, db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

const HTMLImporter = ({ onTasksExtracted, clearRoutines }) => {
  const [file, setFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingTasks, setPendingTasks] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [demoHtml, setDemoHtml] = useState('');
  const { parseHTMLSchedule, isParsing, parseError } = useGeminiParser();

  // Load Admin-defined Timetable template from Firestore
  useEffect(() => {
    const loadDemoHtml = async () => {
      try {
        const docRef = doc(db, 'config', 'demo_html');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().htmlContent) {
          setDemoHtml(snap.data().htmlContent);
        }
      } catch (err) {
        console.error("Error loading demo HTML template:", err);
      }
    };
    loadDemoHtml();
  }, []);

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

  const handleDownloadDemo = () => {
    const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
    <title>Weekly Timetable Template</title>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: #f1f5f9; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #334155; padding: 12px; text-align: left; }
        th { background-color: #1e293b; color: #38bdf8; }
    </style>
</head>
<body>
    <h2>Weekly Academic Schedule</h2>
    <p>Use this template as a reference for importing routines into DueVault AI.</p>
    <table>
        <thead>
            <tr>
                <th>Day</th>
                <th>Subject / Lecture</th>
                <th>Time (Start - End)</th>
                <th>Category</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Monday</td>
                <td>Database Management Systems (CS-302)</td>
                <td>09:00 - 10:30</td>
                <td>Class</td>
            </tr>
            <tr>
                <td>Monday</td>
                <td>Software Engineering Lab</td>
                <td>14:00 - 16:00</td>
                <td>Lab</td>
            </tr>
            <tr>
                <td>Tuesday</td>
                <td>Artificial Intelligence (CS-304)</td>
                <td>10:45 - 12:15</td>
                <td>Class</td>
            </tr>
            <tr>
                <td>Wednesday</td>
                <td>Database Management Systems (CS-302)</td>
                <td>09:00 - 10:30</td>
                <td>Class</td>
            </tr>
            <tr>
                <td>Thursday</td>
                <td>Artificial Intelligence (CS-304)</td>
                <td>10:45 - 12:15</td>
                <td>Class</td>
            </tr>
        </tbody>
    </table>
</body>
</html>`;
    const content = demoHtml || defaultTemplate;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'duevault_timetable_template.html';
    a.click();
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
        const extractedTasks = await parseHTMLSchedule(htmlContent, customPrompt);
        if (extractedTasks.length > 0) {
          setPendingTasks(extractedTasks);
        } else {
          alert("Gemini couldn't find any schedule data in this file. Try typing in guidance/instructions.");
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
    setCustomPrompt('');
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

      {/* Download Reference Template */}
      <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl">
        <div className="min-w-0 flex-1 pr-3">
          <h4 className="text-xs font-bold text-slate-300">Need a starting reference?</h4>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">Download the reference layout HTML template.</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadDemo}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-colors border border-slate-700 cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
      </div>

      {!pendingTasks ? (
        <>
          <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 transition-colors text-center cursor-pointer relative">
            <input 
              type="file" 
              accept=".html" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <FileUp className={`w-7 h-7 mb-1.5 ${file ? 'text-indigo-400' : 'text-slate-500'}`} />
              <p className="font-semibold text-slate-300 text-xs">
                {file ? file.name : "Drag & drop your HTML file here"}
              </p>
              {!file && <p className="text-[10px] text-slate-500 mt-0.5">or click to browse</p>}
            </div>
          </div>

          {/* AI Parsing Guidance */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block">AI Parsing Guidance (Optional)</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. 'Exclude Friday lectures', 'Mark CS-302 as Critical priority', 'Shift Tuesday classes 1 hour later'"
              rows="2"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all font-sans resize-none"
            />
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
            className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 disabled:text-slate-600 text-white font-bold py-3 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider"
          >
            {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4.5 h-4.5" />}
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Replace Existing Timetable
            </button>
            <button 
              onClick={() => confirmImport(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Append to Current Timetable
            </button>
            <button 
              onClick={() => { setPendingTasks(null); setFile(null); setCustomPrompt(''); }}
              className="text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors mt-2 cursor-pointer"
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
