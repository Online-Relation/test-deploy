'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { Card } from "@/components/ui/card";

const TARGET_USER_ID = "5687c342-1a13-441c-86ca-f7e87e1edbd5"; // Stine

type Activity = {
  id: string;
  path: string;
  timestamp?: string;
  created_at?: string;
  user_agent: string | null;
  extra?: any;
};

type Profile = {
  id: string;
  display_name: string;
  email?: string;
};

type TopPage = {
  path: string;
  visits: number;
};

export default function ActivityPage() {
  const { user } = useUserContext();
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loginCount, setLoginCount] = useState(0);
  const [logins, setLogins] = useState<Activity[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);

  useEffect(() => {
    // Hent ALTID aktivitet og profil for Stine
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('id', TARGET_USER_ID)
        .maybeSingle();
      if (error) {
        console.error("Fejl ved hentning af profil:", error.message);
        return;
      }
      setProfile(data);
    };

    const fetchData = async () => {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', TARGET_USER_ID)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Fejl ved hentning af aktivitet:', error.message);
        return;
      }
      if (!data) return;

      setActivity(data);

      // Find login-events
      const loginEvents = data.filter(
        (a) =>
          a.path === "/login" ||
          (a.extra && (a.extra.event === "login" || a.extra.event === "logged_in"))
      );
      setLoginCount(loginEvents.length);
      setLogins(loginEvents.slice(0, 10));

      // Tæl mest besøgte sider
      const pageCount: { [path: string]: number } = {};
      data.forEach(a => {
        if (a.path && a.path !== '/login') { // Udeluk login for statistik
          pageCount[a.path] = (pageCount[a.path] || 0) + 1;
        }
      });
      const sortedPages = Object.entries(pageCount)
        .map(([path, visits]) => ({ path, visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);
      setTopPages(sortedPages);
    };

    fetchProfile();
    fetchData();
  }, []); // Ingen [user] dependency, da vi ALTID kun vil se Stine

  // Helper til dato-format
  const formatDate = (a: Activity) => {
    const ts = a.timestamp || a.created_at;
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " kl. " +
      d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">🔍 Aktivitet på platformen</h1>
      <div className="mb-6">
        <span className="text-lg font-semibold">Bruger: </span>
        <span className="font-mono">{profile?.display_name || TARGET_USER_ID}</span>
      </div>
      <Card className="p-4 mb-4">
        <div className="text-lg font-semibold mb-2">👤 Login aktivitet</div>
        <div className="mb-2">Antal logins: <span className="font-bold">{loginCount}</span></div>
        <div className="mb-2">Seneste logins:</div>
        <ul className="list-disc list-inside text-sm space-y-1">
          {logins.length === 0 ? (
            <li className="italic text-muted-foreground">Ingen logins registreret endnu.</li>
          ) : (
            logins.map((a) => (
              <li key={a.id}>
                {formatDate(a)}
                {a.user_agent ? (
                  <span className="text-xs text-gray-400 ml-2">({a.user_agent.slice(0,30)}...)</span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </Card>
      <Card className="p-4">
        <div className="text-lg font-semibold mb-2">🗂️ Seneste besøgte sider</div>
        <ul className="list-disc list-inside text-sm space-y-1">
          {activity.length === 0 ? (
            <li className="italic text-muted-foreground">Ingen aktivitet registreret endnu.</li>
          ) : (
            activity.slice(0, 20).map((a) => (
              <li key={a.id}>
                <span className="font-mono">{a.path}</span>
                <span className="ml-2 text-xs text-gray-500">{formatDate(a)}</span>
              </li>
            ))
          )}
        </ul>
      </Card>
      <Card className="p-4">
        <div className="text-lg font-semibold mb-2">🏆 Mest besøgte sider</div>
        <ul className="list-disc list-inside text-sm space-y-1">
          {topPages.length === 0 ? (
            <li className="italic text-muted-foreground">Ingen data endnu.</li>
          ) : (
            topPages.map((page) => (
              <li key={page.path}>
                <span className="font-mono">{page.path}</span>
                <span className="ml-2 text-xs text-gray-500">
                  ({page.visits} besøg)
                </span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
