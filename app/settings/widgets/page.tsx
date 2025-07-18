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
];


const heightOptions = ['auto', 'medium', 'large'];

export default function WidgetAccessPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [widgetOrder, setWidgetOrder] = useState<Record<string, any[]>>({});
  const [accessMap, setAccessMap] = useState<Record<string, Record<string, { enabled: boolean; height: string }>>>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, display_name');
      if (!profiles) return;
      setUsers(profiles);

      const { data: widgets } = await supabase.from('dashboard_widgets').select('user_id, widget_key, enabled, order, height');
      // For hver bruger, find og opret alle widgets
      let orderMap: Record<string, any[]> = {};
      let access: Record<string, Record<string, { enabled: boolean; height: string }>> = {};
      for (const user of profiles) {
        let userWidgets = widgets?.filter(w => w.user_id === user.id);
        for (const widget of allWidgets) {
          if (!userWidgets?.find(w => w.widget_key === widget.key)) {
            await supabase.from('dashboard_widgets').insert({
              user_id: user.id,
              widget_key: widget.key,
              enabled: false,
              order: 0,
              height: 'auto',
              layout: 'small',
            });
          }
        }
      }
      // Re-hent efter evt. insert
      const { data: updatedWidgets } = await supabase.from('dashboard_widgets').select('user_id, widget_key, enabled, order, height');
      for (const user of profiles) {
        let userWidgets = updatedWidgets?.filter(w => w.user_id === user.id)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        orderMap[user.id] = userWidgets?.map(w => ({
          key: w.widget_key,
          label: allWidgets.find(aw => aw.key === w.widget_key)?.label ?? w.widget_key,
          enabled: w.enabled,
          height: w.height ?? 'auto',
        })) || [];
        access[user.id] = {};
        for (const w of userWidgets || []) {
          access[user.id][w.widget_key] = { enabled: w.enabled, height: w.height ?? 'auto' };
        }
      }
      console.log('WidgetAccessPage: orderMap', orderMap);
      setWidgetOrder(orderMap);
      setAccessMap(access);
    };
    fetchData();
  }, []);

  // Drag logic
  const onDragEnd = (userId: string) => (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(widgetOrder[userId]);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    setWidgetOrder(prev => ({ ...prev, [userId]: items }));
    console.log('WidgetAccessPage: efter drag', items);
  };

  const toggle = (userId: string, index: number) => {
    setWidgetOrder(prev => {
      const newOrder = {
        ...prev,
        [userId]: prev[userId].map((w, i) =>
          i === index ? { ...w, enabled: !w.enabled } : w
        ),
      };
      console.log('WidgetAccessPage: toggle', userId, newOrder[userId][index]);
      return newOrder;
    });
  };

  const changeHeight = (userId: string, index: number, value: string) => {
    setWidgetOrder(prev => {
      const newOrder = {
        ...prev,
        [userId]: prev[userId].map((w, i) =>
          i === index ? { ...w, height: value } : w
        ),
      };
      console.log('WidgetAccessPage: changeHeight', userId, newOrder[userId][index]);
      return newOrder;
    });
  };

  const saveChanges = async () => {
    for (const userId in widgetOrder) {
      for (let i = 0; i < widgetOrder[userId].length; i++) {
        const w = widgetOrder[userId][i];
        await supabase.from('dashboard_widgets').upsert({
          user_id: userId,
          widget_key: w.key,
          enabled: w.enabled,
          order: i,
          height: w.height,
          layout: 'medium',
        }, { onConflict: 'user_id,widget_key' });
        console.log('WidgetAccessPage: gemmer widget', w);
      }
    }
    alert('Widgets opdateret ✅');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Widget-adgang</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map(user => (
          <div key={user.id} className="border rounded p-4">
            <h2 className="font-semibold mb-3">{user.display_name}</h2>
            <DragDropContext onDragEnd={onDragEnd(user.id)}>
              <Droppable droppableId={user.id}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {widgetOrder[user.id]?.map((w, i) => (
                      <Draggable key={w.key} draggableId={w.key} index={i}>
                        {(prov) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`flex flex-col gap-2 mb-2 bg-gray-50 border p-2 rounded shadow transition-all`}
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="checkbox"
                                checked={w.enabled}
                                onChange={() => toggle(user.id, i)}
                              />
                              <span className="flex-1">{w.label}</span>
                              <span className="text-gray-400 cursor-move">≡</span>
                            </div>
                            <select
                              value={w.height || 'auto'}
                              onChange={e => changeHeight(user.id, i, e.target.value)}
                              className="w-full border p-1 rounded"
                            >
                              {heightOptions.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        ))}
      </div>
      <button
        onClick={saveChanges}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Gem ændringer
      </button>
    </div>
  );
}
