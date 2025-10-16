'use client';

import { subscribeUser, unsubscribeUser, sendNotification as sendNotificationAction } from '../app/actions';

// Types
export interface PWANotificationOptions {
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

export interface ReminderOptions {
  message: string;
  delaySeconds: number;
  title?: string;
}

export interface PushSubscriptionResult {
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}

export interface NotificationResult {
  success: boolean;
  error?: string;
}

// Service Worker Registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    
    console.log('Service worker registered successfully');
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

// Push Notification Utilities
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }
  
  return await Notification.requestPermission();
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
}

export async function subscribeToPushNotifications(): Promise<PushSubscriptionResult> {
  try {
    if (!isPushNotificationSupported()) {
      return { success: false, error: 'Push notifications not supported' };
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' };
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, error: 'Service worker registration failed' };
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      return { success: false, error: 'VAPID public key not configured' };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    const result = await subscribeUser(subscription);
    if (result.success) {
      return { success: true, subscription };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Push subscription failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function unsubscribeFromPushNotifications(): Promise<NotificationResult> {
  try {
    const subscription = await getCurrentPushSubscription();
    if (!subscription) {
      return { success: false, error: 'No active subscription' };
    }

    await subscription.unsubscribe();
    const result = await unsubscribeUser(subscription);
    
    return result;
  } catch (error) {
    console.error('Push unsubscription failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendPushNotification(message: string, title?: string): Promise<NotificationResult> {
  try {
    const fullMessage = title ? `${title}: ${message}` : message;
    const result = await sendNotificationAction(fullMessage);
    return result;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Simple Browser Notifications
export async function sendSimpleNotification(options: PWANotificationOptions): Promise<NotificationResult> {
  try {
    if (!('Notification' in window)) {
      return { success: false, error: 'Browser notifications not supported' };
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' };
    }

    const notificationOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/icons/icon-192.svg',
      badge: options.badge || '/icons/icon-192.svg',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      data: options.data,
    };

    // Add vibrate if supported
    if (options.vibrate && 'vibrate' in navigator) {
      (notificationOptions as any).vibrate = options.vibrate;
    }

    new Notification(options.title, notificationOptions);

    return { success: true };
  } catch (error) {
    console.error('Failed to send simple notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendServiceWorkerNotification(options: PWANotificationOptions): Promise<NotificationResult> {
  try {
    if (!('serviceWorker' in navigator)) {
      return { success: false, error: 'Service workers not supported' };
    }

    const registration = await navigator.serviceWorker.ready;
    
    const notificationOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/icons/icon-192.svg',
      badge: options.badge || '/icons/icon-192.svg',
      tag: options.tag,
      data: options.data,
    };

    // Add actions if provided
    if (options.actions) {
      (notificationOptions as any).actions = options.actions;
    }

    // Add vibrate if supported
    if (options.vibrate) {
      (notificationOptions as any).vibrate = options.vibrate;
    }

    await registration.showNotification(options.title, notificationOptions);

    return { success: true };
  } catch (error) {
    console.error('Failed to send service worker notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}