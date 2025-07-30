// /app/settings/widgets/layout/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface UserProfile {
  id: string;
  display_name: string;
}

const allWidgets = [
  { key: 'kompliment_reminder', label: 'Kompliment' },
  { key: 'xp_meter', label: 'XP-meter' },
  { key: 'reward_progress', label: 'Næste gave' },
  { key: 'task_summary', label: 'Opgaver klar' },
  { key: 'weekly_recommendation', label: 'Ugens anbefaling' },
  { key: 'reminder_widget', label: 'Deadline Reminder' },
  { key: 'challenge_card', label: 'Udfordringskort' },
  { key: 'level_tip', label: 'Tip til næste level' },
  { key: 'profile_header', label: 'Profilheader' },
  { key: 'manifestation_reminder', label: 'Manifestation Reminder' },
  { key: 'followup_thoughts', label: 'Opfølgning' },
  { key: 'flowers', label: 'Blomster Reminder' },
  { key: 'dashboard_banner', label: 'Forsidebillede' },
  { key: 'active_bet', label: 'Aktivt væddemål' },
  { key: 'daily_memory', label: 'Dagens minde' },
  { key: 'date_mission', label: 'Date Mission' },
  { key: 'never_boring_statement', label: 'Anti-kedsomhed' },
  { key: 'sexlife_spotlight', label: 'Sexliv Spotlight' },
  { key: 'weekly_mission', label: 'Ugentlig mission' },
];


const layoutOptions = ['small', 'medium', 'large'];
const heightOptions = ['auto', 'medium', 'large'];

export default function WidgetLayoutPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [widgetLayout, setWidgetLayout] = useState<
    Record<string, { layout: string; order: number; height?: string }>
  >({});
  const [orderedKeys, setOrderedKeys] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name');
      if (!error && data) setUsers(data);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!selectedUser) return;
      const { data } = await supabase
        .from('dashboard_widgets')
        .select('widget_key, layout, order, height')
        .eq('user_id', selectedUser);

      const layoutMap: Record<string, { layout: string; order: number; height?: string }> = {};
      data?.forEach((w) => {
        layoutMap[w.widget_key] = {
          layout: w.layout || 'medium',
          order: w.order ?? 0,
          height: w.height || 'auto',
        };
      });
      setWidgetLayout(layoutMap);

      const ordered = [...allWidgets]
        .map(w => w.key)
        .sort((a, b) => {
          const aOrder = layoutMap[a]?.order ?? 999;
          const bOrder = layoutMap[b]?.order ?? 999;
          return aOrder - bOrder;
        });
      setOrderedKeys(ordered);
    };
    load();
  }, [selectedUser]);

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const newOrder = Array.from(orderedKeys);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    setOrderedKeys(newOrder);

    setWidgetLayout(prev => {
      const copy = { ...prev };
      newOrder.forEach((key, idx) => {
        if (copy[key]) copy[key].order = idx;
        else copy[key] = { layout: 'medium', order: idx, height: 'auto' };
      });
      return copy;
    });
  }

  const updateWidget = (
    key: string,
    field: 'layout' | 'order' | 'height',
    value: string | number
  ) => {
    setWidgetLayout((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const saveChanges = async () => {
    if (!selectedUser) return;
    for (const key of orderedKeys) {
      const payload = {
        user_id: selectedUser,
        widget_key: key,
        enabled: true,
        layout: widgetLayout[key]?.layout || 'medium',
        order: widgetLayout[key]?.order ?? 0,
        height: widgetLayout[key]?.height || 'auto',
      };
      console.log('Gemmer widget:', payload); // <-- HER!
      await supabase.from('dashboard_widgets').upsert(
        payload,
        { onConflict: 'user_id,widget_key' }
      );
    }
    alert('Layout gemt ✅');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-indigo-700">Tilpas widget-layout</h1>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Vælg bruger</span>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
        >
          <option value="">-- Vælg --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.display_name}
            </option>
          ))}
        </select>
      </label>

      {selectedUser && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widgets-droppable">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 mt-6">
                {orderedKeys.map((key, index) => {
                  const widget = allWidgets.find(w => w.key === key);
                  if (!widget) return null;
                  return (
                    <Draggable key={key} draggableId={key} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`border rounded p-5 space-y-2 bg-white shadow-sm ${snapshot.isDragging ? 'ring-2 ring-indigo-400' : ''}`}
                        >
                          <h2 className="font-bold text-xl text-indigo-700 mb-2">{widget.label}</h2>
                          <label className="block text-sm">
                            Bredde:
                            <select
                              value={widgetLayout[key]?.layout || 'medium'}
                              onChange={(e) => updateWidget(key, 'layout', e.target.value)}
                              className="block w-full mt-1 p-2 border rounded"
                            >
                              {layoutOptions.map((l) => (
                                <option key={l} value={l}>
                                  {l}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-sm">
                            Højde:
                            <select
                              value={widgetLayout[key]?.height || 'auto'}
                              onChange={(e) => updateWidget(key, 'height', e.target.value)}
                              className="block w-full mt-1 p-2 border rounded"
                            >
                              {heightOptions.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <button
            onClick={saveChanges}
            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          >
            Gem layout
          </button>
        </DragDropContext>
      )}
    </div>
  );
}
