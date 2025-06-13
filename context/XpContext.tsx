// context/XpContext.tsx
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
}

const XpContext = createContext<XpContextType>({
  xp: 0,
  fetchXp: () => {},
  xpSettings: [],
});

export const XpProvider = ({ children }: { children: React.ReactNode }) => {
  const [xp, setXp] = useState(0);
  const [xpSettings, setXpSettings] = useState<XpSetting[]>([]);

  const fetchXp = async () => {
    const { data: xpLog } = await supabase
      .from("xp_log")
      .select("change")
      .order("created_at", { ascending: true });

    const total = xpLog?.reduce((acc, curr) => acc + (curr.change || 0), 0) || 0;
    setXp(total);
  };

  const fetchXpSettings = async () => {
    const { data } = await supabase.from("xp_settings").select("*");
    if (data) setXpSettings(data);
  };

  useEffect(() => {
    fetchXp();
    fetchXpSettings();
  }, []);

  return (
    <XpContext.Provider value={{ xp, fetchXp, xpSettings }}>
      {children}
    </XpContext.Provider>
  );
};

export const useXp = () => useContext(XpContext);
