// components/SortableItem.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Pencil } from 'lucide-react';

interface Props {
  id: string;
  label?: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  children?: React.ReactNode; // ← TILFØJET
}

export function SortableItem({ id, label, onDelete, onEdit, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-1 px-4 py-2 rounded-2xl bg-violet-100 text-violet-900 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical
            className="cursor-grab text-violet-400 hover:text-violet-600"
            size={16}
            {...attributes}
            {...listeners}
          />
          <span className="text-sm">{label || id}</span>
        </div>
        <div className="flex gap-2 items-center">
          {onEdit && (
            <button onClick={onEdit} className="text-violet-500 hover:text-green-600 transition-colors">
              <Pencil size={16} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="text-violet-500 hover:text-red-500 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      {children && <div className="mt-1">{children}</div>}
    </li>
  );
}
