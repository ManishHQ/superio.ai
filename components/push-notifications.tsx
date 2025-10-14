'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { subscribeUser, unsubscribeUser, sendNotification } from '../app/actions';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState('Hello from your PWA!');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  async function subscribeToPush() {
    try {
      setIsLoading(true);
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Permission not granted for notifications');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      setSubscription(sub);
      
      // Send subscription to server
      const result = await subscribeUser(sub);
      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('Successfully subscribed to push notifications');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      alert('Failed to subscribe to push notifications');
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    try {
      setIsLoading(true);

      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribeUser(subscription);
        setSubscription(null);
        console.log('Successfully unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      alert('Failed to unsubscribe from push notifications');
    } finally {
      setIsLoading(false);
    }
  }

  async function sendTestNotification() {
    try {
      setIsLoading(true);
      
      const result = await sendNotification(message);
      if (result.success) {
        alert('Notification sent successfully!');
        setMessage('');
      } else {
        alert(`Failed to send notification: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
        <p className="text-yellow-800">
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <h3 className="text-lg font-semibold text-blue-900">Push Notifications</h3>
      
      <div className="space-y-3">
        {subscription ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-green-700 font-medium">
                ✅ Subscribed to push notifications
              </p>
            </div>
            
            <Button 
              onClick={unsubscribeFromPush} 
              variant="outline" 
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
            </Button>

            <div className="space-y-2 pt-2 border-t">
              <label className="text-sm font-medium text-blue-800">
                Test Notification Message:
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your notification message"
                className="w-full p-2 border rounded text-sm"
              />
              <Button 
                onClick={sendTestNotification}
                disabled={isLoading || !message.trim()}
                size="sm"
              >
                {isLoading ? 'Sending...' : 'Send Test Notification'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-blue-700">
              Subscribe to receive push notifications from this PWA
            </p>
            <Button 
              onClick={subscribeToPush}
              disabled={isLoading}
            >
              {isLoading ? 'Subscribing...' : 'Subscribe to Push Notifications'}
            </Button>
          </>
        )}
      </div>

      <div className="text-xs text-blue-600 space-y-1">
        <p>💡 <strong>Tips for testing:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Deploy to Vercel for HTTPS (required for push notifications)</li>
          <li>Allow notifications when prompted by browser</li>
          <li>Test on different devices and browsers</li>
          <li>Notifications work even when PWA is closed</li>
        </ul>
      </div>
    </div>
  );
}