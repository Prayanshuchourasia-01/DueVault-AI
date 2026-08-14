const CACHE_NAME = 'duevault-cache-v11';
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
  // Only handle standard http/https schemes (ignore chrome-extension, etc.)
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache new successful requests dynamically
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

// Listen for messages from the main app
self.addEventListener('message', (e) => {
  if (!e.data) return;

  if (e.data.type === 'SYNC_SCHEDULES') {
    cachedRoutines = e.data.routines || [];
    cachedTasks = e.data.tasks || [];
    console.log('[SW] Schedules synced into Service Worker background context:', cachedRoutines.length, 'routines,', cachedTasks.length, 'tasks');
  }

  if (e.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = e.data;
    self.registration.showNotification(title, {
      body: options.body || '',
      icon: options.icon || '/favicon.svg',
      badge: options.badge || '/favicon.svg',
      vibrate: options.vibrate || [200, 100, 200],
      tag: options.tag || 'duevault-sw-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      silent: false,
      data: options.data || {}
    });
  }
});

// Background Check Loop inside Service Worker context (runs even when main app window is closed)
function checkBackgroundNotifications() {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${currentHours}:${currentMinutes}`;
  const todayStr = now.toLocaleDateString('en-CA');

  // Check cached routine timetable blocks
  cachedRoutines.forEach(rt => {
    if (rt.start) {
      const startDate = new Date(rt.start);
      if (!isNaN(startDate.getTime())) {
        const rtHours = String(startDate.getHours()).padStart(2, '0');
        const rtMinutes = String(startDate.getMinutes()).padStart(2, '0');
        const rtTimeStr = `${rtHours}:${rtMinutes}`;
        const key = `sw-rt-${rt.id}-${todayStr}-${rtTimeStr}`;
        if (rtTimeStr === timeStr && !notifiedKeys.has(key)) {
          notifiedKeys.add(key);
          self.registration.showNotification(`🟢 Block Starting: ${rt.title}`, {
            body: `Your timetable block "${rt.title}" is starting now at ${rtTimeStr}.`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [200, 100, 200, 100, 200],
            tag: key,
            renotify: true,
            requireInteraction: true,
            silent: false
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
        const keyEnd = `sw-rt-end-${rt.id}-${todayStr}-${rtEndTimeStr}`;
        if (rtEndTimeStr === timeStr && !notifiedKeys.has(keyEnd)) {
          notifiedKeys.add(keyEnd);
          self.registration.showNotification(`🔴 Block Ended: ${rt.title}`, {
            body: `Your timetable block "${rt.title}" has ended at ${rtEndTimeStr}.`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [100, 50, 100],
            tag: keyEnd,
            renotify: true,
            silent: false
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
        const key = `sw-task-${task.id}-${todayStr}-${tTimeStr}`;
        if (tTimeStr === timeStr && !notifiedKeys.has(key)) {
          notifiedKeys.add(key);
          self.registration.showNotification(`🟢 Task Starting: ${task.title}`, {
            body: `Your task "${task.title}" is starting now at ${tTimeStr}.`,
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            vibrate: [200, 100, 200],
            tag: key,
            renotify: true,
            requireInteraction: true,
            silent: false
          });
        }
      }
    }
  });
}

// Check every 10 seconds in the background
setInterval(checkBackgroundNotifications, 10000);

// Notification click behavior
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
