'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { 
  isPushNotificationSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentPushSubscription,
  sendPushNotification
} from '../utils/notifications';
import { 
  setReminder,
  cancelAllReminders,
  subscribeToReminders,
  getActiveReminders,
  type Reminder
} from '../utils/reminders';

export function PushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState('Hello from your PWA!');
  const [reminderMessage, setReminderMessage] = useState('Reminder: Time to check your PWA!');
  const [reminderSeconds, setReminderSeconds] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const initialize = async () => {
      setIsSupported(isPushNotificationSupported());
      
      if (isPushNotificationSupported()) {
        const currentSub = await getCurrentPushSubscription();
        setSubscription(currentSub);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    // Initialize with current reminders
    setActiveReminders(getActiveReminders());

    // Subscribe to reminder updates
    const unsubscribe = subscribeToReminders((updatedReminders) => {
      setActiveReminders(updatedReminders);
    });

    return unsubscribe;
  }, []);


  async function subscribeToPush() {
    try {
      setIsLoading(true);
      
      const result = await subscribeToPushNotifications();
      if (result.success) {
        setSubscription(result.subscription || null);
        alert('Successfully subscribed to push notifications!');
      } else {
        alert(`Subscription failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Push subscription failed:', error);
      alert('Push subscription failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribeFromPush() {
    try {
      setIsLoading(true);
      
      const result = await unsubscribeFromPushNotifications();
      if (result.success) {
        setSubscription(null);
        alert('Successfully unsubscribed from push notifications!');
      } else {
        alert(`Unsubscription failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      alert('Push unsubscription failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function sendTestNotification() {
    try {
      setIsLoading(true);
      
      const result = await sendPushNotification(message, 'PWA Test Notification');
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

  async function setScheduledReminder() {
    try {
      setIsLoading(true);
      
      const result = setReminder({
        message: reminderMessage,
        delaySeconds: reminderSeconds,
        title: 'PWA Reminder'
      });
      
      if (result.success) {
        alert(`Reminder set for ${reminderSeconds} seconds!`);
      } else {
        alert(`Failed to set reminder: ${result.error}`);
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      alert('Failed to set reminder');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancelAllReminders() {
    const cancelledCount = cancelAllReminders();
    alert(`Cancelled ${cancelledCount} reminders`);
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
    <div className="space-y-4 p-4 sm:p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 w-full">
      <h3 className="text-lg sm:text-xl font-semibold text-blue-900">Push Notifications</h3>
      
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

            <div className="space-y-2 pt-2 border-t">
              <label className="text-sm font-medium text-blue-800">
                Reminder Notification:
              </label>
              <input
                type="text"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Enter your reminder message"
                className="w-full p-2 border rounded text-sm"
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <label className="text-xs text-blue-700 shrink-0">Delay (seconds):</label>
                <input
                  type="number"
                  value={reminderSeconds}
                  onChange={(e) => setReminderSeconds(Number(e.target.value))}
                  min="1"
                  max="3600"
                  className="w-full sm:w-20 p-1 border rounded text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={setScheduledReminder}
                  disabled={isLoading || !reminderMessage.trim() || reminderSeconds < 1}
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isLoading ? 'Setting...' : `Set Reminder (${reminderSeconds}s)`}
                </Button>
                {activeReminders.length > 0 && (
                  <Button 
                    onClick={handleCancelAllReminders}
                    disabled={isLoading}
                    size="sm"
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    Cancel ({activeReminders.length})
                  </Button>
                )}
              </div>
              {activeReminders.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-green-700 font-semibold">
                    ⏰ {activeReminders.length} reminder(s) active
                  </p>
                  {activeReminders.slice(0, 3).map((reminder) => (
                    <p key={reminder.id} className="text-xs text-gray-600">
                      📅 {reminder.message} - {reminder.scheduledFor.toLocaleTimeString()}
                    </p>
                  ))}
                  {activeReminders.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{activeReminders.length - 3} more...
                    </p>
                  )}
                </div>
              )}
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