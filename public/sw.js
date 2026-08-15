const CACHE_NAME = 'duevault-cache-v13';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

let cachedRoutines = [];
let cachedTasks = [];
const notifiedKeys = new Set();

// Install event - caching basic resources
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first fallback to cache
self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// Helper: Schedule native OS notification using TimestampTrigger if available
function scheduleNativeTrigger(title, options, timestamp) {
  try {
    if (typeof Notification !== 'undefined' && 'showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined') {
      if (timestamp > Date.now()) {
        self.registration.showNotification(title, {
          ...options,
          showTrigger: new TimestampTrigger(timestamp)
        });
        console.log(`[SW] Native OS TimestampTrigger registered for "${title}" at`, new Date(timestamp).toLocaleTimeString());
        return true;
      }
    }
  } catch (err) {
    console.warn('[SW] TimestampTrigger error:', err);
  }
  return false;
}

// Pre-schedule upcoming block notifications for the day
function preScheduleDayNotifications() {
  const nowMs = Date.now();
  const todayStr = new Date().toLocaleDateString('en-CA');

  cachedRoutines.forEach(rt => {
    // Schedule Start Notification
    if (rt.start) {
      const startDate = new Date(rt.start);
      const startMs = startDate.getTime();
      if (!isNaN(startMs) && startMs > nowMs) {
        const rtHours = String(startDate.getHours()).padStart(2, '0');
        const rtMinutes = String(startDate.getMinutes()).padStart(2, '0');
        const rtTimeStr = `${rtHours}:${rtMinutes}`;
        const tag = `rt-start-${rt.id}-${todayStr}-${rtTimeStr}`;

        scheduleNativeTrigger(`🟢 Block Starting: ${rt.title}`, {
          body: `Your timetable block "${rt.title}" is starting now at ${rtTimeStr}.`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          vibrate: [200, 100, 200, 100, 200],
          tag,
          renotify: true,
          requireInteraction: true,
          actions: [
            { action: 'MARK_DONE', title: '✅ Mark Done' },
            { action: 'DISMISS', title: '✖ Dismiss' }
          ],
          data: { taskId: rt.routineId || rt.id, isRoutine: true }
        }, startMs);
      }
    }

    // Schedule End Notification
    if (rt.end) {
      const endDate = new Date(rt.end);
      const endMs = endDate.getTime();
      if (!isNaN(endMs) && endMs > nowMs) {
        const rtEndHours = String(endDate.getHours()).padStart(2, '0');
        const rtEndMinutes = String(endDate.getMinutes()).padStart(2, '0');
        const rtEndTimeStr = `${rtEndHours}:${rtEndMinutes}`;
        const tagEnd = `rt-end-${rt.id}-${todayStr}-${rtEndTimeStr}`;

        scheduleNativeTrigger(`🔴 Block Ended: ${rt.title}`, {
          body: `Your timetable block "${rt.title}" has ended at ${rtEndTimeStr}.`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          vibrate: [100, 50, 100],
          tag: tagEnd,
          renotify: true,
          actions: [
            { action: 'MARK_DONE', title: '✅ Mark Done' },
            { action: 'DISMISS', title: '✖ Dismiss' }
          ],
          data: { taskId: rt.routineId || rt.id, isRoutine: true }
        }, endMs);
      }
    }
  });
}

// Listen for messages from the main app
self.addEventListener('message', (e) => {
  if (!e.data) return;

  if (e.data.type === 'SYNC_SCHEDULES') {
    cachedRoutines = e.data.routines || [];
    cachedTasks = e.data.tasks || [];
    console.log('[SW] Schedules synced into Service Worker background context:', cachedRoutines.length, 'routines,', cachedTasks.length, 'tasks');
    preScheduleDayNotifications();
  }

  if (e.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = e.data;
    const tag = options.tag || ('duevault-sw-' + Date.now());
    self.registration.showNotification(title, {
      body: options.body || '',
      icon: options.icon || '/favicon.svg',
      badge: options.badge || '/favicon.svg',
      vibrate: options.vibrate || [200, 100, 200],
      tag,
      renotify: true,
      requireInteraction: true,
      silent: false,
      actions: options.actions || [
        { action: 'MARK_DONE', title: '✅ Mark Done' },
        { action: 'DISMISS', title: '✖ Dismiss' }
      ],
      data: options.data || {}
    });
  }
});

