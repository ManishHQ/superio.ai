// Example usage of the modular notification utilities

import { useState, useEffect } from 'react';
import { 
  // Push notifications
  isPushNotificationSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendPushNotification,
  getCurrentPushSubscription,
  // Simple notifications
  sendSimpleNotification,
  sendServiceWorkerNotification,
  requestNotificationPermission,
  type PWANotificationOptions
} from '../utils/notifications';
import {
  // Reminders
  setReminder,
  setQuickReminder,
  setTimedReminder,
  setHourlyReminder,
  cancelReminder,
  cancelAllReminders,
  getActiveReminders,
  getRemindersCount,
  subscribeToReminders,
  type Reminder
} from '../utils/reminders';

// Example 1: Simple notification with minimal code
export function QuickNotificationExample() {
  const sendQuickNotif = async () => {
    const result = await sendSimpleNotification({
      title: 'Hello!',
      body: 'This is a quick notification'
    });
    
    if (!result.success) {
      console.error('Failed:', result.error);
    }
  };

  return (
    <button onClick={sendQuickNotif}>
      Send Quick Notification
    </button>
  );
}

// Example 2: Push notification with subscription management
export function PushNotificationExample() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      const subscription = await getCurrentPushSubscription();
      setIsSubscribed(!!subscription);
    };
    
    if (isPushNotificationSupported()) {
      checkSubscription();
    }
  }, []);

  const handleSubscribe = async () => {
    const result = await subscribeToPushNotifications();
    if (result.success) {
      setIsSubscribed(true);
      alert('Successfully subscribed!');
    }
  };

  const handleSendNotification = async () => {
    const result = await sendPushNotification('Test message from utility!');
    if (!result.success) {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-4">
      {!isSubscribed ? (
        <button onClick={handleSubscribe}>
          Subscribe to Push Notifications
        </button>
      ) : (
        <div className="space-y-2">
          <p>✅ Subscribed to push notifications</p>
          <button onClick={handleSendNotification}>
            Send Test Notification
          </button>
        </div>
      )}
    </div>
  );
}

// Example 3: Reminder system usage
export function ReminderExample() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    // Get initial reminders
    setReminders(getActiveReminders());
    
    // Subscribe to reminder updates
    const unsubscribe = subscribeToReminders((updatedReminders) => {
      setReminders(updatedReminders);
    });

    return unsubscribe;
  }, []);

  const setQuickBreakReminder = () => {
    const result = setQuickReminder('Take a 5-minute break!', 10);
    if (!result.success) {
      alert(result.error);
    }
  };

  const setMeetingReminder = () => {
    const result = setTimedReminder('Meeting starts in 5 minutes', 5);
    if (!result.success) {
      alert(result.error);
    }
  };

  const setWorkReminder = () => {
    const result = setHourlyReminder('Time to review your tasks', 1);
    if (!result.success) {
      alert(result.error);
    }
  };

  const clearAll = () => {
    const count = cancelAllReminders();
    alert(`Cancelled ${count} reminders`);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3>Quick Reminders</h3>
        <div className="flex gap-2">
          <button onClick={setQuickBreakReminder}>
            Break Reminder (10s)
          </button>
          <button onClick={setMeetingReminder}>
            Meeting Reminder (5min)
          </button>
          <button onClick={setWorkReminder}>
            Work Review (1hr)
          </button>
        </div>
      </div>

      {reminders.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4>Active Reminders ({reminders.length})</h4>
            <button onClick={clearAll} className="text-red-500">
              Clear All
            </button>
          </div>
          <ul className="space-y-1">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="text-sm">
                📅 {reminder.message} - {reminder.scheduledFor.toLocaleTimeString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Example 4: Custom hook for notifications
export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const supported = isPushNotificationSupported();
      setIsSupported(supported);
      
      if (supported) {
        const subscription = await getCurrentPushSubscription();
        setIsSubscribed(!!subscription);
      }
    };

    initialize();
  }, []);

  const subscribe = async () => {
    setLoading(true);
    const result = await subscribeToPushNotifications();
    
    if (result.success) {
      setIsSubscribed(true);
    }
    
    setLoading(false);
    return result;
  };

  const unsubscribe = async () => {
    setLoading(true);
    const result = await unsubscribeFromPushNotifications();
    
    if (result.success) {
      setIsSubscribed(false);
    }
    
    setLoading(false);
    return result;
  };

  const sendNotification = async (message: string, title?: string) => {
    return await sendPushNotification(message, title);
  };

  const sendSimple = async (title: string, body: string) => {
    return await sendSimpleNotification({ title, body });
  };

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    sendNotification,
    sendSimple
  };
}

// Example 5: Complete notification center component
export function NotificationCenter() {
  const { 
    isSupported, 
    isSubscribed, 
    subscribe, 
    unsubscribe, 
    sendNotification 
  } = useNotifications();
  
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    setReminders(getActiveReminders());
    return subscribeToReminders(setReminders);
  }, []);

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-100 rounded">
        ⚠️ Notifications not supported in this browser
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">Notification Center</h2>
      
      {/* Push Notification Status */}
      <div className="flex items-center justify-between p-4 border rounded">
        <div>
          <h3 className="font-semibold">Push Notifications</h3>
          <p className="text-sm text-gray-600">
            {isSubscribed ? 'Active' : 'Not active'} - Cross-device notifications
          </p>
        </div>
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          className={`px-4 py-2 rounded ${
            isSubscribed ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
          }`}
        >
          {isSubscribed ? 'Disable' : 'Enable'}
        </button>
      </div>

      {/* Quick Actions */}
      {isSubscribed && (
        <div className="space-y-3">
          <h3 className="font-semibold">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => sendNotification('Test notification!')}
              className="p-2 bg-green-500 text-white rounded text-sm"
            >
              Test Notification
            </button>
            <button
              onClick={() => setQuickReminder('Break time!', 30)}
              className="p-2 bg-yellow-500 text-white rounded text-sm"
            >
              30s Reminder
            </button>
            <button
              onClick={() => setTimedReminder('Check tasks', 5)}
              className="p-2 bg-blue-500 text-white rounded text-sm"
            >
              5min Reminder
            </button>
            <button
              onClick={() => setHourlyReminder('Hourly check', 1)}
              className="p-2 bg-purple-500 text-white rounded text-sm"
            >
              1hr Reminder
            </button>
          </div>
        </div>
      )}

      {/* Active Reminders */}
      {reminders.length > 0 && (
        <div className="p-4 bg-gray-50 rounded">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Active Reminders ({reminders.length})</h3>
            <button
              onClick={cancelAllReminders}
              className="text-red-500 text-sm hover:underline"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-1">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex justify-between items-center text-sm">
                <span>📅 {reminder.message}</span>
                <span className="text-gray-500">
                  {reminder.scheduledFor.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}