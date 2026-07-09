import React from 'react';
import { FocusHUD } from '../FocusHUD';
import { FocusHUD } from '../FocusHUD';
import Timetable from '../Timetable';
import { InputEngine } from '../InputEngine';
import { PomodoroTimer } from '../PomodoroTimer';

const academicCategories = ['study', 'coding', 'class', 'lab', 'hackathon', 'homework', 'exam', 'dsa', 'lecture', 'academic'];

const FocusTab = ({ 
  tasks, 
  todaysRoutines = [],
  activeTask, 
  nextTask, 
  onAddTask, 
  onToggleComplete, 
  onDeleteTask,
  startAlarm
}) => {
  
  // Filter for today only
  const todayStr = new Date().toLocaleDateString('en-CA');
  const nowTime = new Date();
  
  const todaysTasks = tasks.filter(t => t.date === todayStr);
  const allTodayItems = [...todaysTasks, ...todaysRoutines];

  const excludedCategories = ['finance', 'chores', 'life', 'vault', 'admin', 'personal'];

  // 1. Academic & Focus: Today's upcoming routine & academic tasks (Limit to Next 5)
  let academicTasks = allTodayItems
    .filter(t => !excludedCategories.includes(t.category?.toLowerCase()) || t.isRoutine)
    .filter(t => t.id !== activeTask?.id && new Date(t.end) > nowTime)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 5);

  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  
  const endOfThisWeek = new Date(todayDate);
  endOfThisWeek.setDate(endOfThisWeek.getDate() + (7 - endOfThisWeek.getDay())); // Sunday

  const endOfNextWeek = new Date(endOfThisWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

  const endOfThisMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);

  // 2. Life & Vault (Strategic Foresight): Upcoming Bills & Reminders
  const allUpcomingLifeTasks = tasks
    .filter(t => {
      if (t.completed || t.id === activeTask?.id) return false;
      const isBillOrFinance = ['finance', 'bill'].includes(t.category?.toLowerCase());
      const hasReminder = t.reminderDays && t.reminderDays.length > 0;
      const isFuture = new Date(t.end || t.date) >= todayDate;
      return (isBillOrFinance || hasReminder) && isFuture;
    })
    .sort((a, b) => new Date(a.start || a.date) - new Date(b.start || b.date));

  const thisWeekTasks = allUpcomingLifeTasks.filter(t => new Date(t.start || t.date) <= endOfThisWeek);
  const nextWeekTasks = allUpcomingLifeTasks.filter(t => {
    const d = new Date(t.start || t.date);
    return d > endOfThisWeek && d <= endOfNextWeek;
  });
  const thisMonthTasks = allUpcomingLifeTasks.filter(t => {
    const d = new Date(t.start || t.date);
    return d > endOfNextWeek && d <= endOfThisMonth;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-24 md:pb-6">
      <InputEngine onAddTask={onAddTask} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Focus HUD & Pomodoro */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <FocusHUD activeTask={activeTask} nextTask={nextTask} onToggleComplete={onToggleComplete} />
          <PomodoroTimer startAlarm={startAlarm} />
        </div>

        {/* Column 2: Academic & Focus Timetable */}
        <div className="lg:col-span-1">
          <Timetable 
            title="Academic & Focus" 
            tasks={academicTasks} 
            onToggleComplete={onToggleComplete}
            onDeleteTask={onDeleteTask}
            accentColor="border-cyan-500/50"
          />
        </div>

        {/* Column 3: Upcoming Bills & Reminders */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Timetable 
            title="Bills & Reminders: This Week" 
            tasks={thisWeekTasks} 
            onToggleComplete={onToggleComplete}
            onDeleteTask={onDeleteTask}
            accentColor="border-rose-500/50"
          />
          <Timetable 
            title="Bills & Reminders: Next Week" 
            tasks={nextWeekTasks} 
            onToggleComplete={onToggleComplete}
            onDeleteTask={onDeleteTask}
            accentColor="border-orange-500/50"
          />
          <Timetable 
            title="Bills & Reminders: This Month" 
            tasks={thisMonthTasks} 
            onToggleComplete={onToggleComplete}
            onDeleteTask={onDeleteTask}
            accentColor="border-indigo-500/50"
          />
        </div>

      </div>
    </div>
  );
};

export default FocusTab;
