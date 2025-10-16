# Notification System Documentation

A comprehensive notification system for PWA applications with push notifications, simple browser notifications, and service worker notifications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Push Notifications](#push-notifications)
- [Simple Browser Notifications](#simple-browser-notifications)
- [Service Worker Notifications](#service-worker-notifications)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Installation & Setup

### 1. Import the utilities

```typescript
import {
  isPushNotificationSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendPushNotification,
  sendSimpleNotification,
  sendServiceWorkerNotification,
  requestNotificationPermission
} from '@/utils/notifications';
```

### 2. Environment Variables

Ensure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your@email.com
```

## Push Notifications

### Subscribe to Push Notifications

```typescript
async function handleSubscribe() {
  const result = await subscribeToPushNotifications();
  
  if (result.success) {
    console.log('Successfully subscribed to push notifications');
    console.log('Subscription:', result.subscription);
  } else {
    console.error('Failed to subscribe:', result.error);
  }
}
```

### Send Push Notification

```typescript
async function sendNotification() {
  const result = await sendPushNotification(
    'Hello from your PWA!',
    'PWA Notification'
  );
  
  if (result.success) {
    console.log('Notification sent successfully');
  } else {
    console.error('Failed to send notification:', result.error);
  }
}
```

### Unsubscribe from Push Notifications

```typescript
async function handleUnsubscribe() {
  const result = await unsubscribeFromPushNotifications();
  
  if (result.success) {
    console.log('Successfully unsubscribed');
  } else {
    console.error('Failed to unsubscribe:', result.error);
  }
}
```

### Check Support and Subscription Status

```typescript
// Check if push notifications are supported
const isSupported = isPushNotificationSupported();

// Get current subscription
import { getCurrentPushSubscription } from '@/utils/notifications';
const subscription = await getCurrentPushSubscription();
```

## Simple Browser Notifications

### Basic Notification

```typescript
async function showSimpleNotification() {
  const result = await sendSimpleNotification({
    title: 'Hello!',
    body: 'This is a simple browser notification',
    icon: '/icons/icon-192.svg',
    tag: 'simple-notification'
  });
  
  if (result.success) {
    console.log('Simple notification sent');
  }
}
```

### Advanced Options

```typescript
await sendSimpleNotification({
  title: 'Advanced Notification',
  body: 'This notification has more options',
  icon: '/icons/custom-icon.png',
  badge: '/icons/badge.png',
  tag: 'advanced-notification',
  requireInteraction: true,
  vibrate: [200, 100, 200],
  data: { 
    url: '/specific-page',
    userId: '123' 
  }
});
```

## Service Worker Notifications

### Basic Service Worker Notification

```typescript
async function showSWNotification() {
  const result = await sendServiceWorkerNotification({
    title: 'Service Worker Notification',
    body: 'This notification is handled by the service worker',
    icon: '/icons/icon-192.svg',
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Close' }
    ]
  });
}
```

## API Reference

### Types

```typescript
interface PWANotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

interface PushSubscriptionResult {
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}

interface NotificationResult {
  success: boolean;
  error?: string;
}
```

### Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `isPushNotificationSupported()` | Check if push notifications are supported | `boolean` |
| `subscribeToPushNotifications()` | Subscribe to push notifications | `Promise<PushSubscriptionResult>` |
| `unsubscribeFromPushNotifications()` | Unsubscribe from push notifications | `Promise<NotificationResult>` |
| `sendPushNotification(message, title?)` | Send push notification to all subscribers | `Promise<NotificationResult>` |
| `sendSimpleNotification(options)` | Send simple browser notification | `Promise<NotificationResult>` |
| `sendServiceWorkerNotification(options)` | Send service worker notification | `Promise<NotificationResult>` |
| `requestNotificationPermission()` | Request notification permission | `Promise<NotificationPermission>` |
| `getCurrentPushSubscription()` | Get current push subscription | `Promise<PushSubscription \| null>` |

## Error Handling

All notification functions return result objects with `success` and optional `error` fields:

```typescript
const result = await sendPushNotification('Test message');

if (!result.success) {
  switch (result.error) {
    case 'Push notifications not supported':
      // Handle unsupported browser
      break;
    case 'Notification permission denied':
      // Handle permission denial
      break;
    case 'VAPID public key not configured':
      // Handle configuration error
      break;
    default:
      // Handle other errors
      console.error('Notification error:', result.error);
  }
}
```

## Best Practices

### 1. Always Check Support

```typescript
if (isPushNotificationSupported()) {
  // Proceed with push notification setup
} else {
  // Fallback to simple notifications or inform user
}
```

### 2. Handle Permissions Gracefully

```typescript
const permission = await requestNotificationPermission();

switch (permission) {
  case 'granted':
    // Proceed with notifications
    break;
  case 'denied':
    // Inform user about enabling notifications in settings
    break;
  case 'default':
    // User dismissed prompt, try again later
    break;
}
```

### 3. Provide User Control

```typescript
// Always provide unsubscribe option
<button onClick={handleUnsubscribe}>
  Stop Notifications
</button>
```

### 4. Use Appropriate Notification Types

- **Push Notifications**: For cross-device, persistent notifications
- **Simple Notifications**: For immediate, local notifications
- **Service Worker Notifications**: For enhanced notification features

### 5. Optimize for Mobile

```typescript
// Use appropriate vibration patterns
vibrate: [100, 50, 100] // Short, pause, short

// Keep titles and messages concise
title: 'New Message'  // Good
title: 'You have received a new message from...'  // Too long
```

### 6. Test Across Browsers

Different browsers have varying support for notification features. Test your implementation on:

- Chrome (Desktop & Mobile)
- Firefox
- Safari (limited push notification support)
- Brave (requires additional setup)

## Usage Examples

### Complete Push Notification Setup

```typescript
import { useState, useEffect } from 'react';
import { 
  isPushNotificationSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentPushSubscription,
  sendPushNotification
} from '@/utils/notifications';

export function NotificationComponent() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      setIsSupported(isPushNotificationSupported());
      const currentSub = await getCurrentPushSubscription();
      setSubscription(currentSub);
    };
    
    checkSupport();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    const result = await subscribeToPushNotifications();
    
    if (result.success) {
      setSubscription(result.subscription || null);
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    const result = await unsubscribeFromPushNotifications();
    
    if (result.success) {
      setSubscription(null);
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  const handleSendTest = async () => {
    const result = await sendPushNotification('Test notification!');
    if (!result.success) {
      alert(result.error);
    }
  };

  if (!isSupported) {
    return <div>Push notifications not supported</div>;
  }

  return (
    <div>
      {subscription ? (
        <div>
          <p>✅ Subscribed to notifications</p>
          <button onClick={handleUnsubscribe} disabled={loading}>
            Unsubscribe
          </button>
          <button onClick={handleSendTest}>
            Send Test Notification
          </button>
        </div>
      ) : (
        <div>
          <p>❌ Not subscribed</p>
          <button onClick={handleSubscribe} disabled={loading}>
            Subscribe to Notifications
          </button>
        </div>
      )}
    </div>
  );
}
```