'use client';

import { sendPushNotification, NotificationResult } from './notifications';

// Types
export interface Reminder {
  id: string;
  message: string;
  title?: string;
  delaySeconds: number;
  createdAt: Date;
  scheduledFor: Date;
  timerId: number;
}

export interface ReminderOptions {
  message: string;
  delaySeconds: number;
  title?: string;
}

export interface ReminderResult {
  success: boolean;
  reminder?: Reminder;
  error?: string;
}

// Reminder Manager Class
class ReminderManager {
  private reminders: Map<string, Reminder> = new Map();
  private callbacks: Array<(reminders: Reminder[]) => void> = [];

  // Subscribe to reminder updates
  subscribe(callback: (reminders: Reminder[]) => void) {
    this.callbacks.push(callback);
    // Return unsubscribe function
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  // Notify subscribers of changes
  private notify() {
    const reminders = Array.from(this.reminders.values());
    this.callbacks.forEach(callback => callback(reminders));
  }

  // Generate unique ID
  private generateId(): string {
    return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set a new reminder
  setReminder(options: ReminderOptions): ReminderResult {
    try {
      const id = this.generateId();
      const now = new Date();
      const scheduledFor = new Date(now.getTime() + options.delaySeconds * 1000);

      const timerId = window.setTimeout(async () => {
        try {
          // Send the notification
          const result = await sendPushNotification(
            options.message,
            options.title || 'Reminder'
          );
          
          if (result.success) {
            console.log(`Reminder notification sent: ${options.message}`);
          } else {
            console.error('Failed to send reminder notification:', result.error);
          }
        } catch (error) {
          console.error('Error sending reminder notification:', error);
        }
        
        // Remove from active reminders
        this.removeReminder(id);
      }, options.delaySeconds * 1000);

      const reminder: Reminder = {
        id,
        message: options.message,
        title: options.title,
        delaySeconds: options.delaySeconds,
        createdAt: now,
        scheduledFor,
        timerId,
      };

      this.reminders.set(id, reminder);
      this.notify();

      return { success: true, reminder };
    } catch (error) {
      console.error('Failed to set reminder:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Cancel a specific reminder
  cancelReminder(id: string): boolean {
    const reminder = this.reminders.get(id);
    if (!reminder) {
      return false;
    }

    clearTimeout(reminder.timerId);
    this.reminders.delete(id);
    this.notify();
    return true;
  }

  // Remove a reminder (used internally when reminder fires)
  private removeReminder(id: string): void {
    this.reminders.delete(id);
    this.notify();
  }

  // Cancel all reminders
  cancelAllReminders(): number {
    const count = this.reminders.size;
    
    this.reminders.forEach(reminder => {
      clearTimeout(reminder.timerId);
    });
    
    this.reminders.clear();
    this.notify();
    return count;
  }

  // Get all active reminders
  getActiveReminders(): Reminder[] {
    return Array.from(this.reminders.values());
  }

  // Get reminder by ID
  getReminder(id: string): Reminder | undefined {
    return this.reminders.get(id);
  }

  // Get reminders count
  getRemindersCount(): number {
    return this.reminders.size;
  }

  // Check if a reminder exists
  hasReminder(id: string): boolean {
    return this.reminders.has(id);
  }

  // Get time remaining for a reminder
  getTimeRemaining(id: string): number | null {
    const reminder = this.reminders.get(id);
    if (!reminder) {
      return null;
    }

    const now = new Date().getTime();
    const remaining = reminder.scheduledFor.getTime() - now;
    return Math.max(0, Math.floor(remaining / 1000));
  }
}

// Global reminder manager instance
const reminderManager = new ReminderManager();

// Utility Functions
export function setReminder(options: ReminderOptions): ReminderResult {
  return reminderManager.setReminder(options);
}

export function cancelReminder(id: string): boolean {
  return reminderManager.cancelReminder(id);
}

export function cancelAllReminders(): number {
  return reminderManager.cancelAllReminders();
}

export function getActiveReminders(): Reminder[] {
  return reminderManager.getActiveReminders();
}

export function getRemindersCount(): number {
  return reminderManager.getRemindersCount();
}

export function getReminder(id: string): Reminder | undefined {
  return reminderManager.getReminder(id);
}

export function hasReminder(id: string): boolean {
  return reminderManager.hasReminder(id);
}

export function getTimeRemaining(id: string): number | null {
  return reminderManager.getTimeRemaining(id);
}

// Subscribe to reminder updates
export function subscribeToReminders(callback: (reminders: Reminder[]) => void): () => void {
  return reminderManager.subscribe(callback);
}

// Convenience functions for common reminder scenarios
export function setQuickReminder(message: string, seconds: number): ReminderResult {
  return setReminder({
    message,
    delaySeconds: seconds,
    title: 'Quick Reminder'
  });
}

export function setTimedReminder(message: string, minutes: number): ReminderResult {
  return setReminder({
    message,
    delaySeconds: minutes * 60,
    title: 'Timed Reminder'
  });
}

export function setHourlyReminder(message: string, hours: number): ReminderResult {
  return setReminder({
    message,
    delaySeconds: hours * 60 * 60,
    title: 'Hourly Reminder'
  });
}

// Export the manager for advanced usage
export { reminderManager };