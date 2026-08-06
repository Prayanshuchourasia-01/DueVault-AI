import React, { useState } from 'react';
import { StickyNote, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const COLORS = [
  { id: 'slate', bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-200' },
  { id: 'rose', bg: 'bg-rose-950/40', border: 'border-rose-900/50', text: 'text-rose-200' },
  { id: 'amber', bg: 'bg-amber-950/40', border: 'border-amber-900/50', text: 'text-amber-200' },
  { id: 'emerald', bg: 'bg-emerald-950/40', border: 'border-emerald-900/50', text: 'text-emerald-200' },
  { id: 'indigo', bg: 'bg-indigo-950/40', border: 'border-indigo-900/50', text: 'text-indigo-200' }
];

const NotesTab = ({ notes, onAddNote, onUpdateNote, onDeleteNote }) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteColor, setNewNoteColor] = useState('slate');
  
  const [editingId, setEditingId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editNoteColor, setEditNoteColor] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(newNoteText, newNoteColor);
    setNewNoteText('');
    setNewNoteColor('slate');
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditNoteText(note.text);
    setEditNoteColor(note.color || 'slate');
  };

  const saveEdit = () => {
    if (!editNoteText.trim()) return;
    onUpdateNote(editingId, editNoteText, editNoteColor);
    setEditingId(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in pb-24 md:pb-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <StickyNote className="w-6 h-6 text-indigo-400" />
          Personal Notes & Reminders
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          A quiet space to jot down stray thoughts, ideas, or reminders that don't belong in your schedule.
        </p>

        <form onSubmit={handleAdd} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Write a new note..."
            className="w-full bg-transparent border-none text-white text-sm focus:outline-none resize-none min-h-[80px]"
          />
          <div className="flex justify-between items-center border-t border-slate-800/80 pt-3">
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setNewNoteColor(c.id)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${c.bg} ${newNoteColor === c.id ? 'border-white scale-110' : c.border}`}
                  title={`Color: ${c.id}`}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={!newNoteText.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Save Note
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 italic text-sm">
            Your scratchpad is empty. Add a note above!
          </div>
        ) : (
          notes.map(note => {
            const colorScheme = COLORS.find(c => c.id === note.color) || COLORS[0];
            const isEditing = editingId === note.id;

            if (isEditing) {
              const editColorScheme = COLORS.find(c => c.id === editNoteColor) || COLORS[0];
              return (
                <div key={note.id} className={`${editColorScheme.bg} border ${editColorScheme.border} rounded-xl p-4 shadow-lg flex flex-col gap-3 animate-fade-in`}>
                  <textarea
                    value={editNoteText}
                    onChange={(e) => setEditNoteText(e.target.value)}
                    className="w-full bg-black/20 border border-black/20 rounded text-white text-sm focus:outline-none p-2 resize-none h-32"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1.5">
                      {COLORS.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setEditNoteColor(c.id)}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${c.bg} ${editNoteColor === c.id ? 'border-white scale-110' : c.border}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-white bg-black/20 rounded">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={saveEdit} className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={note.id} className={`${colorScheme.bg} border ${colorScheme.border} rounded-xl p-4 shadow-lg flex flex-col hover:-translate-y-1 transition-transform`}>
                <div className={`text-sm flex-1 whitespace-pre-wrap ${colorScheme.text}`}>
                  {note.text}
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-black/10">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(note.updatedAt).toLocaleDateString('en-CA')}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(note)} className="text-slate-400 hover:text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteNote(note.id)} className="text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotesTab;
