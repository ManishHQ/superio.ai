'use server';

import webpush from 'web-push';

// Configure web-push with VAPID details (only if env vars are set)
const vapidEmail = process.env.VAPID_EMAIL;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidEmail && vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

// In-memory store for subscriptions (use database in production)
let subscriptions: webpush.PushSubscription[] = [];

export async function subscribeUser(subscription: any) {
  try {
    if (!vapidEmail || !vapidPublicKey || !vapidPrivateKey) {
      return { success: false, error: 'Push notifications not configured. Set VAPID environment variables.' };
    }

    // Convert browser PushSubscription to web-push format
    const webPushSubscription: webpush.PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
      },
    };

    // Store subscription (in production, save to database)
    const existingIndex = subscriptions.findIndex(
      (sub) => sub.endpoint === webPushSubscription.endpoint
    );

    if (existingIndex === -1) {
      subscriptions.push(webPushSubscription);
    } else {
      subscriptions[existingIndex] = webPushSubscription;
    }

    return { success: true };
  } catch (error) {
    console.error('Error subscribing user:', error);
    return { success: false, error: 'Failed to subscribe user' };
  }
}

export async function unsubscribeUser(subscription: any) {
  try {
    subscriptions = subscriptions.filter(
      (sub) => sub.endpoint !== subscription.endpoint
    );
    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return { success: false, error: 'Failed to unsubscribe user' };
  }
}

export async function sendNotification(message: string) {
  try {
    if (!vapidEmail || !vapidPublicKey || !vapidPrivateKey) {
      return { success: false, error: 'Push notifications not configured. Set VAPID environment variables.' };
    }

    if (subscriptions.length === 0) {
      return { success: false, error: 'No active subscriptions' };
    }

    const notificationPayload = JSON.stringify({
      title: 'PWA Notification',
      body: message,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      data: {
        url: '/',
        timestamp: Date.now(),
      },
    });

    // Send notifications to all subscribers
    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, notificationPayload);
      } catch (error) {
        console.error('Error sending notification to subscriber:', error);
        // Remove invalid subscriptions
        subscriptions = subscriptions.filter(
          (sub) => sub.endpoint !== subscription.endpoint
        );
      }
    });

    await Promise.all(promises);

    return { 
      success: true, 
      message: `Notification sent to ${subscriptions.length} subscribers` 
    };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return { success: false, error: 'Failed to send notifications' };
  }
}