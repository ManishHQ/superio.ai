# Next.js PWA with Push Notifications & Web3 Wallet

This is a [Next.js](https://nextjs.org) Progressive Web App (PWA) with push notifications, scheduled reminders, and Web3 wallet integration using RainbowKit and Wagmi.

## Features

- 📱 **Progressive Web App (PWA)** - Install on mobile/desktop
- 🔔 **Push Notifications** - Cross-device notification system
- ⏰ **Scheduled Reminders** - Set custom reminder notifications
- 🌐 **Web3 Wallet Integration** - Connect with MetaMask, WalletConnect, and more
- 📱 **Mobile Wallet Support** - Special handling for PWA mode

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Browser Notification Setup

### For Google Chrome (macOS)

1. Enable notifications for **Google Chrome** in System Preferences → Notifications
2. Enable notifications for **Google Chrome Helper (Alerts)** in System Preferences → Notifications
3. In Chrome, go to `chrome://settings/content/notifications` and ensure the site is allowed

### For Brave Browser (macOS)

1. Enable notifications for **Brave** in System Preferences → Notifications  
2. Enable notifications for **Brave Helper (Alerts)** in System Preferences → Notifications
3. **Extra step for Brave**: Go to `brave://settings/privacy` and enable "Use Google services for push messaging"
4. In Brave, go to `brave://settings/content/notifications` and ensure the site is allowed

## Environment Variables

Create a `.env.local` file with your VAPID keys:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key  
VAPID_EMAIL=mailto:your@email.com
```

## PWA Installation

1. Deploy to Vercel or any HTTPS hosting (required for push notifications)
2. Visit the deployed URL on mobile/desktop
3. Look for "Add to Home Screen" or "Install App" prompt
4. The app will work offline and support push notifications

## Push Notification Testing

1. **Subscribe** to push notifications when prompted
2. **Test Notification** - Send immediate notification to all devices
3. **Reminder Notification** - Schedule a notification after X seconds
4. **Cross-device** - Notifications work across all subscribed devices

## Web3 Wallet Connection

- Works in regular browser mode
- For PWA mode on iOS: Use "Open in Browser" or "Open in MetaMask" buttons
- Supports all major wallets via RainbowKit

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [PWA Documentation](https://nextjs.org/docs/app/guides/progressive-web-apps) - Next.js PWA implementation
- [RainbowKit](https://www.rainbowkit.com/) - Web3 wallet connection library
- [Web Push Protocol](https://web.dev/push-notifications-overview/) - Push notification implementation

## Deploy on Vercel

Deploy easily on [Vercel Platform](https://vercel.com/new):

1. Connect your GitHub repository
2. Add environment variables (VAPID keys)
3. Deploy - automatic HTTPS and global CDN
4. PWA features work automatically on deployment

Check out [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.