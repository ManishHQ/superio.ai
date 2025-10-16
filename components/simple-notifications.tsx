'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { 
  sendSimpleNotification,
  sendServiceWorkerNotification,
  requestNotificationPermission
} from '../utils/notifications';

export function SimpleNotifications() {
  const [message, setMessage] = useState('Hello from PWA!');
  const [hasPermission, setHasPermission] = useState(false);

  async function handleRequestPermission() {
    const permission = await requestNotificationPermission();
    setHasPermission(permission === 'granted');
    return permission === 'granted';
  }

  async function handleSendSimpleNotification() {
    const permitted = hasPermission || await handleRequestPermission();
    
    if (permitted) {
      const result = await sendSimpleNotification({
        title: 'PWA Test Notification',
        body: message,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        tag: 'pwa-test',
        requireInteraction: false,
      });
      
      if (result.success) {
        alert('Notification sent!');
      } else {
        alert(`Failed to send notification: ${result.error}`);
      }
    } else {
      alert('Notification permission denied');
    }
  }

  async function handleSendServiceWorkerNotification() {
    const result = await sendServiceWorkerNotification({
      title: 'Service Worker Notification',
      body: message,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: 'sw-test',
    });
    
    if (result.success) {
      alert('Service Worker notification sent!');
    } else {
      alert(`Failed to send SW notification: ${result.error}`);
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 border-2 border-border rounded-lg bg-card w-full">
      <h3 className="text-lg sm:text-xl font-semibold text-foreground">Simple Notification Test</h3>

      <div className="space-y-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter notification message"
          className="w-full p-2 border border-border rounded text-sm sm:text-base bg-background text-foreground"
        />

        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <Button onClick={handleSendSimpleNotification} className="w-full sm:w-auto">
            Send Browser Notification
          </Button>

          <Button onClick={handleSendServiceWorkerNotification} className="w-full sm:w-auto">
            Send SW Notification
          </Button>

          <Button
            onClick={handleRequestPermission}
            className="w-full sm:w-auto"
          >
            Request Permission
          </Button>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground">
          Status: {hasPermission ? '✅ Permission granted' : '❌ Need permission'}
        </p>
      </div>
    </div>
  );
}