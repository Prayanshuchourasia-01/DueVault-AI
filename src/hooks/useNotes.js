import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const useNotes = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      const savedNotes = localStorage.getItem('duevault_notes');
      if (savedNotes) {
        try {
          setNotes(JSON.parse(savedNotes));
        } catch (e) {
          setNotes([]);
        }
      } else {
        setNotes([]);
      }
      return;
    }

    const notesRef = collection(db, 'users', currentUser.uid, 'notes');
    const unsubNotes = onSnapshot(notesRef, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push(doc.data());
      });
      // Sort by updatedAt descending
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      setNotes(list);
    });

    return () => unsubNotes();
  }, [currentUser]);

  const addNote = async (text, color = 'slate') => {
    if (!text.trim()) return;
    
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNote = {
      id,
      text,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'notes', id);
      await setDoc(docRef, newNote);
    } else {
      setNotes(prev => {
        const next = [newNote, ...prev];
        localStorage.setItem('duevault_notes', JSON.stringify(next));
        return next;
      });
    }
    return newNote;
  };

  const updateNote = async (id, text, color) => {
    const noteToUpdate = notes.find(n => n.id === id);
    if (!noteToUpdate) return;
    
    const merged = { ...noteToUpdate, text, color: color || noteToUpdate.color, updatedAt: Date.now() };

    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'notes', id);
      await setDoc(docRef, merged);
    } else {
      setNotes(prev => {
        const next = prev.map(n => n.id === id ? merged : n);
        localStorage.setItem('duevault_notes', JSON.stringify(next));
        return next;
      });
    }
  };

  const deleteNote = async (id) => {
    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'notes', id);
      await deleteDoc(docRef);
    } else {
      setNotes(prev => {
        const next = prev.filter(n => n.id !== id);
        localStorage.setItem('duevault_notes', JSON.stringify(next));
        return next;
      });
    }
  };

  return {
    notes,
    addNote,
    updateNote,
    deleteNote
  };
};
