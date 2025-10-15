'use client';

import { useState } from 'react';
import { Button } from './ui/button';

export function SimpleNotifications() {
  const [message, setMessage] = useState('Hello from PWA!');
  const [hasPermission, setHasPermission] = useState(false);

  async function requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  }

  async function sendSimpleNotification() {
    const permitted = hasPermission || await requestPermission();
    
    if (permitted) {
      new Notification('PWA Test Notification', {
        body: message,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        tag: 'pwa-test',
        requireInteraction: false,
      });
      alert('Notification sent!');
    } else {
      alert('Notification permission denied');
    }
  }

  async function sendServiceWorkerNotification() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification('Service Worker Notification', {
        body: message,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        tag: 'sw-test',
      });
      alert('Service Worker notification sent!');
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6 border rounded-lg bg-blue-50 w-full">
      <h3 className="text-lg sm:text-xl font-semibold">Simple Notification Test</h3>
      
      <div className="space-y-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter notification message"
          className="w-full p-2 border rounded text-sm sm:text-base"
        />
        
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <Button onClick={sendSimpleNotification} className="w-full sm:w-auto">
            Send Browser Notification
          </Button>
          
          <Button onClick={sendServiceWorkerNotification} variant="outline" className="w-full sm:w-auto">
            Send SW Notification
          </Button>
          
          <Button 
            onClick={requestPermission} 
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            Request Permission
          </Button>
        </div>
        
        <p className="text-xs sm:text-sm text-gray-600">
          Status: {hasPermission ? '✅ Permission granted' : '❌ Need permission'}
        </p>
      </div>
    </div>
  );
}