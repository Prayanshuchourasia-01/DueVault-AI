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

/**
 * Send a notification through the Service Worker (works on mobile phones).
 * Falls back to window Notification if SW is unavailable.
 */
const sendViaServiceWorker = async (title, options) => {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return true;
      }
    }
  } catch (e) {
    console.warn('Service Worker notification failed:', e);
  }
  return false;
};

export const useNotifications = () => {
  const [permission, setPermission] = useState(() => ('Notification' in window ? Notification.permission : 'denied'));

  const checkPermission = useCallback(() => {
    if ('Notification' in window) {
      const current = Notification.permission;
      setPermission(current);

      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'notifications' })
          .then(status => {
            setPermission(status.state === 'granted' ? 'granted' : (status.state === 'denied' ? 'denied' : 'default'));
            status.onchange = () => {
              setPermission(status.state === 'granted' ? 'granted' : (status.state === 'denied' ? 'denied' : 'default'));
            };
          })
          .catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    checkPermission();

    const handleFocus = () => checkPermission();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [checkPermission]);

  const sendNotification = useCallback((title, body) => {
    console.log(`[DueVault Notification] ${title}: ${body}`);

    // 1. Play pleasant notification chime (works when tab is active)
    playNotificationChime();

    // 2. Dispatch in-app toast event (always visible in UI)
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, body } }));

    // 3. Native System/Phone Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notificationOptions = {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'duevault-' + Date.now(),
        renotify: true,
        requireInteraction: true, // Keep notification visible until user taps it
        silent: false
      };

      // ALWAYS try Service Worker first (required for mobile phones)
      sendViaServiceWorker(title, notificationOptions).then(success => {
        if (!success) {
          // Fallback: Direct window notification (works on desktop browsers)
          try {
            new Notification(title, notificationOptions);
          } catch (err) {
            console.warn('All notification methods failed:', err);
          }
        }
      });
    } else {
      console.warn('[DueVault] Notification permission not granted. Current:', 
        'Notification' in window ? Notification.permission : 'API not available');
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
