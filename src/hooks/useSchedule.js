import { useState, useEffect } from 'react';
import { isTaskActive, isTaskUpcoming, isTaskOver, combineDateAndTime } from '../utils/timeUtils';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

export const academicCategories = ['study', 'coding', 'class', 'lab', 'hackathon', 'homework', 'exam', 'dsa', 'lecture', 'academic'];

const generateDefaultTasks = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA');
  
  const tmrw = new Date(now); tmrw.setDate(tmrw.getDate() + 1);
  const nextWeek = new Date(now); nextWeek.setDate(nextWeek.getDate() + 7);
  
  const tmrwStr = tmrw.toLocaleDateString('en-CA');
  const nextWeekStr = nextWeek.toLocaleDateString('en-CA');

  const start1 = new Date(now.getTime() - 5 * 60 * 1000);
  const end1 = new Date(now.getTime() + 15 * 60 * 1000);
  
  const start2 = new Date(now.getTime() + 20 * 60 * 1000);
  const end2 = new Date(now.getTime() + 40 * 60 * 1000);

  return [
    {
      id: 'default-1',
      title: 'Practice Binary Trees (DSA)',
      date: dateStr,
      start: start1.toISOString(),
      end: end1.toISOString(),
      priority: 'MEDIUM',
      category: 'coding',
      completed: false,
      reminderDays: [0]
    },
    {
      id: 'default-2',
      title: 'Submit Kaggle Hackathon Build',
      date: dateStr,
      start: start2.toISOString(),
      end: end2.toISOString(),
      priority: 'CRITICAL',
      category: 'hackathon',
      completed: false,
      reminderDays: [1, 0]
    },
    {
      id: 'default-3',
      title: 'Advanced Machine Learning Course Starts',
      date: nextWeekStr,
      start: combineDateAndTime(nextWeekStr, '10:00'),
      end: combineDateAndTime(nextWeekStr, '12:00'),
      priority: 'HIGH',
      category: 'study',
      completed: false,
      reminderDays: [7, 3, 1]
    },
    {
      id: 'default-4',
      title: 'Internet & WiFi Subscription Due',
      date: tmrwStr,
      start: combineDateAndTime(tmrwStr, '09:00'),
      end: combineDateAndTime(tmrwStr, '23:59'),
      priority: 'CRITICAL',
      category: 'finance',
      completed: false,
      reminderDays: [5, 1, 0]
    },
    {
      id: 'default-5',
      title: 'Grocery Shopping & Meal Prep',
      date: tmrwStr,
      start: combineDateAndTime(tmrwStr, '17:00'),
      end: combineDateAndTime(tmrwStr, '19:00'),
      priority: 'LOW',
      category: 'chores',
      completed: false,
      reminderDays: []
    }
  ];
};

const defaultRoutines = [
  { id: 'rt-1', title: 'Data Structures Lecture', category: 'class', dayOfWeek: 'Monday', start: '10:00', end: '11:30', exceptions: {} },
  { id: 'rt-2', title: 'Advanced OS Lab', category: 'lab', dayOfWeek: 'Wednesday', start: '14:00', end: '17:00', exceptions: {} },
  { id: 'rt-3', title: 'AI Study Group', category: 'study', dayOfWeek: 'Friday', start: '16:00', end: '18:00', exceptions: {} }
];

