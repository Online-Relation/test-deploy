'use client';

import { useEffect, useState } from 'react';
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
import { SortableItem } from './SortableItem';
import { Plus } from 'lucide-react';

interface Props {
  value: string[];
  onChange: (list: string[]) => void;
}

export function DopaminList({ value, onChange }: Props) {
  const [items, setItems] = useState<string[]>(value || []);
  const [input, setInput] = useState('');

  // Sync når parent value ændres
  useEffect(() => {
    setItems(value || []);
  }, [value]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAdd = () => {
    if (input.trim()) {
      const newList = [...items, input.trim()];
      setItems(newList);
      onChange(newList);
      setInput('');
    }
  };

  const handleRemove = (id: string) => {
    const newList = items.filter(i => i !== id);
    setItems(newList);
    onChange(newList);
  };

  const handleDragEnd = ({ active, over }: any) => {
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i === active.id);
      const newIndex = items.findIndex((i) => i === over?.id);
      const newList = arrayMove(items, oldIndex, newIndex);
      setItems(newList);
      onChange(newList);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">⚡️ Dopamin-triggers</h3>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Tilføj ny trigger..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow border rounded px-3 py-2"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
        >
          <Plus size={16} />
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2 mt-2">
            {items.map((item) => (
              <SortableItem key={item} id={item} onDelete={() => handleRemove(item)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
