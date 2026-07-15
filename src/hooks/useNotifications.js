import { useEffect, useState, useCallback } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const askPermission = useCallback(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(p => {
        setPermission(p);
      });
    }
  }, []);

  const sendNotification = useCallback((title, body) => {
    // 1. Dispatch in-app toast event (fallback and enhancement)
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, body } }));

    // 2. Send native browser notification if allowed
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        // Use service worker notification first (reliable on mobile and background)
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              body,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              vibrate: [200, 100, 200],
              tag: 'duevault-notification'
            });
          }).catch((err) => {
            console.warn('Service worker not ready, falling back to window Notification:', err);
            new Notification(title, { body, icon: '/favicon.svg' });
          });
        } else {
          new Notification(title, { body, icon: '/favicon.svg' });
        }
      } catch (e) {
        console.error('Failed to send native notification', e);
      }
    }
  }, []);

  return { sendNotification, permission, askPermission };
};