export const useSchedule = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [timetableConfig, setTimetableConfig] = useState({ validFrom: '', validUntil: '' });

  const [activeTask, setActiveTask] = useState(null);
  const [nextTask, setNextTask] = useState(null);
  const [todaysRoutines, setTodaysRoutines] = useState([]);

  // Subscribe to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Sync tasks, routines, configs in real-time
  useEffect(() => {
    if (!currentUser) {
      // Load offline from localStorage and reset states
      const savedTasks = localStorage.getItem('duevault_tasks');
      if (savedTasks) {
        try { setTasks(JSON.parse(savedTasks)); } catch (e) { setTasks(generateDefaultTasks()); }
      } else {
        const defaults = generateDefaultTasks();
        setTasks(defaults);
        localStorage.setItem('duevault_tasks', JSON.stringify(defaults));
      }

      const savedRoutines = localStorage.getItem('duevault_routines');
      if (savedRoutines) {
        try { 
          const p = JSON.parse(savedRoutines);
          setRoutines(p.map(r => ({ ...r, exceptions: r.exceptions || {} }))); 
        } catch (e) { setRoutines(defaultRoutines); }
      } else {
        setRoutines(defaultRoutines);
        localStorage.setItem('duevault_routines', JSON.stringify(defaultRoutines));
      }

      const savedConfig = localStorage.getItem('duevault_timetable_config');
      if (savedConfig) {
        try { setTimetableConfig(JSON.parse(savedConfig)); } catch (e) { }
      } else {
        setTimetableConfig({ validFrom: '', validUntil: '' });
      }
      return;
    }

    // Subscribe to Firestore for active logged-in user
    const tasksRef = collection(db, 'users', currentUser.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push(doc.data());
      });
      setTasks(list);
    });

    const routinesRef = collection(db, 'users', currentUser.uid, 'routines');
    const unsubRoutines = onSnapshot(routinesRef, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        list.push(doc.data());
      });
      setRoutines(list.map(r => ({ ...r, exceptions: r.exceptions || {} })));
    });

    const configDocRef = doc(db, 'users', currentUser.uid, 'config', 'timetable');
    const unsubConfig = onSnapshot(configDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTimetableConfig(docSnap.data());
      } else {
        setTimetableConfig({ validFrom: '', validUntil: '' });
      }
    });

    return () => {
      unsubTasks();
      unsubRoutines();
      unsubConfig();
    };
  }, [currentUser]);

  // History Logger for data modification audits
  const logHistory = async (action, entity, entityId, dataBefore, dataAfter) => {
    if (!auth.currentUser) return;
    try {
      const logDocRef = doc(collection(db, 'users', auth.currentUser.uid, 'history_logs'));
      await setDoc(logDocRef, {
        action,
        entity,
        entityId,
        timestamp: serverTimestamp(),
        dataBefore: dataBefore ? JSON.parse(JSON.stringify(dataBefore)) : null,
        dataAfter: dataAfter ? JSON.parse(JSON.stringify(dataAfter)) : null
      });
    } catch (err) {
      console.error('History logging error:', err);
    }
  };

  const recalculateSchedule = () => {
    const today = new Date();
    const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    const todayDateStr = today.toLocaleDateString('en-CA');
    
    let todaysRoutines = [];

    const isGloballyValid = (!timetableConfig.validFrom || todayDateStr >= timetableConfig.validFrom) && 
                            (!timetableConfig.validUntil || todayDateStr <= timetableConfig.validUntil);

    if (isGloballyValid) {
      todaysRoutines = routines
        .filter(r => r.dayOfWeek === todayDayName)
        .filter(r => !r.validFrom || todayDateStr >= r.validFrom)
        .filter(r => !r.validUntil || todayDateStr <= r.validUntil)
        .map(r => {
          const exception = (r.exceptions && r.exceptions[todayDateStr]) ? r.exceptions[todayDateStr] : null;
          if (exception && exception.type === 'deleted') return null;

          const rStart = exception?.start || r.start;
          const rEnd = exception?.end || r.end;
          const rTitle = exception?.title || r.title;
          const rCat = exception?.category || r.category;
          const isCompleted = exception?.completed || false;

          return {
            ...r,
            id: `routine-spawn-${r.id}-${todayDateStr}`,
            routineId: r.id,
            title: rTitle,
            category: rCat,
            date: todayDateStr,
            start: combineDateAndTime(todayDateStr, rStart),
            end: combineDateAndTime(todayDateStr, rEnd),
            priority: 'MEDIUM',
            completed: isCompleted,
            isRoutine: true
          };
        })
        .filter(Boolean);
    }
    
    setTodaysRoutines(todaysRoutines);

    // Active Focus HUD candidates are strictly timetable routines (no Vault tasks)
    const allActiveCandidates = [...todaysRoutines];

    const sortedTasks = allActiveCandidates.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    let active = null;
    const upcoming = [];

    sortedTasks.forEach(task => {
      if (!task.completed) {
        if (isTaskActive(task.start, task.end)) {
          if (!active) {
            active = task;
          } else {
            const pLevel = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
            if (pLevel[task.priority] > pLevel[active.priority]) {
              upcoming.push(active);
              active = task;
            } else {
              upcoming.push(task);
            }
          }
        } else if (isTaskUpcoming(task.start)) {
          upcoming.push(task);
        }
      }
    });
    
    upcoming.sort((a, b) => new Date(a.start) - new Date(b.start));
    setActiveTask(active);
    setNextTask(upcoming.length > 0 ? upcoming[0] : null);
  };

  useEffect(() => {
    recalculateSchedule();
    const interval = setInterval(recalculateSchedule, 3000);
    return () => clearInterval(interval);
  }, [tasks, routines, timetableConfig]);

  const addTask = async (parsedTask) => {
    const startISO = combineDateAndTime(parsedTask.date, parsedTask.start);
    let endISO = combineDateAndTime(parsedTask.date, parsedTask.end);
    if (new Date(endISO) <= new Date(startISO)) {
      const endD = new Date(endISO);
      endD.setDate(endD.getDate() + 1);
      endISO = endD.toISOString();
    }
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newTask = {
      id,
      ...parsedTask,
      start: startISO,
      end: endISO,
      completed: false,
      reminderDays: parsedTask.reminderDays || []
    };

    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'tasks', id);
      await setDoc(docRef, newTask);
      await logHistory('create', 'task', id, null, newTask);
    } else {
      setTasks(prev => {
        const next = [...prev, newTask];
        localStorage.setItem('duevault_tasks', JSON.stringify(next));
        return next;
      });
    }
    return newTask;
  };

  const updateTask = async (id, updatedFields) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    if (!taskToUpdate) return;

    let newStart = taskToUpdate.start;
    let newEnd = taskToUpdate.end;
    if (updatedFields.date || updatedFields.startTimeStr || updatedFields.endTimeStr) {
      const uDate = updatedFields.date || taskToUpdate.date;
      const sTime = updatedFields.startTimeStr || new Date(taskToUpdate.start).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const eTime = updatedFields.endTimeStr || new Date(taskToUpdate.end).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      newStart = combineDateAndTime(uDate, sTime);
      newEnd = combineDateAndTime(uDate, eTime);
      if (new Date(newEnd) <= new Date(newStart)) {
        const endD = new Date(newEnd);
        endD.setDate(endD.getDate() + 1);
        newEnd = endD.toISOString();
      }
      updatedFields.start = newStart;
      updatedFields.end = newEnd;
      delete updatedFields.startTimeStr;
      delete updatedFields.endTimeStr;
    }

    const merged = { ...taskToUpdate, ...updatedFields };

    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'tasks', id);
      await setDoc(docRef, merged);
      await logHistory('update', 'task', id, taskToUpdate, merged);
    } else {
      setTasks(prev => {
        const next = prev.map(t => t.id === id ? merged : t);
        localStorage.setItem('duevault_tasks', JSON.stringify(next));
        return next;
      });
    }
  };

  const deleteTask = async (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'tasks', id);
      await deleteDoc(docRef);
      await logHistory('delete', 'task', id, taskToDelete, null);
    } else {
      setTasks(prev => {
        const next = prev.filter(t => t.id !== id);
        localStorage.setItem('duevault_tasks', JSON.stringify(next));
        return next;
      });
    }
  };
  
  const toggleComplete = async (id) => {
    if (id.startsWith('routine-spawn-')) {
      const parts = id.split('-');
      const dateStr = parts.slice(-3).join('-');
      const routineId = parts.slice(2, -3).join('-');
      
      const routineToUpdate = routines.find(r => r.id === routineId);
      if (!routineToUpdate) return;

      const currentException = routineToUpdate.exceptions && routineToUpdate.exceptions[dateStr] ? routineToUpdate.exceptions[dateStr] : {};
      const isCurrentlyCompleted = currentException.completed || false;
      const updatedExceptions = {
        ...(routineToUpdate.exceptions || {}),
        [dateStr]: { ...currentException, type: 'modified', completed: !isCurrentlyCompleted }
      };

      const merged = { ...routineToUpdate, exceptions: updatedExceptions };

      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'routines', routineId);
        await setDoc(docRef, merged);
        await logHistory('update', 'routine', routineId, routineToUpdate, merged);
      } else {
        setRoutines(prev => {
          const next = prev.map(r => r.id === routineId ? merged : r);
          localStorage.setItem('duevault_routines', JSON.stringify(next));
          return next;
        });
      }
    } else {
      const taskToUpdate = tasks.find(t => t.id === id);
      if (!taskToUpdate) return;
      const merged = { ...taskToUpdate, completed: !taskToUpdate.completed };

      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid, 'tasks', id);
        await setDoc(docRef, merged);
        await logHistory('update', 'task', id, taskToUpdate, merged);
      } else {
        setTasks(prev => {
          const next = prev.map(t => t.id === id ? merged : t);
          localStorage.setItem('duevault_tasks', JSON.stringify(next));
          return next;
        });
      }
    }
  };

  const clearAllCompleted = async () => {
    const tasksToClear = tasks.filter(t => t.completed || isTaskOver(t.end));
    if (currentUser) {
      for (const t of tasksToClear) {
        const docRef = doc(db, 'users', currentUser.uid, 'tasks', t.id);
        await deleteDoc(docRef);
        await logHistory('delete', 'task', t.id, t, null);
      }
    } else {
      setTasks(prev => {
        const next = prev.filter(t => !t.completed && !isTaskOver(t.end));
        localStorage.setItem('duevault_tasks', JSON.stringify(next));
        return next;
      });
    }
  };

  // === ROUTINE SPECIFIC ACTIONS ===
  const addRoutine = async (parsedRoutine) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newRoutine = {
      id,
      exceptions: {},
      ...parsedRoutine
    };
    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'routines', id);
      await setDoc(docRef, newRoutine);
      await logHistory('create', 'routine', id, null, newRoutine);
    } else {
      setRoutines(prev => {
        const next = [...prev, newRoutine];
        localStorage.setItem('duevault_routines', JSON.stringify(next));
        return next;
      });
    }
  };

  const clearRoutines = async () => {
    if (currentUser) {
      for (const r of routines) {
        const docRef = doc(db, 'users', currentUser.uid, 'routines', r.id);
        await deleteDoc(docRef);
        await logHistory('delete', 'routine', r.id, r, null);
      }
    } else {
      setRoutines([]);
      localStorage.setItem('duevault_routines', JSON.stringify([]));
    }
  };

  const addRoutineException = async (routineId, dateStr, type, changes = {}) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
    const updatedExceptions = {
      ...(routine.exceptions || {}),
      [dateStr]: { type, ...changes }
    };
    const merged = { ...routine, exceptions: updatedExceptions };

    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'routines', routineId);
      await setDoc(docRef, merged);
      await logHistory('update', 'routine', routineId, routine, merged);
    } else {
      setRoutines(prev => {
        const next = prev.map(r => r.id === routineId ? merged : r);
        localStorage.setItem('duevault_routines', JSON.stringify(next));
        return next;
      });
    }
  };

  const updateRoutineAll = async (routineId, changes) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
    const merged = { ...routine, ...changes };

    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'routines', routineId);
      await setDoc(docRef, merged);
      await logHistory('update', 'routine', routineId, routine, merged);
    } else {
      setRoutines(prev => {
        const next = prev.map(r => r.id === routineId ? merged : r);
        localStorage.setItem('duevault_routines', JSON.stringify(next));
        return next;
      });
    }
  };

  const deleteRoutine = async (routineId) => {
    const routine = routines.find(r => r.id === routineId);
    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'routines', routineId);
      await deleteDoc(docRef);
      await logHistory('delete', 'routine', routineId, routine, null);
    } else {
      setRoutines(prev => {
        const next = prev.filter(r => r.id !== routineId);
        localStorage.setItem('duevault_routines', JSON.stringify(next));
        return next;
      });
    }
  };

  const duplicateRoutinesToDays = async (routineIds, targetDays) => {
    const routinesToCopy = routines.filter(r => routineIds.includes(r.id));
    const newRoutines = [];
    targetDays.forEach(day => {
      routinesToCopy.forEach(rt => {
        const { id, exceptions, dayOfWeek, ...rest } = rt;
        newRoutines.push({
          ...rest,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          dayOfWeek: day,
          exceptions: {}
        });
      });
    });

    if (currentUser) {
      for (const newRt of newRoutines) {
        const docRef = doc(db, 'users', currentUser.uid, 'routines', newRt.id);
        await setDoc(docRef, newRt);
        await logHistory('create', 'routine', newRt.id, null, newRt);
      }
    } else {
      setRoutines(prev => {
        const next = [...prev, ...newRoutines];
        localStorage.setItem('duevault_routines', JSON.stringify(next));
        return next;
      });
    }
  };

  const replaceDayRoutines = async (sourceDay, targetDays) => {
    const sourceRoutines = routines.filter(r => r.dayOfWeek === sourceDay);
    const routinesToDelete = routines.filter(r => targetDays.includes(r.dayOfWeek));
    const newRoutines = [];
    
    targetDays.forEach(day => {
      sourceRoutines.forEach(rt => {
        const { id, exceptions, dayOfWeek, ...rest } = rt;
        newRoutines.push({
          ...rest,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          dayOfWeek: day,
          exceptions: {}
        });
      });
    });

    if (currentUser) {
      for (const r of routinesToDelete) {
        const docRef = doc(db, 'users', currentUser.uid, 'routines', r.id);
        await deleteDoc(docRef);
        await logHistory('delete', 'routine', r.id, r, null);
      }
      for (const newRt of newRoutines) {
        const docRef = doc(db, 'users', currentUser.uid, 'routines', newRt.id);
        await setDoc(docRef, newRt);
        await logHistory('create', 'routine', newRt.id, null, newRt);
      }
    } else {
      setRoutines(prev => {
        let nextRoutines = prev.filter(r => !targetDays.includes(r.dayOfWeek));
        const next = [...nextRoutines, ...newRoutines];
        localStorage.setItem('duevault_routines', JSON.stringify(next));
        return next;
      });
    }
  };

  const handleSetTimetableConfig = async (newConfig) => {
    if (currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'config', 'timetable');
      await setDoc(docRef, newConfig);
    } else {
      setTimetableConfig(newConfig);
      localStorage.setItem('duevault_timetable_config', JSON.stringify(newConfig));
    }
  };

  return {
    tasks, routines, todaysRoutines, timetableConfig,
    activeTask, nextTask,
    addTask, updateTask, deleteTask, toggleComplete, clearAllCompleted,
    addRoutine, clearRoutines, addRoutineException, updateRoutineAll, deleteRoutine,
    duplicateRoutinesToDays, replaceDayRoutines,
    setTimetableConfig: handleSetTimetableConfig
  };
};
