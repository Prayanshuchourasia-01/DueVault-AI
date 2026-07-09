import { useState, useEffect } from 'react';
import { isTaskActive, isTaskUpcoming, isTaskOver, combineDateAndTime } from '../utils/timeUtils';

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

export const useSchedule = () => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('duevault_tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    const defaults = generateDefaultTasks();
    localStorage.setItem('duevault_tasks', JSON.stringify(defaults));
    return defaults;
  });

  const [routines, setRoutines] = useState(() => {
    const saved = localStorage.getItem('duevault_routines');
    if (saved) {
      try { 
        const p = JSON.parse(saved);
        // Ensure legacy routines have exceptions object
        return p.map(r => ({ ...r, exceptions: r.exceptions || {} }));
      } catch(e) {}
    }
    const defaultRoutines = [
      { id: 'rt-1', title: 'Data Structures Lecture', category: 'class', dayOfWeek: 'Monday', start: '10:00', end: '11:30', exceptions: {} },
      { id: 'rt-2', title: 'Advanced OS Lab', category: 'lab', dayOfWeek: 'Wednesday', start: '14:00', end: '17:00', exceptions: {} },
      { id: 'rt-3', title: 'AI Study Group', category: 'study', dayOfWeek: 'Friday', start: '16:00', end: '18:00', exceptions: {} }
    ];
    localStorage.setItem('duevault_routines', JSON.stringify(defaultRoutines));
    return defaultRoutines;
  });

  const [timetableConfig, setTimetableConfig] = useState(() => {
    const saved = localStorage.getItem('duevault_timetable_config');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return { validFrom: '', validUntil: '' };
  });

  const [activeTask, setActiveTask] = useState(null);
  const [nextTask, setNextTask] = useState(null);
  const [todaysRoutines, setTodaysRoutines] = useState([]);

  useEffect(() => {
    localStorage.setItem('duevault_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('duevault_routines', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('duevault_timetable_config', JSON.stringify(timetableConfig));
  }, [timetableConfig]);

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

    const academicCategories = [
      'study', 'coding', 'class', 'lab', 'hackathon', 'homework', 'exam', 
      'dsa', 'lecture', 'academic', 'timetable', 'revision', 'project', 
      'research', 'learning', 'course', 'test', 'quiz'
    ];
    
    const allActiveCandidates = [...tasks.filter(t => t.date === todayDateStr), ...todaysRoutines].filter(t => 
      t.isRoutine || academicCategories.includes((t.category || '').toLowerCase())
    );

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

  const addTask = (parsedTask) => {
    const startISO = combineDateAndTime(parsedTask.date, parsedTask.start);
    let endISO = combineDateAndTime(parsedTask.date, parsedTask.end);
    if (new Date(endISO) <= new Date(startISO)) {
      const endD = new Date(endISO);
      endD.setDate(endD.getDate() + 1);
      endISO = endD.toISOString();
    }
    const newTask = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...parsedTask,
      start: startISO,
      end: endISO,
      completed: false,
      reminderDays: parsedTask.reminderDays || []
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (id, updatedFields) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        let newStart = t.start;
        let newEnd = t.end;
        if (updatedFields.date || updatedFields.startTimeStr || updatedFields.endTimeStr) {
          const uDate = updatedFields.date || t.date;
          const sTime = updatedFields.startTimeStr || new Date(t.start).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
          const eTime = updatedFields.endTimeStr || new Date(t.end).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
          
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
        return { ...t, ...updatedFields };
      }
      return t;
    }));
  };

  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  
  const toggleComplete = (id) => {
    if (id.startsWith('routine-spawn-')) {
      const parts = id.split('-');
      // format: routine-spawn-{routineId}-{YYYY-MM-DD}
      // Since routineId might have hyphens (e.g. rt-1), let's extract date
      const dateStr = parts.slice(-3).join('-');
      const routineId = parts.slice(2, -3).join('-');
      
      setRoutines(prev => prev.map(r => {
        if (r.id === routineId) {
          const currentException = r.exceptions && r.exceptions[dateStr] ? r.exceptions[dateStr] : {};
          const isCurrentlyCompleted = currentException.completed || false;
          return {
            ...r,
            exceptions: {
              ...(r.exceptions || {}),
              [dateStr]: { ...currentException, type: 'modified', completed: !isCurrentlyCompleted }
            }
          };
        }
        return r;
      }));
    } else {
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      ));
    }
  };

  const clearAllCompleted = () => setTasks(prev => prev.filter(t => !t.completed && !isTaskOver(t.end)));

  // === ROUTINE SPECIFIC ACTIONS ===
  const addRoutine = (parsedRoutine) => {
    setRoutines(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      exceptions: {},
      ...parsedRoutine
    }]);
  };

  const clearRoutines = () => setRoutines([]);

  const addRoutineException = (routineId, dateStr, type, changes = {}) => {
    setRoutines(prev => prev.map(r => {
      if (r.id === routineId) {
        return {
          ...r,
          exceptions: {
            ...(r.exceptions || {}),
            [dateStr]: { type, ...changes }
          }
        };
      }
      return r;
    }));
  };

  const updateRoutineAll = (routineId, changes) => {
    setRoutines(prev => prev.map(r => r.id === routineId ? { ...r, ...changes } : r));
  };

  const deleteRoutine = (routineId) => setRoutines(prev => prev.filter(r => r.id !== routineId));

  const duplicateRoutinesToDays = (routineIds, targetDays) => {
    setRoutines(prev => {
      const routinesToCopy = prev.filter(r => routineIds.includes(r.id));
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
      return [...prev, ...newRoutines];
    });
  };

  const replaceDayRoutines = (sourceDay, targetDays) => {
     setRoutines(prev => {
       const sourceRoutines = prev.filter(r => r.dayOfWeek === sourceDay);
       // Remove old routines in target days
       let nextRoutines = prev.filter(r => !targetDays.includes(r.dayOfWeek));
       
       targetDays.forEach(day => {
         sourceRoutines.forEach(rt => {
            const { id, exceptions, dayOfWeek, ...rest } = rt;
            nextRoutines.push({
              ...rest,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              dayOfWeek: day,
              exceptions: {}
            });
         });
       });
       return nextRoutines;
     });
  };

  return {
    tasks, routines, todaysRoutines, timetableConfig,
    activeTask, nextTask,
    addTask, updateTask, deleteTask, toggleComplete, clearAllCompleted,
    addRoutine, clearRoutines, addRoutineException, updateRoutineAll, deleteRoutine,
    duplicateRoutinesToDays, replaceDayRoutines,
    setTimetableConfig
  };
};
