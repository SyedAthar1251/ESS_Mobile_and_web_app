import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import api from './api';

const CHANNEL_ID = 'ess_push_channel';

const getUserCredentials = (): { companyUrl: string; apiKey: string; apiSecret: string } => {
  const savedUser = localStorage.getItem('ess_user');
  if (savedUser) {
    const userData = JSON.parse(savedUser);
    if (userData.companyUrl && userData.apiKey && userData.apiSecret) {
      return {
        companyUrl: userData.companyUrl,
        apiKey: userData.apiKey,
        apiSecret: userData.apiSecret,
      };
    }
  }
  throw new Error('Authentication credentials not found. Please login again.');
};

const getAuthHeader = (apiKey: string, apiSecret: string) => ({
  Authorization: `token ${apiKey}:${apiSecret}`,
});

async function ensureNotificationChannel() {
  if (Capacitor.getPlatform() !== 'android') return;
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'ESS Notifications',
    description: 'Leave, expense, and task notifications',
    importance: 4, // IMPORTANCE_HIGH
    visibility: 1,
  });
}

export async function registerForPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await ensureNotificationChannel();

    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    await LocalNotifications.requestPermissions();
    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      try {
        const { companyUrl, apiKey, apiSecret } = getUserCredentials();
        const info = await Device.getInfo();

        await api.post(
          `${companyUrl}/api/method/employee_self_service.mobile.ess.employee_device_info`,
          {
            token: token.value,
            platform: info.platform === 'android' ? 'Android' : 'iOS',
            os_version: String(info.osVersion ?? ''),
            device_name: info.model ?? '',
            app_version: '1.0.0',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeader(apiKey, apiSecret),
            },
          }
        );
      } catch (err) {
        console.error('Failed to register device token with backend:', err);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('FCM registration error:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: notification.title ?? 'Notification',
            body: notification.body ?? '',
            channelId: CHANNEL_ID,
            extra: notification.data,
          },
        ],
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push tapped:', action);
    });
  } catch (err) {
    console.error('Push notification setup failed:', err);
  }
}
