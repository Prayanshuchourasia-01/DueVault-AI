import React, { useState, useEffect } from 'react';
import { BellRing } from 'lucide-react';
import Navigation from './components/Navigation';
import FocusTab from './components/views/FocusTab';
import DashboardTab from './components/views/DashboardTab';
import TimetableTab from './components/views/TimetableTab';
import VaultTab from './components/views/VaultTab';
import FinanceTab from './components/views/FinanceTab';
import SettingsTab from './components/views/SettingsTab';
import TaskEditModal from './components/TaskEditModal';
import { AlarmOverlay } from './components/AlarmOverlay';
import { useSchedule } from './hooks/useSchedule';
import { useAudioAlarm } from './hooks/useAudioAlarm';
import { useNotifications } from './hooks/useNotifications';
import { ToastContainer } from './components/ToastContainer';

function App() {
  const [activeTab, setActiveTab] = useState('focus');
  const [editingTask, setEditingTask] = useState(null);
  const { sendNotification } = useNotifications();

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

  // Calculate System Reminders
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeReminders = [];

    tasks.forEach(task => {
      if (task.completed || !task.reminderDays || task.reminderDays.length === 0) return;

      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);

      const diffTime = taskDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (task.reminderDays.includes(diffDays)) {
        activeReminders.push({ ...task, daysLeft: diffDays });
      }
    });

    setReminders(activeReminders);
  }, [tasks]);

  const { isAlarmPlaying, alarmContext, startAlarm, stopAlarm } = useAudioAlarm();

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
  }, [activeTask, startAlarm, stopAlarm]);

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
    // Note: routines might not have 'completed' directly before toggle, but if we toggle it, we assume completion if it wasn't
    const isCompleted = task?.completed;
    if (task && !isCompleted) {
      sendNotification("Task Completed", `Excellent work finishing: ${task.title}`);
    }
    toggleComplete(taskId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 flex flex-col md:flex-row print:bg-white print:text-black">
        <ToastContainer />

        {/* Sidebar Navigation */}
        <div className="print:hidden h-full">
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
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
            <div className="mb-6 space-y-2">
              {reminders.map(rem => (
                <div key={rem.id} className="bg-indigo-900/40 border border-indigo-500/50 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                      <BellRing className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">System Reminder: {rem.title}</h4>
                      <p className="text-xs text-slate-400">
                        {rem.daysLeft === 0 ? "Due today!" : `Starts in ${rem.daysLeft} day${rem.daysLeft > 1 ? 's' : ''} on ${rem.date}.`}
                      </p>
                    </div>
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
            <FinanceTab tasks={tasks} sendNotification={sendNotification} />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              onTasksExtracted={(extractedTasks) => extractedTasks.forEach(t => addRoutine(t))}
              clearRoutines={clearRoutines}
            />
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
          onDismiss={stopAlarm}
        />

      </div>
    );
  }

  export default App;
