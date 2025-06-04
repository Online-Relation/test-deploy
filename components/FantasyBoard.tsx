// components/FantasyBoard.tsx
'use client';

import { useCategory } from '@/context/CategoryContext';
import { useEffect, useState } from 'react';
import { useXp } from '@/context/XpContext';
import { supabase } from '@/lib/supabaseClient';
import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Tag, Zap } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { useUserContext } from '@/context/UserContext';

const effortLevels = ['Low', 'Medium', 'High'];

const fantasyStatuses = [
  { key: 'idea', label: 'Fantasier' },
  { key: 'planned', label: 'Planlagt' },
  { key: 'fulfilled', label: 'Opfyldt' },
];

interface Fantasy {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  category?: string;
  effort?: string;
  status: 'idea' | 'planned' | 'fulfilled';
  xp_granted?: boolean;
  fulfilled_date?: string;
}

function DraggableCard({ fantasy, onView }: { fantasy: Fantasy; onView: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: fantasy.id });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const effortBadgeColor = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white shadow hover:shadow-lg transition mb-4 rounded-xl border relative cursor-pointer"
      onClick={onView}
    >
      <button
        {...listeners}
        {...attributes}
        className="absolute top-2 right-2 cursor-grab text-gray-400 hover:text-gray-700 z-10"
      >
        ⠿
      </button>

      {fantasy.image_url && (
        <img
          src={fantasy.image_url}
          alt={fantasy.title}
          className="w-full h-56 object-cover rounded-t-xl"
        />
      )}

      <div className="p-5 space-y-2">
        <h3 className="font-semibold text-lg text-gray-900">{fantasy.title}</h3>
        <div
          className="text-sm text-gray-600 prose max-w-none line-clamp-5"
          dangerouslySetInnerHTML={{ __html: fantasy.description }}
        />

        <div className="flex flex-wrap gap-2 text-xs font-medium mt-2">
          {fantasy.category && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 gap-1">
              <Tag size={14} /> {fantasy.category}
            </Badge>
          )}
          {fantasy.effort && (
            <Badge
              variant="outline"
              className={`gap-1 ${effortBadgeColor[fantasy.effort as keyof typeof effortBadgeColor]}`}
            >
              <Zap size={14} /> {fantasy.effort}
            </Badge>
          )}
        </div>

        {fantasy.fulfilled_date && (
          <div className="text-xs text-gray-400 mt-1">Opfyldt: {fantasy.fulfilled_date}</div>
        )}
      </div>
    </div>
  );
}

function DroppableColumn({ status, fantasies, onCardClick }: { status: string; fantasies: Fantasy[]; onCardClick: (f: Fantasy) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} style={{ backgroundColor: isOver ? '#fde2e4' : undefined }} className="bg-gray-50 p-4 rounded shadow min-h-[300px]">
      <h2 className="text-xl font-semibold mb-4">{fantasyStatuses.find(s => s.key === status)?.label || status}</h2>
      {fantasies.map((fantasy) => (
        <DraggableCard key={fantasy.id} fantasy={fantasy} onView={() => onCardClick(fantasy)} />
      ))}
    </div>
  );
}

