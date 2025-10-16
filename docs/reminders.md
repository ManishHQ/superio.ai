# Reminder System Documentation

A comprehensive reminder system for scheduling notifications at specific times using the notification utilities.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Basic Usage](#basic-usage)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [React Integration](#react-integration)
- [Best Practices](#best-practices)

## Installation & Setup

### Import the utilities

```typescript
import {
  setReminder,
  cancelReminder,
  cancelAllReminders,
  getActiveReminders,
  getRemindersCount,
  subscribeToReminders,
  setQuickReminder,
  setTimedReminder,
  setHourlyReminder
} from '@/utils/reminders';
```

## Basic Usage

### Set a Simple Reminder

```typescript
// Remind in 10 seconds
const result = setReminder({
  message: 'Time to take a break!',
  delaySeconds: 10,
  title: 'Break Reminder'
});

if (result.success) {
  console.log('Reminder set:', result.reminder);
} else {
  console.error('Failed to set reminder:', result.error);
}
```

### Quick Convenience Functions

```typescript
// Quick reminder (10 seconds)
setQuickReminder('Check your email', 10);

// Timed reminder (5 minutes)
setTimedReminder('Meeting starts soon', 5);

// Hourly reminder (2 hours)
setHourlyReminder('Drink water', 2);
```

### Cancel Reminders

```typescript
// Cancel specific reminder
const cancelled = cancelReminder('reminder_id');

// Cancel all reminders
const cancelledCount = cancelAllReminders();
console.log(`Cancelled ${cancelledCount} reminders`);
```

## Advanced Features

### Get Active Reminders

```typescript
const activeReminders = getActiveReminders();
console.log('Active reminders:', activeReminders);

// Get count only
const count = getRemindersCount();
console.log(`${count} reminders active`);
```

### Subscribe to Reminder Updates

```typescript
const unsubscribe = subscribeToReminders((reminders) => {
  console.log('Reminders updated:', reminders);
  // Update UI with new reminder list
});

// Later, unsubscribe
unsubscribe();
```

### Check Reminder Status

```typescript
import { getReminder, hasReminder, getTimeRemaining } from '@/utils/reminders';

// Check if reminder exists
if (hasReminder('reminder_id')) {
  // Get reminder details
  const reminder = getReminder('reminder_id');
  
  // Get remaining time in seconds
  const remaining = getTimeRemaining('reminder_id');
  console.log(`${remaining} seconds remaining`);
}
```

## API Reference

### Types

```typescript
interface Reminder {
  id: string;
  message: string;
  title?: string;
  delaySeconds: number;
  createdAt: Date;
  scheduledFor: Date;
  timerId: number;
}

interface ReminderOptions {
  message: string;
  delaySeconds: number;
  title?: string;
}

interface ReminderResult {
  success: boolean;
  reminder?: Reminder;
  error?: string;
}
```

### Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `setReminder(options)` | Set a new reminder | `ReminderResult` |
| `cancelReminder(id)` | Cancel specific reminder | `boolean` |
| `cancelAllReminders()` | Cancel all active reminders | `number` (count cancelled) |
| `getActiveReminders()` | Get all active reminders | `Reminder[]` |
| `getRemindersCount()` | Get count of active reminders | `number` |
| `getReminder(id)` | Get specific reminder by ID | `Reminder \| undefined` |
| `hasReminder(id)` | Check if reminder exists | `boolean` |
| `getTimeRemaining(id)` | Get remaining seconds for reminder | `number \| null` |
| `subscribeToReminders(callback)` | Subscribe to reminder updates | `() => void` (unsubscribe function) |

### Convenience Functions

| Function | Description | Example |
|----------|-------------|---------|
| `setQuickReminder(message, seconds)` | Set reminder in seconds | `setQuickReminder('Check email', 30)` |
| `setTimedReminder(message, minutes)` | Set reminder in minutes | `setTimedReminder('Meeting in 15 min', 15)` |
| `setHourlyReminder(message, hours)` | Set reminder in hours | `setHourlyReminder('Lunch break', 2)` |

## React Integration

### Basic Reminder Hook

```typescript
import { useState, useEffect } from 'react';
import { 
  setReminder, 
  cancelAllReminders, 
  subscribeToReminders,
  getActiveReminders,
  type Reminder 
} from '@/utils/reminders';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    // Initialize with current reminders
    setReminders(getActiveReminders());

    // Subscribe to updates
    const unsubscribe = subscribeToReminders((updatedReminders) => {
      setReminders(updatedReminders);
    });

    return unsubscribe;
  }, []);

  const addReminder = (message: string, delaySeconds: number, title?: string) => {
    return setReminder({ message, delaySeconds, title });
  };

  const clearAllReminders = () => {
    return cancelAllReminders();
  };

  return {
    reminders,
    addReminder,
    clearAllReminders,
    count: reminders.length
  };
}
```

### Complete Reminder Component

```typescript
import { useState } from 'react';
import { useReminders } from './useReminders';

export function ReminderComponent() {
  const { reminders, addReminder, clearAllReminders, count } = useReminders();
  const [message, setMessage] = useState('');
  const [seconds, setSeconds] = useState(10);

  const handleSetReminder = () => {
    const result = addReminder(message, seconds, 'PWA Reminder');
    
    if (result.success) {
      setMessage('');
      alert(`Reminder set for ${seconds} seconds!`);
    } else {
      alert(`Failed to set reminder: ${result.error}`);
    }
  };

  const handleClearAll = () => {
    const cancelled = clearAllReminders();
    alert(`Cancelled ${cancelled} reminders`);
  };

  return (
    <div className="space-y-4">
      <h3>Set Reminder</h3>
      
      <div className="space-y-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Reminder message"
          className="w-full p-2 border rounded"
        />
        
        <div className="flex gap-2 items-center">
          <label>Delay (seconds):</label>
          <input
            type="number"
            value={seconds}
            onChange={(e) => setSeconds(Number(e.target.value))}
            min="1"
            max="3600"
            className="w-20 p-1 border rounded"
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleSetReminder}
            disabled={!message.trim() || seconds < 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Set Reminder
          </button>
          
          {count > 0 && (
            <button 
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Cancel All ({count})
            </button>
          )}
        </div>
      </div>

      {count > 0 && (
        <div>
          <h4>Active Reminders ({count})</h4>
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
```

### Quick Action Component

```typescript
import { setQuickReminder, setTimedReminder } from '@/utils/reminders';

export function QuickReminders() {
  const quickActions = [
    { label: '30 seconds', action: () => setQuickReminder('Quick reminder!', 30) },
    { label: '1 minute', action: () => setTimedReminder('One minute reminder', 1) },
    { label: '5 minutes', action: () => setTimedReminder('Break time!', 5) },
    { label: '15 minutes', action: () => setTimedReminder('Meeting soon', 15) },
  ];

  return (
    <div className="space-y-2">
      <h4>Quick Reminders</h4>
      <div className="flex flex-wrap gap-2">
        {quickActions.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Validate Input

```typescript
function setValidatedReminder(message: string, seconds: number) {
  if (!message.trim()) {
    return { success: false, error: 'Message cannot be empty' };
  }
  
  if (seconds < 1 || seconds > 86400) { // Max 24 hours
    return { success: false, error: 'Delay must be between 1 second and 24 hours' };
  }
  
  return setReminder({ message, delaySeconds: seconds });
}
```

### 2. Handle Browser Limitations

```typescript
// Browser tabs may be throttled/suspended
// For critical reminders, consider server-side scheduling
function setCriticalReminder(message: string, seconds: number) {
  // Client-side reminder
  const clientResult = setReminder({ message, delaySeconds: seconds });
  
  // Also schedule server-side for important reminders
  // scheduleServerReminder(message, seconds);
  
  return clientResult;
}
```

### 3. Provide User Feedback

```typescript
function setReminderWithFeedback(message: string, seconds: number) {
  const result = setReminder({ message, delaySeconds: seconds });
  
  if (result.success) {
    // Show success message
    const scheduleTime = new Date(Date.now() + seconds * 1000);
    alert(`Reminder set for ${scheduleTime.toLocaleTimeString()}`);
  } else {
    // Show error message
    alert(`Failed to set reminder: ${result.error}`);
  }
  
  return result;
}
```

### 4. Cleanup on Component Unmount

```typescript
useEffect(() => {
  const unsubscribe = subscribeToReminders(handleReminderUpdate);
  
  return () => {
    unsubscribe();
    // Optionally cancel all reminders when component unmounts
    // cancelAllReminders();
  };
}, []);
```

### 5. Common Time Intervals

```typescript
// Predefined time constants
export const REMINDER_TIMES = {
  THIRTY_SECONDS: 30,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  TWO_HOURS: 7200,
} as const;

// Usage
setReminder({
  message: 'Break time!',
  delaySeconds: REMINDER_TIMES.FIFTEEN_MINUTES
});
```

## Common Use Cases

### 1. Break Reminders

```typescript
// Set regular break reminders
function setBreakReminders() {
  setTimedReminder('Take a 5-minute break', 25); // Pomodoro technique
  setTimedReminder('Stand and stretch', 60);
  setTimedReminder('Drink water', 30);
}
```

### 2. Meeting Reminders

```typescript
function setMeetingReminder(meetingTitle: string, minutesUntil: number) {
  // 15 minutes before
  setTimedReminder(`Meeting "${meetingTitle}" in 15 minutes`, minutesUntil - 15);
  
  // 5 minutes before
  setTimedReminder(`Meeting "${meetingTitle}" in 5 minutes`, minutesUntil - 5);
  
  // Meeting time
  setTimedReminder(`Meeting "${meetingTitle}" is starting now!`, minutesUntil);
}
```

### 3. Task Reminders

```typescript
function setTaskReminder(taskName: string, dueInMinutes: number) {
  const reminderTimes = [60, 30, 15, 5]; // minutes before
  
  reminderTimes.forEach(minutesBefore => {
    if (dueInMinutes > minutesBefore) {
      setTimedReminder(
        `Task "${taskName}" due in ${minutesBefore} minutes`,
        dueInMinutes - minutesBefore
      );
    }
  });
}
```