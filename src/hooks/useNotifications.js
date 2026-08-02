import { useEffect, useState, useCallback } from 'react';

const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Suppress audio autoplay errors
  }
};

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      // Auto-request permission if still default
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => {
          setPermission(p);
        });
      }
    }
  }, []);

  const sendNotification = useCallback((title, body) => {
    // 1. Play pleasant notification chime
    playNotificationChime();

    // 2. Dispatch in-app toast event (always visible in UI)
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, body } }));

    // 3. Native System/Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notificationOptions = {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        tag: 'duevault-note-' + Date.now(),
        renotify: true
      };

      // Direct Window Notification
      try {
        new Notification(title, notificationOptions);
      } catch (err) {
        console.warn('Native Window Notification constructor failed, trying Service Worker:', err);
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            if (reg && reg.showNotification) {
              reg.showNotification(title, notificationOptions);
            }
          }).catch(() => {});
        }
      }
    }
  }, []);

  const askPermission = useCallback(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(p => {
        setPermission(p);
        if (p === 'granted') {
          sendNotification("Notifications Enabled!", "You will now receive proactive alerts for tasks and timetable blocks.");
        }
      });
    }
  }, [sendNotification]);

  const testNotification = useCallback(() => {
    if (!('Notification' in window)) {
      alert("Notifications are not supported by this browser.");
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => {
        setPermission(p);
        if (p === 'granted') {
          sendNotification("DueVault Notifications Active", "Native system notifications are working correctly on your device!");
        } else {
          alert("Notification permission was denied. Please allow notifications in your browser site settings.");
        }
      });
    } else if (Notification.permission === 'granted') {
      sendNotification("DueVault Notifications Active", "Native system notifications are working correctly on your device!");
    } else {
      alert("Notification permission is currently blocked/denied in browser settings. Please click the lock icon next to the URL in your browser address bar to allow notifications.");
    }
  }, [sendNotification]);

  return { sendNotification, permission, askPermission, testNotification };
};

