import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
} from '@notifee/react-native';
import {Platform} from 'react-native';

const ANDROID_CHANNEL_ID = 'rest-timer-channel';

interface ScheduleNotificationInput {
  targetAtMs: number;
  exerciseName: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const ensureNotificationSetup = async (): Promise<void> => {
  await notifee.requestPermission();

  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'Rest Timer',
      vibration: true,
      sound: 'default',
      importance: AndroidImportance.HIGH,
    });
  }
};

export const scheduleRestDoneNotification = async ({
  targetAtMs,
  exerciseName,
  soundEnabled,
  vibrationEnabled,
}: ScheduleNotificationInput): Promise<string> => {
  const notificationId = `rest_${targetAtMs}`;

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: targetAtMs,
    alarmManager: {
      allowWhileIdle: true,
    },
  };

  await notifee.createTriggerNotification(
    {
      id: notificationId,
      title: 'Rest complete',
      body: `${exerciseName}: start your next set`,
      android: {
        channelId: ANDROID_CHANNEL_ID,
        sound: soundEnabled ? 'default' : undefined,
        vibrationPattern: vibrationEnabled ? [300, 300, 300, 300] : undefined,
        pressAction: {
          id: 'default',
        },
      },
      ios: {
        sound: soundEnabled ? 'default' : undefined,
      },
    },
    trigger,
  );

  return notificationId;
};

export const cancelRestNotification = async (
  notificationId?: string,
): Promise<void> => {
  if (!notificationId) {
    return;
  }

  await notifee.cancelNotification(notificationId);
};
