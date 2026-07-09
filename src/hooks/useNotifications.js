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
      Notification.requestPermission().then(p => setPermission(p));
    }
  }, []);

  const sendNotification = (title, body) => {
    // 1. Dispatch in-app toast event (fallback and enhancement)
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, body } }));

    // 2. Send native browser notification if allowed
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/vite.svg' });
      } catch (e) {
        console.error('Failed to send native notification', e);
      }
    }
  };

  return { sendNotification, permission, askPermission };
};
