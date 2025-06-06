// /hooks/useFantasyBoardLogic.ts
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';

export interface Fantasy {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  category?: string;
  effort?: string;
  status: 'idea' | 'planned' | 'fulfilled';
  xp_granted?: boolean;
  fulfilled_date?: string;
  user_id?: string;
}

export interface ProfileMap {
  [userId: string]: string;
}

export interface XpMap {
  [key: string]: number;
}

// Remember to export CategoryEntry so FantasyBoard kan importere den
export interface CategoryEntry {
  id: string;
  name: string;
}

export interface UseFantasyBoardResult {
  fantasies: Fantasy[];
  profileMap: ProfileMap;
  xpMapStine: XpMap;
  xpMapCurrent: XpMap;
  selectedFantasy: Fantasy | null;
  filterCategory: string | null;
  showAddModal: boolean;
  newFantasyData: Omit<Fantasy, 'id'>;

  setFilterCategory: (cat: string | null) => void;
  setShowAddModal: (b: boolean) => void;
  handleCreateNewFantasy: () => Promise<void>;
  handleDragEnd: (event: any) => Promise<void>;
  handleDeleteFantasy: (id: string) => Promise<void>;
  setNewFantasyData: (f: Omit<Fantasy, 'id'>) => void;
  setSelectedFantasy: (f: Fantasy | null) => void;
}

