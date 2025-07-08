import { useEffect } from 'react';

export const useNotifications = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const playSound = () => {
      const audio = new Audio('/hooks/notifications.mp3');
      audio.play().catch(() => {});
    };

    // Listen for custom events
    const handleNotificationEvent = (event: CustomEvent) => {
      playSound();

      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(event.detail.message);
      }
    };

    // Add event listener for custom notification events
    window.addEventListener('notification', handleNotificationEvent as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('notification', handleNotificationEvent as EventListener);
    };
  }, [enabled]);
};