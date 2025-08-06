// /components/profile/RelationshipValuesSection.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Sizes } from '@/types/profile';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/lib/supabaseClient';

interface Props {
  sizes: Sizes;
  setSizes: React.Dispatch<React.SetStateAction<Sizes>>;
  handleSaveSizes: () => void;
}

interface Role {
  key: string;
  label: string;
  description: string;
}

function SortableRole({ id, label, description }: { id: string; label: string; description: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border rounded p-3 shadow-sm cursor-move bg-white"
    >
      <span className="font-medium">{label}</span>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}

export function RelationshipValuesSection({ sizes, setSizes, handleSaveSizes }: Props) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [allRoles, setAllRoles] = useState<Role[]>([]);

  const roleOrder = sizes.relationship_roles_order?.length
    ? sizes.relationship_roles_order
    : allRoles.map((r) => r.key);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('relationship_roles')
        .select('key, label, description');

      if (error) {
        console.error('Fejl ved hentning af roller:', error.message);
        return;
      }

      setAllRoles(data || []);

      if (!sizes.relationship_roles_order || sizes.relationship_roles_order.length === 0) {
        setSizes((prev) => ({
          ...prev,
          relationship_roles_order: data?.map((r) => r.key) || [],
        }));
      }
    };

    fetchRoles();
  }, []);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = roleOrder.indexOf(active.id);
      const newIndex = roleOrder.indexOf(over.id);
      const newOrder = arrayMove(roleOrder, oldIndex, newIndex);
      setSizes((prev) => ({ ...prev, relationship_roles_order: newOrder }));
    }
  };

  return (
    <>
      <h3 className="text-lg font-semibold mt-8">Roller i parforholdet</h3>
      <p className="text-sm text-gray-500 mb-4">Træk og slip rollerne i den rækkefølge, du genkender dig mest i</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={roleOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {roleOrder.map((key) => {
              const role = allRoles.find((r) => r.key === key);
              if (!role) return null;
              return (
                <SortableRole
                  key={role.key}
                  id={role.key}
                  label={role.label}
                  description={role.description}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={handleSaveSizes}
        className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700 mt-6"
      >
        Gem roller
      </button>
    </>
  );
}
