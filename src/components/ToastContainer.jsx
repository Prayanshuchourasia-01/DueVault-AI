import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleShowToast = (e) => {
      const id = Date.now();
      const newToast = { id, ...e.detail };
      setToasts(prev => [...prev, newToast]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 flex flex-col items-end pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-4 w-72 md:w-80 pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-300 flex items-start gap-3"
        >
          <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-100">{toast.title}</h4>
            {toast.body && <p className="text-xs text-slate-400 mt-1">{toast.body}</p>}
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
