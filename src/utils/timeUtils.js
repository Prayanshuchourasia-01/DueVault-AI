/**
 * Time utility functions for DueVault AI
 */

/**
 * Combine YYYY-MM-DD and HH:MM into a single ISO string
 */
export const combineDateAndTime = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return d.toISOString();
};

/**
 * Check if the task is currently active based on current time
 * @param {string} startISO - Start time of the task (ISO string)
 * @param {string} endISO - End time of the task (ISO string)
 * @returns {boolean}
 */
export const isTaskActive = (startISO, endISO) => {
  const now = new Date();
  const start = new Date(startISO);
  const end = new Date(endISO);
  return now >= start && now <= end;
};

/**
 * Check if a task is upcoming
 * @param {string} startISO - Start time of the task (ISO string)
 * @returns {boolean}
 */
export const isTaskUpcoming = (startISO) => {
  const now = new Date();
  const start = new Date(startISO);
  return start > now;
};

/**
 * Check if a task is in the past (over)
 * @param {string} endISO - End time of the task (ISO string)
 * @returns {boolean}
 */
export const isTaskOver = (endISO) => {
  const now = new Date();
  const end = new Date(endISO);
  return end < now;
};

/**
 * Format date to a readable form (e.g. "Today", "Tomorrow", "Mon, Jul 7")
 * @param {string} dateISO 
 * @returns {string}
 */
export const formatFriendlyDate = (dateISO) => {
  const date = new Date(dateISO);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
};

/**
 * Format time to readable local string (e.g. "05:00 PM" or "17:00")
 * @param {string} dateISO 
 * @returns {string}
 */
export const formatFriendlyTime = (dateISO) => {
  const date = new Date(dateISO);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Calculates remaining time in seconds and object format until destination time
 * @param {string} targetISO - Destination date ISO string
 * @returns {{ hours: number, minutes: number, seconds: number, totalSeconds: number }}
 */
export const calculateRemainingTime = (targetISO) => {
  const now = new Date().getTime();
  const target = new Date(targetISO).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds };
};

/**
 * Convert remaining time to a string (e.g. "01:23:45" or "00:05")
 * @param {string} targetISO 
 * @returns {string}
 */
export const formatCountdown = (targetISO) => {
  const { hours, minutes, seconds, totalSeconds } = calculateRemainingTime(targetISO);
  
  if (totalSeconds <= 0) return '00:00:00';

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  return `${hStr}:${mStr}:${sStr}`;
};

/**
 * Get progress percentage for a task from start to end time
 * @param {string} startISO 
 * @param {string} endISO 
 * @returns {number} 0 to 100
 */
export const getTaskProgress = (startISO, endISO) => {
  const now = new Date().getTime();
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();

  if (now < start) return 0;
  if (now > end) return 100;

  const total = end - start;
  const elapsed = now - start;
  return Math.round((elapsed / total) * 100);
};
