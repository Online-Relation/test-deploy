'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

export function SortableItem({ id, onDelete }: { id: string; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between px-4 py-2 rounded-2xl bg-violet-100 text-violet-900 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2">
        <GripVertical
          className="cursor-grab text-violet-400 hover:text-violet-600"
          size={16}
          {...attributes}
          {...listeners}
        />
        <span className="text-sm">{id}</span>
      </div>
      <button onClick={onDelete} className="text-violet-500 hover:text-red-500 transition-colors">
        <X size={16} />
      </button>
    </li>
  );
}
