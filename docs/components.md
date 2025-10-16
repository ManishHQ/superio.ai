# Component Documentation

Documentation for the notification and reminder React components included in this PWA.

## Table of Contents

- [PushNotifications Component](#pushnotifications-component)
- [SimpleNotifications Component](#simplenotifications-component)
- [WalletInfo Component](#walletinfo-component)
- [Custom Hooks](#custom-hooks)
- [Usage Examples](#usage-examples)

## PushNotifications Component

A comprehensive component for managing push notifications with reminder functionality.

### Features

- ✅ Push notification subscription management
- ✅ Cross-device notification testing
- ✅ Scheduled reminder notifications
- ✅ Real-time subscription status
- ✅ Debug information display
- ✅ Fully responsive design

### Props

The component doesn't accept props and manages its own state internally.

### Usage

```typescript
import { PushNotifications } from '@/components/push-notifications';

export function App() {
  return (
    <div>
      <PushNotifications />
    </div>
  );
}
```

### Features Breakdown

#### Subscription Management
- Subscribe/unsubscribe to push notifications
- Automatic service worker registration
- VAPID key handling
- Error handling and user feedback

#### Test Notifications
- Send immediate test notifications to all devices
- Custom message input
- Real-time feedback

#### Scheduled Reminders
- Set custom reminder messages
- Configurable delay (1 second to 1 hour)
- Multiple active reminders support
- Cancel individual or all reminders
- Visual indicator of active reminders

#### Debug Information
- Subscription count display
- Active device endpoints
- Tips for testing and troubleshooting

### Internal State

```typescript
const [isSupported, setIsSupported] = useState(false);
const [subscription, setSubscription] = useState<PushSubscription | null>(null);
const [message, setMessage] = useState('Hello from your PWA!');
const [reminderMessage, setReminderMessage] = useState('Reminder: Time to check your PWA!');
const [reminderSeconds, setReminderSeconds] = useState(10);
const [isLoading, setIsLoading] = useState(false);
const [activeReminders, setActiveReminders] = useState<number[]>([]);
```

## SimpleNotifications Component

A component for testing simple browser notifications and service worker notifications.

### Features

- ✅ Simple browser notifications
- ✅ Service worker notifications
- ✅ Permission management
- ✅ Status indicator

### Usage

```typescript
import { SimpleNotifications } from '@/components/simple-notifications';

export function App() {
  return (
    <div>
      <SimpleNotifications />
    </div>
  );
}
```

### Features Breakdown

#### Browser Notifications
- Direct browser notification API usage
- Custom message input
- Permission request handling

#### Service Worker Notifications
- Service worker-based notifications
- Enhanced notification features
- Persistent notifications

#### Permission Management
- Request notification permissions
- Display permission status
- Handle permission states

## WalletInfo Component

A responsive component for Web3 wallet connection and information display.

### Features

- ✅ Wallet connection status
- ✅ Address display with overflow protection
- ✅ ENS name support
- ✅ Balance and network information
- ✅ Mobile-friendly design
- ✅ Dark mode support

### Usage

```typescript
import { WalletInfo } from '@/components/wallet-info';

export function App() {
  return (
    <div>
      <WalletInfo />
    </div>
  );
}
```

### Responsive Design Features

- Responsive grid layouts
- Mobile-first approach
- Flexible typography
- Overflow protection for long addresses
- Touch-friendly interface

## Custom Hooks

### useNotifications Hook

Create a custom hook to manage notifications across your application:

```typescript
import { useState, useEffect } from 'react';
import { 
  isPushNotificationSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentPushSubscription,
  sendPushNotification
} from '@/utils/notifications';

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setIsSupported(isPushNotificationSupported());
      const currentSub = await getCurrentPushSubscription();
      setSubscription(currentSub);
    };
    
    initialize();
  }, []);

  const subscribe = async () => {
    setLoading(true);
    const result = await subscribeToPushNotifications();
    
    if (result.success) {
      setSubscription(result.subscription || null);
    }
    
    setLoading(false);
    return result;
  };

  const unsubscribe = async () => {
    setLoading(true);
    const result = await unsubscribeFromPushNotifications();
    
    if (result.success) {
      setSubscription(null);
    }
    
    setLoading(false);
    return result;
  };

  const sendNotification = async (message: string, title?: string) => {
    return await sendPushNotification(message, title);
  };

  return {
    isSupported,
    subscription,
    loading,
    isSubscribed: !!subscription,
    subscribe,
    unsubscribe,
    sendNotification
  };
}
```

### useReminders Hook

Custom hook for reminder management:

```typescript
import { useState, useEffect } from 'react';
import { 
  setReminder, 
  cancelReminder,
  cancelAllReminders, 
  subscribeToReminders,
  getActiveReminders,
  type Reminder 
} from '@/utils/reminders';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    setReminders(getActiveReminders());
    
    const unsubscribe = subscribeToReminders((updatedReminders) => {
      setReminders(updatedReminders);
    });

    return unsubscribe;
  }, []);

  const addReminder = (message: string, delaySeconds: number, title?: string) => {
    return setReminder({ message, delaySeconds, title });
  };

  const removeReminder = (id: string) => {
    return cancelReminder(id);
  };

  const clearAllReminders = () => {
    return cancelAllReminders();
  };

  return {
    reminders,
    addReminder,
    removeReminder,
    clearAllReminders,
    count: reminders.length,
    hasReminders: reminders.length > 0
  };
}
```

## Usage Examples

### Basic Integration

```typescript
import { PushNotifications } from '@/components/push-notifications';
import { SimpleNotifications } from '@/components/simple-notifications';
import { WalletInfo } from '@/components/wallet-info';

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <WalletInfo />
      <PushNotifications />
      <SimpleNotifications />
    </div>
  );
}
```

### Custom Notification Component

```typescript
import { useNotifications } from '@/hooks/useNotifications';
import { useReminders } from '@/hooks/useReminders';

export function CustomNotificationCenter() {
  const { isSupported, isSubscribed, subscribe, unsubscribe, sendNotification } = useNotifications();
  const { reminders, addReminder, clearAllReminders, count } = useReminders();

  if (!isSupported) {
    return <div>Notifications not supported in this browser</div>;
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">Notification Center</h2>
      
      {/* Subscription Status */}
      <div className="flex items-center gap-4">
        <span className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{isSubscribed ? 'Subscribed' : 'Not subscribed'}</span>
        
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>
      </div>

      {/* Quick Actions */}
      {isSubscribed && (
        <div className="space-y-4">
          <button
            onClick={() => sendNotification('Test notification!')}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Send Test Notification
          </button>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Quick Reminders</h3>
            <div className="flex gap-2">
              <button
                onClick={() => addReminder('Take a break!', 30)}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
              >
                30s Reminder
              </button>
              <button
                onClick={() => addReminder('Check your tasks', 300)}
                className="px-3 py-1 bg-orange-500 text-white rounded text-sm"
              >
                5min Reminder
              </button>
            </div>
          </div>

          {/* Active Reminders */}
          {count > 0 && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Active Reminders ({count})</span>
                <button
                  onClick={clearAllReminders}
                  className="text-red-500 text-sm hover:underline"
                >
                  Clear All
                </button>
              </div>
              <ul className="space-y-1">
                {reminders.map(reminder => (
                  <li key={reminder.id} className="text-sm">
                    🔔 {reminder.message} - {reminder.scheduledFor.toLocaleTimeString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Settings Page Integration

```typescript
export function SettingsPage() {
  const { isSubscribed, subscribe, unsubscribe } = useNotifications();
  const { clearAllReminders, count } = useReminders();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        
        <div className="flex items-center justify-between p-4 border rounded">
          <div>
            <h3 className="font-medium">Push Notifications</h3>
            <p className="text-sm text-gray-600">
              Receive notifications even when the app is closed
            </p>
          </div>
          <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            className={`px-4 py-2 rounded ${
              isSubscribed 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white'
            }`}
          >
            {isSubscribed ? 'Disable' : 'Enable'}
          </button>
        </div>

        {count > 0 && (
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <h3 className="font-medium">Active Reminders</h3>
              <p className="text-sm text-gray-600">
                You have {count} active reminder{count !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={clearAllReminders}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Styling Guidelines

### Responsive Classes Used

```css
/* Mobile-first responsive utilities */
.responsive-container {
  @apply w-full p-4 sm:p-6;
}

.responsive-text {
  @apply text-sm sm:text-base;
}

.responsive-button-group {
  @apply flex flex-col sm:flex-row gap-2;
}

.responsive-button {
  @apply w-full sm:w-auto px-4 py-2;
}

.responsive-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4;
}
```

### Theme Support

All components support dark mode through Tailwind's dark mode utilities:

```css
.theme-card {
  @apply bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700;
}

.theme-text {
  @apply text-gray-900 dark:text-white;
}

.theme-text-muted {
  @apply text-gray-600 dark:text-gray-400;
}
```