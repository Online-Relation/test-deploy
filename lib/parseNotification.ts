import { notificationTypes, NotificationTypeKey } from '@/config/notificationsConfig';

interface Notification {
  id: number;
  user_id: string;
  type: NotificationTypeKey;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

export function parseNotification(notification: Notification) {
  console.log('Parsing notification:', notification); // <-- console.log til debug

  const def = notificationTypes[notification.type];
  if (!def) {
    console.warn(`Ukendt notifikationstype: ${notification.type}`);
    return null;
  }

  let text = def.template;
  Object.entries(notification.data || {}).forEach(([key, value]) => {
    const strValue = value !== null && value !== undefined ? String(value) : '';
    text = text.replaceAll(`{${key}}`, strValue);
  });

  let link = "#";
  if (def.linkType && def.linkField && notification.data?.[def.linkField]) {
    switch (def.linkType) {
      case "quiz":
        link = `/quiz/${notification.data[def.linkField]}`;
        break;
      case "fantasy":
        link = `/fantasy/${notification.data[def.linkField]}`;
        break;
      case "bucket":
        link = `/bucketlist/${notification.data[def.linkField]}`;
        break;
      default:
        link = "#";
    }
  }

  const parsedNotification = {
    id: notification.id,
    type: notification.type,
    text,
    link,
    icon: def.icon,
    read: notification.read,
    created_at: notification.created_at,
  };

  console.log('Parsed notification:', parsedNotification); // <-- console.log til debug

  return parsedNotification;
}