// Background Check Loop inside Service Worker context (runs as fallback when app is backgrounded)
function checkBackgroundNotifications() {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${currentHours}:${currentMinutes}`;
  const todayStr = now.toLocaleDateString('en-CA');

  // Check cached routine timetable blocks with UNIFIED tags for deduplication
  cachedRoutines.forEach(rt => {
    if (rt.start) {
      const startDate = new Date(rt.start);
      if (!isNaN(startDate.getTime())) {
        const rtHours = String(startDate.getHours()).padStart(2, '0');
        const rtMinutes = String(startDate.getMinutes()).padStart(2, '0');
        const rtTimeStr = `${rtHours}:${rtMinutes}`;
        const tag = `rt-start-${rt.id}-${todayStr}-${rtTimeStr}`;
        if (rtTimeStr === timeStr && !notifiedKeys.has(tag)) {
          notifiedKeys.add(tag);
          self.registration.showNotification(`🟢 Block Starting: ${rt.title}`, {
            body: `Your timetable block "${rt.title}" is starting now at ${rtTimeStr}.`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [200, 100, 200, 100, 200],
            tag,
            renotify: true,
            requireInteraction: true,
            silent: false,
            actions: [
              { action: 'MARK_DONE', title: '✅ Mark Done' },
              { action: 'DISMISS', title: '✖ Dismiss' }
            ],
            data: { taskId: rt.routineId || rt.id, isRoutine: true }
          });
        }
      }
    }

    if (rt.end) {
      const endDate = new Date(rt.end);
      if (!isNaN(endDate.getTime())) {
        const rtEndHours = String(endDate.getHours()).padStart(2, '0');
        const rtEndMinutes = String(endDate.getMinutes()).padStart(2, '0');
        const rtEndTimeStr = `${rtEndHours}:${rtEndMinutes}`;
        const tagEnd = `rt-end-${rt.id}-${todayStr}-${rtEndTimeStr}`;
        if (rtEndTimeStr === timeStr && !notifiedKeys.has(tagEnd)) {
          notifiedKeys.add(tagEnd);
          self.registration.showNotification(`🔴 Block Ended: ${rt.title}`, {
            body: `Your timetable block "${rt.title}" has ended at ${rtEndTimeStr}.`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [100, 50, 100],
            tag: tagEnd,
            renotify: true,
            silent: false,
            actions: [
              { action: 'MARK_DONE', title: '✅ Mark Done' },
              { action: 'DISMISS', title: '✖ Dismiss' }
            ],
            data: { taskId: rt.routineId || rt.id, isRoutine: true }
          });
        }
      }
    }
  });

  // Check cached custom tasks
  cachedTasks.forEach(task => {
    if (task.completed || task.date !== todayStr) return;
    if (task.start) {
      const startDate = new Date(task.start);
      if (!isNaN(startDate.getTime())) {
        const tHours = String(startDate.getHours()).padStart(2, '0');
        const tMinutes = String(startDate.getMinutes()).padStart(2, '0');
        const tTimeStr = `${tHours}:${tMinutes}`;
        const tag = `task-start-${task.id}-${todayStr}-${tTimeStr}`;
        if (tTimeStr === timeStr && !notifiedKeys.has(tag)) {
          notifiedKeys.add(tag);
          self.registration.showNotification(`🟢 Task Starting: ${task.title}`, {
            body: `Your task "${task.title}" is starting now at ${tTimeStr}.`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [200, 100, 200],
            tag,
            renotify: true,
            requireInteraction: true,
            silent: false,
            actions: [
              { action: 'MARK_DONE', title: '✅ Mark Done' },
              { action: 'DISMISS', title: '✖ Dismiss' }
            ],
            data: { taskId: task.id, isRoutine: false }
          });
        }
      }
    }
  });
}

// Check every 10 seconds in the background
setInterval(checkBackgroundNotifications, 10000);

// Notification click and action button behavior
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const action = e.action;
  const data = e.notification.data || {};

  if (action === 'MARK_DONE' && data.taskId) {
    console.log('[SW] Mark Done action clicked for task:', data.taskId);
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      clientList.forEach(client => {
        client.postMessage({ type: 'TOGGLE_COMPLETE_TASK', taskId: data.taskId });
      });
    });

    self.registration.showNotification('🎉 Item Completed!', {
      body: 'Your timetable block / task has been marked as done!',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'done-confirm-' + Date.now()
    });
    return;
  }

  if (action === 'DISMISS') {
    return; // Notification closed
  }

  // Default click behavior (tapping body): focus or open app window
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
