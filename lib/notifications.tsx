import { supabase } from '@/lib/supabaseClient';
import { notificationTypes, NotificationTypeKey } from '@/config/notificationsConfig';

interface NotificationData {
  [key: string]: string | number;
}

export async function createNotification(
  userId: string,
  typeKey: NotificationTypeKey,
  data: NotificationData
) {
  const typeDef = notificationTypes[typeKey];
  if (!typeDef) {
    throw new Error(`Ugyldig notifikationstype: ${typeKey}`);
  }

  let text = typeDef.template;
  for (const key in data) {
    text = text.replace(new RegExp(`{${key}}`, 'g'), String(data[key]));
  }

  const link = `/${typeDef.linkType}/${data[typeDef.linkField]}`;

  const payload = {
    text,
    link,
    read: false,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('notifications').insert([{
    user_id: userId,
    type: typeKey,
    data: payload,
  }]);

  if (error) {
    throw error;
  }
}