export function useFantasyBoardLogic(): UseFantasyBoardResult {
  const { user, role } = useUserContext();
  const [fantasies, setFantasies] = useState<Fantasy[]>([]);
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const [xpMapStine, setXpMapStine] = useState<XpMap>({});
  const [xpMapCurrent, setXpMapCurrent] = useState<XpMap>({});
  const [selectedFantasy, setSelectedFantasy] = useState<Fantasy | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFantasyData, setNewFantasyData] = useState<Omit<Fantasy, 'id'>>({
    title: '',
    description: '',
    image_url: '',
    category: '',
    effort: '',
    status: 'idea',
    user_id: user?.id || '',
  });

  useEffect(() => {
    async function fetchAll() {
      // 1) Hent alle fantasier
      const { data: dataFant, error: errFant } = await supabase
        .from('fantasies')
        .select('*');
      if (!errFant && dataFant) setFantasies(dataFant);

      // 2) Hent alle profiler til mapping user_id → display_name
      const { data: dataProf, error: errProf } = await supabase
        .from('profiles')
        .select('id, display_name');
      if (!errProf && dataProf) {
        const map: ProfileMap = {};
        dataProf.forEach((p) => (map[p.id] = p.display_name));
        setProfileMap(map);
      }

      // 3a) Hent XP-opsætning for Stine (bruges i badge-visning)
      const { data: dataStine, error: errStine } = await supabase
        .from('xp_settings')
        .select('action, effort, xp')
        .eq('role', 'stine')
        .in('action', ['add_fantasy', 'plan_fantasy', 'complete_fantasy']);
      if (!errStine && dataStine) {
        const mapSt: XpMap = {};
        dataStine.forEach((s) => {
          const key = `${s.action}_${s.effort?.toLowerCase() || ''}`;
          mapSt[key] = s.xp;
        });
        setXpMapStine(mapSt);
      }

      // 3b) Hent XP-opsætning for den nuværende bruger (bruges ved drag/drop og oprettelse)
      const { data: dataCur, error: errCur } = await supabase
        .from('xp_settings')
        .select('action, effort, xp')
        .eq('role', role)
        .in('action', ['add_fantasy', 'plan_fantasy', 'complete_fantasy']);
      if (!errCur && dataCur) {
        const mapCur: XpMap = {};
        dataCur.forEach((s) => {
          const key = `${s.action}_${s.effort?.toLowerCase() || ''}`;
          mapCur[key] = s.xp;
        });
        setXpMapCurrent(mapCur);
      }
    }

    fetchAll();
  }, [role]);

  // Tilføj ny fantasi + evt. “add_fantasy” XP til Stine
  const handleCreateNewFantasy = async () => {
    const toInsert = { ...newFantasyData, user_id: user?.id || '' };
    const { data, error } = await supabase
      .from('fantasies')
      .insert(toInsert)
      .select()
      .maybeSingle();

    if (!error && data) {
      setFantasies((prev) => [...prev, data]);

      // Hvis Stine var logget ind, tildel hende “add_fantasy” XP
      if (role === 'stine' && data.effort) {
        const effLower = data.effort.toLowerCase();
        const xpToGive = xpMapCurrent[`add_fantasy_${effLower}`] || 0;
        if (xpToGive > 0) {
          await supabase.from('xp_log').insert({
            user_id: user?.id,
            change: xpToGive,
            description: `add_fantasy – ${data.title}`,
            role,
          });
        }
      }

      setShowAddModal(false);
      setNewFantasyData({
        title: '',
        description: '',
        image_url: '',
        category: '',
        effort: '',
        status: 'idea',
        user_id: user?.id || '',
      });
    } else {
      console.error('Fejl ved oprettelse:', error?.message);
    }
  };

  // Drag & drop: opdater status + evt. “plan_fantasy”/“complete_fantasy” XP
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as 'idea' | 'planned' | 'fulfilled';
    const fantasyId = active.id as string;
    const moved = fantasies.find((f) => f.id === fantasyId);
    if (!moved || moved.status === newStatus) return;

    const prevStatus = moved.status;
    const updateData: Partial<Fantasy> = { status: newStatus };
    if (prevStatus === 'planned' && newStatus === 'fulfilled') {
      updateData.xp_granted = true;
      updateData.fulfilled_date = new Date().toISOString().split('T')[0];
    }

    // Opdater fantasy i Supabase
    await supabase.from('fantasies').update(updateData).eq('id', fantasyId);

    const effLower = moved.effort?.toLowerCase();
    if (effLower && role === 'stine') {
      // idé → planlagt → “plan_fantasy”
      if (prevStatus === 'idea' && newStatus === 'planned') {
        const xpToGive = xpMapCurrent[`plan_fantasy_${effLower}`] || 0;
        if (xpToGive > 0) {
          await supabase.from('xp_log').insert({
            user_id: user?.id,
            change: xpToGive,
            description: `plan_fantasy – ${moved.title}`,
            role,
          });
        }
      }
      // planlagt → opfyldt → “complete_fantasy”
      if (prevStatus === 'planned' && newStatus === 'fulfilled') {
        const xpToGive = xpMapCurrent[`complete_fantasy_${effLower}`] || 0;
        if (xpToGive > 0) {
          await supabase.from('xp_log').insert({
            user_id: user?.id,
            change: xpToGive,
            description: `complete_fantasy – ${moved.title}`,
            role,
          });
        }
      }
    }

    setFantasies((prev) =>
      prev.map((f) =>
        f.id === fantasyId ? { ...f, status: newStatus, ...updateData } : f
      )
    );
  };

  // Slet fantasi i Supabase + fjern fra lokal state
  const handleDeleteFantasy = async (id: string) => {
    const { error } = await supabase.from('fantasies').delete().eq('id', id);
    if (!error) {
      setFantasies((prev) => prev.filter((f) => f.id !== id));
      setSelectedFantasy(null);
    } else {
      console.error('Fejl ved sletning:', error.message);
    }
  };

  return {
    fantasies,
    profileMap,
    xpMapStine,
    xpMapCurrent,
    selectedFantasy,
    filterCategory,
    showAddModal,
    newFantasyData,

    setFilterCategory,
    setShowAddModal,
    handleCreateNewFantasy,
    handleDragEnd,
    handleDeleteFantasy,
    setNewFantasyData,
    setSelectedFantasy,
  };
}
