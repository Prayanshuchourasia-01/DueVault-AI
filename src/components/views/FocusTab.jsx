import React from 'react';
import { FocusHUD } from '../FocusHUD';
import Timetable from '../Timetable';
import { InputEngine } from '../InputEngine';
import { PomodoroTimer } from '../PomodoroTimer';
import { AlarmWidget } from '../AlarmWidget';
import { combineDateAndTime } from '../../utils/timeUtils';

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
  
  const todayStr = new Date().toLocaleDateString('en-CA');
  const now = new Date();

  const academicCategories = [
    'study', 'coding', 'class', 'lab', 'hackathon', 'homework', 'exam', 
    'dsa', 'lecture', 'academic', 'timetable', 'revision', 'project', 
    'research', 'learning', 'course', 'test', 'quiz'
  ];

  // 1. Academic & Focus: Next 3 upcoming timetable routine blocks for today (sorted by start time, filtering out ended ones)
  let academicTasks = todaysRoutines
    .filter(t => {
      if (t.completed) return false;
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

  // 2. Life & Vault: Categorized Bills & Reminders
  // OVERDUE / MISSED TASKS (Date strictly before today & uncompleted)
  const overdueLifeTasks = tasks
    .filter(t => {
      if (t.completed || t.id === activeTask?.id || t.isRoutine || !!t.routineId) return false;
      const isAcademic = academicCategories.includes(t.category?.toLowerCase());
      const taskDate = new Date(t.date || t.start);
      taskDate.setHours(0,0,0,0);
      return !isAcademic && taskDate < todayDate;
    })
    .sort((a, b) => new Date(a.start || a.date) - new Date(b.start || b.date));

  // THIS WEEK TASKS (Date from today up to cutoffDate)
  const thisWeekTasks = tasks
    .filter(t => {
      if (t.completed || t.id === activeTask?.id || t.isRoutine || !!t.routineId) return false;
      const isAcademic = academicCategories.includes(t.category?.toLowerCase());
      const taskDate = new Date(t.date || t.start);
      taskDate.setHours(0,0,0,0);
      return !isAcademic && taskDate >= todayDate && taskDate <= cutoffDate;
    })
    .sort((a, b) => new Date(a.start || a.date) - new Date(b.start || b.date));

  // NEXT WEEK TASKS
  const nextWeekTasks = tasks
    .filter(t => {
      if (t.completed || t.id === activeTask?.id || t.isRoutine || !!t.routineId) return false;
      const isAcademic = academicCategories.includes(t.category?.toLowerCase());
      const taskDate = new Date(t.date || t.start);
      taskDate.setHours(0,0,0,0);
      return !isAcademic && taskDate > cutoffDate && taskDate <= endOfNextWeek;
    })
    .sort((a, b) => new Date(a.start || a.date) - new Date(b.start || b.date));

  // THIS MONTH TASKS
  const thisMonthTasks = tasks
    .filter(t => {
      if (t.completed || t.id === activeTask?.id || t.isRoutine || !!t.routineId) return false;
      const isAcademic = academicCategories.includes(t.category?.toLowerCase());
      const taskDate = new Date(t.date || t.start);
      taskDate.setHours(0,0,0,0);
      return !isAcademic && taskDate > endOfNextWeek && taskDate <= endOfThisMonth;
    })
    .sort((a, b) => new Date(a.start || a.date) - new Date(b.start || b.date));

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
          {overdueLifeTasks.length > 0 && (
            <Timetable 
              title="🚨 Overdue & Pending Action" 
              tasks={overdueLifeTasks} 
              onToggleComplete={onToggleComplete}
              onDeleteTask={onDeleteTask}
              accentColor="border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
            />
          )}

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

          {overdueLifeTasks.length === 0 && thisWeekTasks.length === 0 && nextWeekTasks.length === 0 && thisMonthTasks.length === 0 && (
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
