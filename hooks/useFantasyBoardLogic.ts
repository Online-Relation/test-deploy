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
  extra_images?: string[];
}

export interface ProfileMap {
  [userId: string]: string;
}

export interface XpMap {
  [key: string]: number;
}

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
  newFantasyData: Omit<Fantasy, 'id'> & { extra_images?: string[]; hasExtras?: boolean };

  setFilterCategory: (cat: string | null) => void;
  setShowAddModal: (b: boolean) => void;
  handleCreateNewFantasy: () => Promise<void>;
  handleDragEnd: (event: any) => Promise<void>;
  handleDeleteFantasy: (id: string) => Promise<void>;
  setNewFantasyData: (f: Omit<Fantasy, 'id'> & { extra_images?: string[]; hasExtras?: boolean }) => void;
  setSelectedFantasy: (f: Fantasy | null) => void;
  fetchFantasies: () => Promise<void>;
}

export function useFantasyBoardLogic(): UseFantasyBoardResult {
  const { user } = useUserContext();
  const [role, setRole] = useState<string>('stine');
  const [fantasies, setFantasies] = useState<Fantasy[]>([]);
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const [xpMapStine, setXpMapStine] = useState<XpMap>({});
  const [xpMapCurrent, setXpMapCurrent] = useState<XpMap>({});
  const [selectedFantasy, setSelectedFantasy] = useState<Fantasy | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFantasyData, setNewFantasyData] = useState<Omit<Fantasy, 'id'> & { extra_images?: string[]; hasExtras?: boolean }>({
    title: '',
    description: '',
    image_url: '',
    category: '',
    effort: '',
    status: 'idea',
    user_id: user?.id || '',
    extra_images: [],
    hasExtras: false,
  });

const fetchFantasies = async () => {
  const { data: dataFant, error: errFant } = await supabase
    .from('fantasies')
    .select(`
      id,
      title,
      description,
      category,
      effort,
      status,
      image_url,
      extra_images,
      xp_granted,
      fulfilled_date,
      user_id
    `);
  if (!errFant && dataFant) setFantasies(dataFant);
};


  useEffect(() => {
    async function fetchAll() {
      if (user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (!profileError && profileData?.role) {
          setRole(profileData.role);
        }
      }
      await fetchFantasies();

      const { data: dataProf, error: errProf } = await supabase
        .from('profiles')
        .select('id, display_name');
      if (!errProf && dataProf) {
        const map: ProfileMap = {};
        dataProf.forEach((p) => (map[p.id] = p.display_name));
        setProfileMap(map);
      }

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

const handleCreateNewFantasy = async () => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('Session-fejl:', sessionError?.message);
    return;
  }

  const user_id = session.user.id;

if (!newFantasyData.title) {
  console.warn('Titel er påkrævet.');
  return;
}


  const { error } = await supabase.from('fantasies').insert({
    title: newFantasyData.title,
    description: newFantasyData.description,
    category: newFantasyData.category,
    effort: newFantasyData.effort,
    image_url: newFantasyData.image_url || null,
    extra_images: newFantasyData.extra_images || [],
    status: 'idea',
    user_id,
  });

  if (error) {
    console.error('Fejl ved oprettelse:', error.message);
    return;
  }

  setShowAddModal(false);
  setNewFantasyData({
    title: '',
    description: '',
    category: '',
    effort: '',
    image_url: '',
    extra_images: [],
    status: 'idea',
    user_id: '', // reset
    hasExtras: false,
  });

  await fetchFantasies();
};



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

    await supabase.from('fantasies').update(updateData).eq('id', fantasyId);

    const effLower = moved.effort?.toLowerCase();
    if (effLower && role === 'stine') {
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
    fetchFantasies,
  };
}
