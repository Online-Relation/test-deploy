import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface XpSetting {
  id: number;
  role: string;
  action: string;
  effort: string | null;
  xp: number;
}

interface XpContextType {
  xp: number;
  fetchXp: () => void;
  xpSettings: XpSetting[];
  levelLength: number; // <-- NYT!
}

const XpContext = createContext<XpContextType>({
  xp: 0,
  fetchXp: () => {},
  xpSettings: [],
  levelLength: 100, // <-- NYT!
});

export const XpProvider = ({ children }: { children: React.ReactNode }) => {
  const [xp, setXp] = useState(0);
  const [xpSettings, setXpSettings] = useState<XpSetting[]>([]);
  const [levelLength, setLevelLength] = useState<number>(100); // <-- NYT!

  const fetchXp = async () => {
    // Hent nuværende bruger
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setXp(0);
      return;
    }
    // Hent kun xp_log for denne bruger!
    const { data: xpLog } = await supabase
      .from("xp_log")
      .select("change")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const total = xpLog?.reduce((acc, curr) => acc + (curr.change || 0), 0) || 0;
    setXp(total);
  };

  const fetchXpSettings = async () => {
    const { data } = await supabase.from("xp_settings").select("*");
    if (data) setXpSettings(data);
  };

  // NYT: Hent levelLength én gang
  const fetchLevelLength = async () => {
    const { data, error } = await supabase
      .from('xp_settings')
      .select('xp')
      .eq('action', 'level_length')
      .eq('role', 'common')
      .maybeSingle();
    if (!error && data && typeof data.xp === "number") {
      setLevelLength(data.xp);
    }
  };

  useEffect(() => {
    fetchXp();
    fetchXpSettings();
    fetchLevelLength();
  }, []);

  return (
    <XpContext.Provider value={{ xp, fetchXp, xpSettings, levelLength }}>
      {children}
    </XpContext.Provider>
  );
};

export const useXp = () => useContext(XpContext);
