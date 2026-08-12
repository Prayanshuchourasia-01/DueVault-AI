import React from 'react';
import { FocusHUD } from '../FocusHUD';
import Timetable from '../Timetable';
import { InputEngine } from '../InputEngine';
import { PomodoroTimer } from '../PomodoroTimer';
import { AlarmWidget } from '../AlarmWidget';



const FocusTab = ({ 
  tasks, 
  todaysRoutines = [],
  activeTask, 
  nextTask, 
  onAddTask, 
  onToggleComplete, 
  onDeleteTask,
  startAlarm,
  sendNotification
}) => {
  
  // Filter for today only
  const todayStr = new Date().toLocaleDateString('en-CA');

  const academicCategories = [
    'study', 'coding', 'class', 'lab', 'hackathon', 'homework', 'exam', 
    'dsa', 'lecture', 'academic', 'timetable', 'revision', 'project', 
    'research', 'learning', 'course', 'test', 'quiz'
  ];

  // 1. Academic & Focus: Next 3 upcoming timetable routine blocks for today
  //    Include blocks that haven't ended yet (active or upcoming), excluding currently active block shown in FocusHUD
  const now = new Date();
  let academicTasks = todaysRoutines
    .filter(t => {
      if (t.completed) return false;
      // Exclude the block already displayed in Focus HUD
      if (activeTask && t.id === activeTask.id) return false;
      // Include blocks whose end time is still in the future
      const endTime = new Date(t.end);
      return !isNaN(endTime.getTime()) && endTime > now;
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 3);

  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);

  const cutoffDate = new Date(todayDate);
  const daysToNextMonday = todayDate.getDay() === 0 ? 1 : (8 - todayDate.getDay());
  cutoffDate.setDate(todayDate.getDate() + daysToNextMonday + 2); // Wednesday of next week
  cutoffDate.setHours(23, 59, 59, 999);

  const endOfNextWeek = new Date(cutoffDate);
  endOfNextWeek.setDate(cutoffDate.getDate() + 7);

  const endOfThisMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);

  // 2. Life & Vault (Strategic Foresight): Upcoming Bills & Reminders
  const allUpcomingLifeTasks = tasks
    .filter(t => {
      if (t.completed || t.id === activeTask?.id || t.isRoutine || !!t.routineId) return false;
      const isAcademic = academicCategories.includes(t.category?.toLowerCase());
      const isFuture = new Date(t.end || t.date || t.start) >= todayDate;
      return !isAcademic && isFuture;
    })
    .sort((a, b) => new Date(a.start || a.date) - new Date(b.start || b.date));

  const thisWeekTasks = allUpcomingLifeTasks.filter(t => new Date(t.start || t.date) <= cutoffDate);
  const nextWeekTasks = allUpcomingLifeTasks.filter(t => {
    const d = new Date(t.start || t.date);
    return d > cutoffDate && d <= endOfNextWeek;
  });
  const thisMonthTasks = allUpcomingLifeTasks.filter(t => {
    const d = new Date(t.start || t.date);
    return d > endOfNextWeek && d <= endOfThisMonth;
  });

  const hasAcademic = academicTasks.length > 0;
  const hasLife = thisWeekTasks.length > 0 || nextWeekTasks.length > 0 || thisMonthTasks.length > 0;

  return (
    <div className="w-full mx-auto space-y-6 animate-fade-in pb-4">
      <InputEngine onAddTask={onAddTask} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
        
        {/* Column 1: Focus HUD & Pomodoro Timer */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <FocusHUD activeTask={activeTask} nextTask={nextTask} todaysRoutines={todaysRoutines} onToggleComplete={onToggleComplete} />
          <PomodoroTimer startAlarm={startAlarm} sendNotification={sendNotification} />
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
          {thisWeekTasks.length > 0 && (
            <Timetable 
              title="Bills & Reminders: This Week" 
              tasks={thisWeekTasks} 
              onToggleComplete={onToggleComplete}
              onDeleteTask={onDeleteTask}
              accentColor="border-rose-500/50"
            />
          )}
          {nextWeekTasks.length > 0 && (
            <Timetable 
              title="Bills & Reminders: Next Week" 
              tasks={nextWeekTasks} 
              onToggleComplete={onToggleComplete}
              onDeleteTask={onDeleteTask}
              accentColor="border-orange-500/50"
            />
          )}
          {thisMonthTasks.length > 0 && (
            <Timetable 
              title="Bills & Reminders: This Month" 
              tasks={thisMonthTasks} 
              onToggleComplete={onToggleComplete}
              onDeleteTask={onDeleteTask}
              accentColor="border-indigo-500/50"
            />
          )}
          {thisWeekTasks.length === 0 && nextWeekTasks.length === 0 && thisMonthTasks.length === 0 && (
            <Timetable 
              title="Bills & Reminders" 
              tasks={[]} 
              onToggleComplete={onToggleComplete}
              onDeleteTask={onDeleteTask}
              accentColor="border-slate-800"
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default FocusTab;
