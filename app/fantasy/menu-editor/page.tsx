// app/fantasy/menu-editor/naughty-profile/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/context/UserContext';
import { X, Pencil } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '@/components/SortableItem';

interface Option {
  id: string;
  text: string;
  created_by: string;
  is_addon: boolean;
}

const EDITOR_ID = '190a3151-97bc-43be-9daf-1f3b3062f97f';

export default function MenuSelectPage() {
  const { user } = useUserContext();
  const router = useRouter();
  const [options, setOptions] = useState<Option[]>([]);
  const [addons, setAddons] = useState<Option[]>([]);
  const [selections, setSelections] = useState<Record<string, 'yes' | 'no' | null>>({});
  const [price, setPrice] = useState(100);
  const [addonPrice, setAddonPrice] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [newOption, setNewOption] = useState('');
  const [newAddon, setNewAddon] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [noGoText, setNoGoText] = useState('');
  const isEditor = user?.id === EDITOR_ID;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      const { data: optionsData } = await supabase
        .from('fantasy_menu_options')
        .select('*')
        .eq('is_addon', false)
        .order('sort_order');

      const { data: addonData } = await supabase
        .from('fantasy_menu_options')
        .select('*')
        .eq('is_addon', true)
        .order('sort_order');

      const { data: items } = await supabase
        .from('fantasy_menu_items')
        .select('text, choice')
        .eq('user_id', user?.id);

      const { data: metaData } = await supabase
        .from('fantasy_menu_meta')
        .select('price, addon_price, notes')
        .eq('user_id', user?.id)
        .single();

      const { data: noGoData } = await supabase
        .from('fantasy_menu_nogos')
        .select('text')
        .eq('user_id', user?.id)
        .single();

      console.log('👉 noGoData:', noGoData);

      if (metaData) {
        setPrice(metaData.price ?? 100);
        setNotes(metaData.notes ?? '');
        if (typeof metaData.addon_price === 'number') {
          setAddonPrice(metaData.addon_price);
        }
      }

      if (noGoData) {
        setNoGoText(noGoData.text);
      }

      setOptions(optionsData || []);
      setAddons(addonData || []);

      const allOptions = [...(optionsData || []), ...(addonData || [])];
      const initial: Record<string, 'yes' | 'no' | null> = {};
      allOptions.forEach(opt => {
        const match = items?.find(i => i.text === opt.text);
        initial[opt.id] = match?.choice ?? null;
      });
      setSelections(initial);
    };

    if (user?.id) fetchData();
  }, [user?.id]);

  const handleSelect = (id: string, choice: 'yes' | 'no') => {
    setSelections(prev => ({ ...prev, [id]: choice }));
  };

  const handleSave = async () => {
    if (!user?.id) return alert('Bruger ikke fundet');

    const { error: metaError } = await supabase
      .from('fantasy_menu_meta')
      .upsert({ user_id: user.id, price, addon_price: addonPrice, notes }, { onConflict: 'user_id' });

    if (metaError) {
      console.error('Fejl ved oprettelse af menu_meta:', metaError);
      return alert('Noget gik galt');
    }

    const { data: noGoResult, error: noGoError } = await supabase
      .from('fantasy_menu_nogos')
      .upsert({ user_id: user.id, text: noGoText }, { onConflict: 'user_id' });

    console.log('✅ NO-GO upsert result:', noGoResult);
    console.log('❌ NO-GO upsert error:', noGoError);

    const toInsert = Object.entries(selections)
      .filter(([_, choice]) => choice !== null)
      .map(([id, choice]) => ({
        user_id: user.id,
        text: [...options, ...addons].find(opt => opt.id === id)?.text ?? '',
        choice,
        extra_price: addons.some(a => a.id === id) ? addonPrice : null,
        is_selected: choice === 'yes',
      }));

    if (toInsert.length) {
      const { error: itemError } = await supabase
        .from('fantasy_menu_items')
        .upsert(toInsert, { onConflict: 'user_id,text' });
      if (itemError) {
        console.error('Fejl ved indsættelse af fantasier:', itemError);
        return alert('Kunne ikke gemme menukortet');
      }
    }

    router.push('/fantasy/menu-editor/naughty-profile');
  };

  const handleAdd = async (text: string, isAddon: boolean) => {
    if (!text.trim() || !user?.id) return;
    const { data, error } = await supabase
      .from('fantasy_menu_options')
      .insert({ text: text.trim(), created_by: user.id, is_addon: isAddon })
      .select()
      .single();

    if (!error && data) {
      if (isAddon) setAddons(prev => [...prev, data]);
      else setOptions(prev => [...prev, data]);
      setSelections(prev => ({ ...prev, [data.id]: null }));
      if (isAddon) setNewAddon('');
      else setNewOption('');
    }
  };

  const handleDelete = async (id: string) => {
    const all = [...options, ...addons];
    const toDelete = all.find(o => o.id === id);
    if (!toDelete) return;
    if (toDelete.created_by !== user?.id && !isEditor) return;

    await supabase.from('fantasy_menu_options').delete().eq('id', id);
    setOptions(prev => prev.filter(o => o.id !== id));
    setAddons(prev => prev.filter(o => o.id !== id));
  };

  const handleEdit = (id: string, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
  };

  const handleEditSubmit = async () => {
    if (!editingId || !editText.trim()) return;
    await supabase.from('fantasy_menu_options').update({ text: editText }).eq('id', editingId);
    setOptions(prev => prev.map(o => (o.id === editingId ? { ...o, text: editText } : o)));
    setAddons(prev => prev.map(o => (o.id === editingId ? { ...o, text: editText } : o)));
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center flex justify-center items-center gap-2">
        Stines valg 🍓
        {isEditor && (
          <button className="ml-2 p-1 text-gray-500 hover:text-black" onClick={() => setEditMode(!editMode)}>
            <Pencil size={20} />
          </button>
        )}
      </h1>

      {editingId && (
        <div className="flex gap-2">
          <input
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="flex-1 border px-2 py-1 rounded"
          />
          <button onClick={handleEditSubmit} className="bg-blue-500 text-white px-3 rounded">Gem</button>
        </div>
      )}

      <div>
        <label className="block font-semibold">Pris pr. ydelse (i kr.):</label>
        <input
          type="number"
          value={price}
          onChange={e => setPrice(Number(e.target.value))}
          className="w-full border rounded px-2 py-1"
        />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newOption}
          onChange={e => setNewOption(e.target.value)}
          className="flex-1 border px-2 py-1 rounded"
          placeholder="Tilføj ny fantasi..."
        />
        <button onClick={() => handleAdd(newOption, false)} className="bg-black text-white px-4 rounded">Tilføj</button>
      </div>

      <SortableContext items={options.map(o => o.id)} strategy={verticalListSortingStrategy}>
        {options.map((opt) => (
          <SortableItem
            key={opt.id}
            id={opt.id}
            label={
              <div className="flex flex-col w-full">
                <span className="text-sm font-medium">{opt.text}</span>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSelect(opt.id, 'yes')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      selections[opt.id] === 'yes'
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-white text-green-600 border border-green-500 hover:bg-green-100'
                    }`}
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => handleSelect(opt.id, 'no')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      selections[opt.id] === 'no'
                        ? 'bg-red-500 text-white shadow-md'
                        : 'bg-white text-red-600 border border-red-500 hover:bg-red-100'
                    }`}
                  >
                    Nej
                  </button>
                </div>
              </div>
            }
            onEdit={isEditor ? () => handleEdit(opt.id, opt.text) : undefined}
            onDelete={isEditor ? () => handleDelete(opt.id) : undefined}
          />
        ))}
      </SortableContext>

      <h2 className="text-xl font-semibold text-purple-700">Tillægsydelser</h2>

      <div>
        <label className="block font-semibold">Pris pr. tillægsydelse (i kr.):</label>
        <input
          type="number"
          value={addonPrice}
          onChange={e => setAddonPrice(Number(e.target.value))}
          className="w-full border rounded px-2 py-1"
        />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newAddon}
          onChange={e => setNewAddon(e.target.value)}
          className="flex-1 border px-2 py-1 rounded"
          placeholder="Tilføj tillægsydelse..."
        />
        <button onClick={() => handleAdd(newAddon, true)} className="bg-black text-white px-4 rounded">Tilføj</button>
      </div>

      <SortableContext items={addons.map(a => a.id)} strategy={verticalListSortingStrategy}>
        {addons.map((opt) => (
          <SortableItem
            key={opt.id}
            id={opt.id}
            label={
              <div className="flex flex-col w-full">
                <span className="text-sm font-medium">{opt.text}</span>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSelect(opt.id, 'yes')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      selections[opt.id] === 'yes'
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-white text-green-600 border border-green-500 hover:bg-green-100'
                    }`}
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => handleSelect(opt.id, 'no')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      selections[opt.id] === 'no'
                        ? 'bg-red-500 text-white shadow-md'
                        : 'bg-white text-red-600 border border-red-500 hover:bg-red-100'
                    }`}
                  >
                    Nej
                  </button>
                </div>
              </div>
            }
            onEdit={isEditor ? () => handleEdit(opt.id, opt.text) : undefined}
            onDelete={isEditor ? () => handleDelete(opt.id) : undefined}
          />
        ))}
      </SortableContext>
        <div>
        <label className="block font-semibold text-red-600">NO-GO zoner eller personlige grænser:</label>
        <textarea
          value={noGoText}
          onChange={e => setNoGoText(e.target.value)}
          rows={4}
          className="w-full border rounded px-2 py-1"
          placeholder="Skriv fx: ingen analsex, ingen dominans, eller andre vigtige grænser..."
        />
      </div>

      <button onClick={handleSave} className="w-full bg-blue-600 text-white py-2 rounded mt-6">Gem valgene</button>
    </div>
  );
}
