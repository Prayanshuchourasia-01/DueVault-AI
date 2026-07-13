import React, { useState, useEffect } from 'react';
import { BellRing, Eye, X } from 'lucide-react';
import Navigation from './components/Navigation';
import FocusTab from './components/views/FocusTab';
import DashboardTab from './components/views/DashboardTab';
import TimetableTab from './components/views/TimetableTab';
import VaultTab from './components/views/VaultTab';
import FinanceTab from './components/views/FinanceTab';
import SettingsTab from './components/views/SettingsTab';
import AdminTab from './components/views/AdminTab';
import TaskEditModal from './components/TaskEditModal';
import { AlarmOverlay } from './components/AlarmOverlay';
import AuthOverlay from './components/AuthOverlay';
import { useSchedule } from './hooks/useSchedule';
import { useAudioAlarm } from './hooks/useAudioAlarm';
import { useNotifications } from './hooks/useNotifications';
import { ToastContainer } from './components/ToastContainer';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './utils/firebase';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('focus');
  const [editingTask, setEditingTask] = useState(null);
  const { sendNotification } = useNotifications();

  const [theme, setTheme] = useState(() => localStorage.getItem('duevault_theme') || 'dark');

  // 1. Subscribe to Firebase Auth and check Admin Profile doc
  useEffect(() => {
    let unsubProfile = () => {};
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Subscribe to user profile document to check for isAdmin flag
        const profileRef = doc(db, 'users', user.uid);
        unsubProfile = onSnapshot(profileRef, (snap) => {
          if (snap.exists() && snap.data().isAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          setAuthLoading(false);
        }, (err) => {
          console.error("Error subscribing to profile:", err);
          setIsAdmin(false);
          setAuthLoading(false);
        });
      } else {
        setIsAdmin(false);
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribe();
      unsubProfile();
    };
  }, []);

  const handleSignOut = () => {
    signOut(auth).then(() => {
      setCurrentUser(null);
      setIsAdmin(false);
      setActiveTab('focus');
    }).catch(err => console.error("Sign out error:", err));
  };

  useEffect(() => {
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${theme}-theme`);
    localStorage.setItem('duevault_theme', theme);
  }, [theme]);

  const {
    tasks,
    routines,
    todaysRoutines,
    timetableConfig,
    activeTask,
    nextTask,
    addTask,
    addRoutine,
    updateTask,
    deleteTask,
    toggleComplete,
    clearRoutines,
    setTimetableConfig,
    addRoutineException,
    updateRoutineAll,
    deleteRoutine,
    duplicateRoutinesToDays,
    replaceDayRoutines
  } = useSchedule();

  const [reminders, setReminders] = useState([]);
  const [dismissedReminderIds, setDismissedReminderIds] = useState(() => {
    try {
      const saved = localStorage.getItem('duevault_dismissed_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const dismissReminder = (id) => {
    setDismissedReminderIds(prev => {
      const updated = [...prev, id];
      localStorage.setItem('duevault_dismissed_reminders', JSON.stringify(updated));
      return updated;
    });
  };

  // Calculate System Reminders
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeReminders = [];

    tasks.forEach(task => {
      if (task.completed || !task.reminderDays || task.reminderDays.length === 0) return;
      if (dismissedReminderIds.includes(task.id)) return;

      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);

      const diffTime = taskDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (task.reminderDays.includes(diffDays)) {
        activeReminders.push({ ...task, daysLeft: diffDays });
      }
    });

    setReminders(activeReminders);
  }, [tasks, dismissedReminderIds]);

  const { isAlarmPlaying, alarmContext, startAlarm, stopAlarm } = useAudioAlarm();
  const [dismissedAlarmTaskId, setDismissedAlarmTaskId] = useState(null);

  const handleDismissAlarm = () => {
    if (activeTask) {
      setDismissedAlarmTaskId(activeTask.id);
    }
    stopAlarm();
  };

  // Handle Exact Time Reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA');
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      tasks.forEach(task => {
        if (!task.completed && task.date === todayStr && task.reminderTime === timeStr) {
          // Trigger alarm if it's the exact minute
          const tone = localStorage.getItem('duevault_ringtone') || 'modern-chime';
          startAlarm(tone, {
            title: `REMINDER: ${task.title}`,
            message: "Scheduled time reached. Please attend to your vault item."
          });
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [tasks, startAlarm]);

  // Handle High Priority Active Task Alarms
  useEffect(() => {
    if (activeTask && !activeTask.completed) {
      if (activeTask.id === dismissedAlarmTaskId) {
        stopAlarm();
        return;
      }
      if (activeTask.priority === 'HIGH' || activeTask.priority === 'CRITICAL') {
        const tone = localStorage.getItem('duevault_ringtone') || 'modern-chime';
        startAlarm(tone, {
          title: activeTask.title,
          message: "A high-priority deadline/block has been initialized. Audio alarms are active. Deactivation authorization required."
        });
      }
    } else {
      stopAlarm();
    }
  }, [activeTask, dismissedAlarmTaskId, startAlarm, stopAlarm]);

  // Robust Block Starting Notification Scheduler (exact minute matching)
  const notifiedTasksRef = React.useRef(new Set());
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const todayStr = now.toLocaleDateString('en-CA');
      
      // Check routine tasks starting now
      todaysRoutines.forEach(rt => {
        if (!rt.start) return;
        const rtTimeStr = new Date(rt.start).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const key = `rt-${rt.id}-${todayStr}-${rtTimeStr}`;
        if (rtTimeStr === timeStr && !notifiedTasksRef.current.has(key)) {
          sendNotification("Block Starting", `${rt.title} is starting now at ${timeStr}.`);
          notifiedTasksRef.current.add(key);
        }
      });

      // Check custom tasks starting now
      tasks.forEach(task => {
        if (task.date !== todayStr || !task.start) return;
        const taskTimeStr = new Date(task.start).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const key = `task-${task.id}-${todayStr}-${taskTimeStr}`;
        if (taskTimeStr === timeStr && !notifiedTasksRef.current.has(key)) {
          sendNotification("Block Starting", `${task.title} is starting now at ${timeStr}.`);
          notifiedTasksRef.current.add(key);
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tasks, todaysRoutines, sendNotification]);

  const handleToggleComplete = (taskId) => {
    const task = tasks.find(t => t.id === taskId) || routines.find(r => r.id === taskId) || todaysRoutines.find(r => r.id === taskId);
    const isCompleted = task?.completed;
    if (task && !isCompleted) {
      sendNotification("Task Completed", `Excellent work finishing: ${task.title}`);
    }
    toggleComplete(taskId);
  };

  // Auth Loading Render Gate
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <span className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-400">Synchronizing security protocols...</p>
      </div>
    );
  }

  // Auth Sign-In Render Gate
  if (!currentUser) {
    return <AuthOverlay onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 flex flex-col md:flex-row print:bg-white print:text-black ${theme === 'light' ? 'light-theme' : ''}`}>
        <ToastContainer />

        {/* Sidebar Navigation */}
        <div className="print:hidden h-full">
          <Navigation 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            theme={theme} 
            setTheme={setTheme} 
            currentUser={currentUser}
            isAdmin={isAdmin}
            onSignOut={handleSignOut}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 print:p-0 print:h-auto print:overflow-visible">

          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden flex justify-center items-center mb-6 pt-2 print:hidden">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              DueVault AI
            </h1>
          </div>

          {/* System Reminders Banner */}
          {reminders.length > 0 && (
            <div className="mb-6 space-y-2 print:hidden">
              {reminders.map(rem => (
                <div key={rem.id} className="bg-indigo-900/40 border border-indigo-500/50 rounded-xl p-4 flex items-center justify-between gap-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 flex-shrink-0">
                      <BellRing className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-200 truncate">Upcoming Task Reminder: {rem.title}</h4>
                      <p className="text-xs text-slate-400">
                        {rem.daysLeft === 0 ? "Due today!" : `Starts in ${rem.daysLeft} day${rem.daysLeft > 1 ? 's' : ''} on ${rem.date}.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      onClick={() => setEditingTask(rem)}
                      className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-all cursor-pointer"
                      title="View / Edit Task"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button 
                      onClick={() => dismissReminder(rem.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                      title="Dismiss Reminder"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View Router */}
          {activeTab === 'focus' && (
            <FocusTab
              tasks={tasks}
              todaysRoutines={todaysRoutines}
              activeTask={activeTask}
              nextTask={nextTask}
              onAddTask={addTask}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={deleteTask}
              startAlarm={startAlarm}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardTab tasks={tasks} routines={routines} onToggleComplete={handleToggleComplete} />
          )}

          {activeTab === 'timetable' && (
            <TimetableTab
              routineTasks={routines}
              timetableConfig={timetableConfig}
              setTimetableConfig={setTimetableConfig}
              addRoutine={addRoutine}
              addRoutineException={addRoutineException}
              updateRoutineAll={updateRoutineAll}
              deleteRoutine={deleteRoutine}
              duplicateRoutinesToDays={duplicateRoutinesToDays}
              replaceDayRoutines={replaceDayRoutines}
            />
          )}

          {activeTab === 'vault' && (
            <VaultTab
              tasks={tasks}
              onAddTask={addTask}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={deleteTask}
              onEditTask={(t) => setEditingTask(t)}
            />
          )}

          {activeTab === 'finances' && (
            <FinanceTab tasks={tasks} sendNotification={sendNotification} onUpdateTask={updateTask} />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              onTasksExtracted={(extractedTasks) => extractedTasks.forEach(t => addRoutine(t))}
              clearRoutines={clearRoutines}
            />
          )}

          {activeTab === 'admin' && isAdmin && (
            <AdminTab />
          )}

        </main>

        {/* Global Modals & Overlays */}
        <TaskEditModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={updateTask}
        />

        <AlarmOverlay
          isVisible={isAlarmPlaying}
          title={alarmContext?.title}
          message={alarmContext?.message}
          onDismiss={handleDismissAlarm}
        />

      </div>
  );
}

export default App;