export default function FantasyBoard() {
  const { fantasyCategories } = useCategory();
  const { addXp } = useXp();
  const { user, role } = useUserContext();
  const [fantasies, setFantasies] = useState<Fantasy[]>([]);
  const [newFantasy, setNewFantasy] = useState<Omit<Fantasy, 'id'>>({ title: '', description: '', image_url: '', category: '', effort: '', status: 'idea' });
  const [selectedFantasy, setSelectedFantasy] = useState<Fantasy | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchFantasies = async () => {
      const { data, error } = await supabase.from('fantasies').select('*');
      if (error) console.error('Fejl ved hentning:', error.message);
      else setFantasies(data);
    };
    fetchFantasies();
  }, []);

  const logXp = async (receiver: 'mads' | 'stine', action: string, effort?: string) => {
  console.log('[logXp] KALDT MED:', { receiver, action, effort });

  const { data: setting, error: settingError } = await supabase
    .from('xp_settings')
    .select('xp')
    .eq('role', receiver)
    .eq('action', action)
    .eq('effort', effort?.toLowerCase() || '')
    .maybeSingle();

    console.log('[logXp] HENTET setting:', setting);

    if (settingError) {
    console.error('[logXp] Fejl ved hentning af xp_settings:', settingError);
    return;
  }

  if (!setting?.xp) {
    console.warn('[logXp] Ingen xp fundet i settings til:', { receiver, action, effort });
    return;
  }

  const { data: receiverProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', receiver)
    .maybeSingle();

  if (profileError) {
    console.error('[logXp] Fejl ved hentning af profil:', profileError);
    return;
  }

  if (!receiverProfile?.id) {
    console.error('[logXp] Ingen profil fundet til:', receiver);
    return;
  }

  const { error: insertError } = await supabase.from('xp_log').insert({
    user_id: receiverProfile.id,
    change: setting.xp,
    description: `${receiver} – ${action}`,
    role: receiver,
  });

  if (insertError) {
    console.error('[logXp] Fejl ved indsættelse i xp_log:', insertError);
  } else {
    console.log('[logXp] XP logget!', { receiver, action, xp: setting.xp });
  }

  if (user?.id === receiverProfile.id) {
    addXp(setting.xp);
  }
};



const addFantasy = async () => {
  if (!newFantasy.title.trim()) return;

  const { data, error } = await supabase.from('fantasies').insert([{
    ...newFantasy,
    effort: newFantasy.effort?.toLowerCase() || '',  // 💡 Tving effort til lowercase
    xp_granted: false,
    user_id: user?.id,
  }]).select();

  if (error) return console.error('Fejl ved tilføjelse:', error.message);

  if (data) {
    setFantasies(prev => [...prev, data[0]]);
    setNewFantasy({ title: '', description: '', image_url: '', category: '', effort: '', status: 'idea' });
    setShowAddModal(false);

    // 🔧 Ny korrekt logik
    if (user?.role) {
      console.log('[addFantasy] Logger XP for:', user.role, 'Effort:', data[0].effort);
      logXp(user.role, 'add_fantasy', data[0].effort);
    } else {
      console.warn('[addFantasy] user.role er ikke defineret!');
    }
  }
};



  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const fantasy = fantasies.find(f => f.id === active.id);
    if (!fantasy || fantasy.status === over.id) return;

    const newStatus = over.id as Fantasy['status'];

    if (newStatus === 'fulfilled' && !fantasy.xp_granted) {
      const fulfilled_date = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('fantasies').update({ status: newStatus, fulfilled_date, xp_granted: true }).eq('id', fantasy.id);
      if (error) return console.error('Fejl ved opdatering til fulfilled:', error.message);
      setFantasies(prev => prev.map(f => f.id === fantasy.id ? { ...f, status: newStatus, fulfilled_date, xp_granted: true } : f));
      logXp('stine', 'complete_fantasy', fantasy.effort);
      return;
    }

    if (fantasy.status === 'idea' && newStatus === 'planned') {
  const { error } = await supabase
    .from('fantasies')
    .update({ status: newStatus })
    .eq('id', fantasy.id);

  if (error) return console.error('Fejl ved opdatering til planlagt:', error.message);

  setFantasies(prev =>
    prev.map(f =>
      f.id === fantasy.id ? { ...f, status: newStatus } : f
    )
  );

  if (user?.role) {
    console.log('[drag] Logger XP for:', user.role, 'Effort:', fantasy.effort);
    logXp(user.role, 'plan_fantasy', fantasy.effort);
  } else {
    console.warn('[drag] user.role er ikke defineret!');
  }

  return;
}



    const { error } = await supabase.from('fantasies').update({ status: newStatus }).eq('id', fantasy.id);
    if (error) return console.error('Fejl ved status-opdatering:', error.message);
    setFantasies(prev => prev.map(f => f.id === fantasy.id ? { ...f, status: newStatus } : f));
  };

  const filteredFantasies = filterCategory
    ? fantasies.filter(f => f.category === filterCategory)
    : fantasies;

  return (
    <div className="max-w-7xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🌌 Fantasier</h1>
        <button onClick={() => setShowAddModal(true)} className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600">➕ Tilføj</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge
          onClick={() => setFilterCategory(null)}
          className={`cursor-pointer ${filterCategory === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
        >
          Alle
        </Badge>
        {fantasyCategories.map((cat) => (
          <Badge
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`cursor-pointer ${filterCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
          >
            {cat}
          </Badge>
        ))}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {fantasyStatuses.map(({ key }) => (
            <DroppableColumn
              key={key}
              status={key}
              fantasies={filteredFantasies.filter(f => f.status === key)}
              onCardClick={(f) => setSelectedFantasy(f)}
            />
          ))}
        </div>
      </DndContext>

      {showAddModal && (
        <Modal
          isCreateMode
          title="Tilføj ny fantasi"
          onClose={() => setShowAddModal(false)}
          onCreate={addFantasy}
          newFantasy={newFantasy}
          setNewFantasy={setNewFantasy}
        />
      )}

      {selectedFantasy && (
        <Modal
          fantasy={selectedFantasy}
          onClose={() => setSelectedFantasy(null)}
          onEdit={(updated) => {
            setFantasies(prev => prev.map(f => f.id === updated.id ? updated : f));
            setSelectedFantasy(null);
          }}
          onDelete={async (id) => {
  const fantasy = fantasies.find((f) => f.id === id);
  if (!fantasy) return;

  // 1. Slet XP-log (kun for add_fantasy og denne fantasi)
const { data: xpEntry } = await supabase
  .from('xp_log')
  .select('id')
  .eq('description', `${role} – add_fantasy`)
  .order('id', { ascending: false })
  .limit(1);


  if (xpEntry && xpEntry.length > 0) {
    await supabase.from('xp_log').delete().eq('id', xpEntry[0].id);
  }

  // 2. Slet fra Supabase
  await supabase.from('fantasies').delete().eq('id', id);

  // 3. Fjern fra state
  setFantasies((prev) => prev.filter((f) => f.id !== id));
}}



        />
      )}
    </div>
  );
}
