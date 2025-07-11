import { useMemo, useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';
import { parseNotification } from '@/lib/parseNotification';

interface DashboardUserWidgetProps {
  name?: string;
  avatarUrl?: string;
  userId?: string;
}

export default function DashboardUserWidget({
  name = "Shahinur Rahman",
  avatarUrl = "/dummy-avatar.jpg",
  userId,
}: DashboardUserWidgetProps) {
  const greeting = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const time = hour * 60 + minute;

    if (time >= 5 * 60 && time <= 9 * 60) {
      return "Godmorgen";
    }
    if (time >= 9 * 60 + 1 && time <= 13 * 60) {
      return "God formiddag";
    }
    if (time >= 13 * 60 + 1 && time <= 17 * 60) {
      return "God eftermiddag";
    }
    if (time >= 17 * 60 + 1 && time <= 20 * 60) {
      return "God aften";
    }
    if (time >= 20 * 60 + 1 && time <= 22 * 60) {
      return "Godnat";
    }
    return "Du skal sove nu";
  }, []);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open || !userId) return;

    setLoading(true);

    // Hent først notifikationsindstillinger for brugeren
    supabase
      .from('notification_settings')
      .select('notification_type, enabled')
      .eq('user_id', userId)
      .then(({ data: settingsData }) => {
        const enabledTypes = (settingsData ?? [])
          .filter((s: any) => s.enabled)
          .reduce((acc: Record<string, boolean>, cur: any) => {
            acc[cur.notification_type] = true;
            return acc;
          }, {});

        setSettings(enabledTypes);

        // Hent notifikationer for brugeren
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)
          .then(({ data: notificationsData }) => {
            const parsed = (notificationsData ?? [])
              .map(parseNotification)
              .filter(n => n && enabledTypes[n.type]); // filtrer på aktiverede typer

            setNotifications(parsed);
            setLoading(false);
          });
      });
  }, [open, userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl shadow-md w-full relative">
      <div className="flex items-center">
        <img
          src={avatarUrl}
          alt={name}
          className="w-11 h-11 rounded-full object-cover mr-3 border border-gray-100 shadow-sm"
        />
        <div>
          <div className="text-gray-400 text-sm flex items-center">
            {greeting} <span className="ml-1">👋</span>
          </div>
          <div className="font-semibold text-base">{name}</div>
        </div>
      </div>
      <div className="relative">
        <button
          type="button"
          className="bg-gray-100 p-3 rounded-full hover:bg-gray-200 transition-all relative"
          aria-label="Notifikationer"
          onClick={() => setOpen(v => !v)}
        >
          <Bell className="w-5 h-5 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {unreadCount}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-72 bg-white shadow-xl rounded-xl p-4 z-50 max-h-60 overflow-y-auto">
            <h4 className="font-semibold mb-2">Notifikationer</h4>
            {loading && <div className="text-gray-400">Indlæser...</div>}
            {!loading && notifications.length === 0 && (
              <div className="text-gray-400">Ingen notifikationer.</div>
            )}
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-center gap-2">
                  <a
                    href={n.link}
                    className={`hover:underline ${n.read ? 'text-gray-400' : 'font-semibold text-black'}`}
                  >
                    {n.text}
                  </a>
                  <span className="text-gray-300 text-xs ml-auto">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
