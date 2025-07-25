'use client';

import { useCategory } from '@/context/CategoryContext';
import { useXp } from '@/context/XpContext';
import { supabase } from '@/lib/supabaseClient';
import { rectIntersection } from '@dnd-kit/core';
import {
  useFantasyBoardLogic,
  Fantasy,
  ProfileMap,
  XpMap,
  CategoryEntry,
} from '@/hooks/useFantasyBoardLogic';

import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';

import { Tag, Zap, Star, AlertCircle, Award, ImageIcon } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { TagBadge } from '@/components/ui/TagBadge';
import { useState } from 'react';

const fantasyStatuses = [
  { key: 'idea', label: 'Fantasier' },
  { key: 'planned', label: 'Planlagt' },
  { key: 'fulfilled', label: 'Opfyldt' },
] as const;

const colorClasses = ['purple', 'blue', 'green', 'yellow', 'pink', 'red'] as const;
type AllowedColors = typeof colorClasses[number] | 'gray';

export default function FantasyBoard() {
  const { fantasyCategories: rawCategories } = useCategory();
  const { addXp } = useXp();
  const [selectedFantasy, setSelectedFantasy] = useState<Fantasy | null>(null);
  const [editingFantasy, setEditingFantasy] = useState<Fantasy | null>(null);

  const {
    fantasies,
    profileMap,
    xpMapStine,
    xpMapCurrent,
    filterCategory,
    showAddModal,
    newFantasyData,
    setFilterCategory,
    setShowAddModal,
    handleCreateNewFantasy,
    handleDragEnd,
    handleDeleteFantasy,
    setNewFantasyData,
  } = useFantasyBoardLogic();

  const fantasyCategories: CategoryEntry[] = rawCategories.map((cat) =>
    typeof cat === 'string' ? { id: cat, name: cat } : cat
  );

  const filteredFantasies = filterCategory
    ? fantasies.filter((f) => f.category === filterCategory)
    : fantasies;

  // --- TÆLLER TIL HVER KOLONNE ---
  const fantasyCountByStatus = fantasyStatuses.reduce((acc, { key }) => {
    acc[key] = filteredFantasies.filter((f) => f.status === key).length;
    return acc;
  }, {} as Record<string, number>);

  const onDragEnd = async (event: any) => {
    await handleDragEnd(event);
  };

  const sensors = useSensors(useSensor(PointerSensor));

  function DraggableCard({
    fantasy,
    onView,
    profileMap,
    xpMapStine,
    fantasyCategories,
  }: {
    fantasy: Fantasy;
    onView: () => void;
    profileMap: ProfileMap;
    xpMapStine: XpMap;
    fantasyCategories: CategoryEntry[];
  }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({ id: fantasy.id });

    const style = {
      transform: transform
        ? `translate(${transform.x}px, ${transform.y}px)`
        : undefined,
      opacity: isDragging ? 0.5 : 1,
    };

    const effortColor: AllowedColors =
      fantasy.effort === 'Low' ? 'green' : fantasy.effort === 'Medium' ? 'yellow' : 'red';

    const idx =
      fantasy.category && Array.isArray(fantasyCategories)
        ? fantasyCategories.findIndex((cat) => cat.name === fantasy.category)
        : -1;
    const categoryColor: AllowedColors =
      idx >= 0 ? colorClasses[idx % colorClasses.length] : 'gray';

    let pointLabel: string | null = null;
    if (fantasy.effort) {
      const effLower = fantasy.effort.toLowerCase();
      if (fantasy.status === 'idea') {
        const xpVal = xpMapStine[`add_fantasy_${effLower}`] || 0;
        if (xpVal > 0) pointLabel = `Planlagt: +${xpVal} XP`;
      } else if (fantasy.status === 'planned') {
        const xpVal = xpMapStine[`complete_fantasy_${effLower}`] || 0;
        if (xpVal > 0) pointLabel = `Fuldfør: +${xpVal} XP`;
      }
    }

    const isMissingDescription =
      !fantasy.description ||
      fantasy.description.trim() === '' ||
      fantasy.description === '<p><br></p>';

    const fulfilledXpLabel =
      fantasy.status === 'fulfilled' && fantasy.effort
        ? `Tildelt: ${xpMapStine[`complete_fantasy_${fantasy.effort.toLowerCase()}`] || 0} XP`
        : null;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-card text-card-foreground shadow hover:shadow-lg transition mb-4 rounded-xl border border-border relative cursor-pointer"
        onClick={onView}
      >
        <button
          {...listeners}
          {...attributes}
          className="absolute top-2 right-2 cursor-grab text-muted-foreground hover:text-foreground z-10"
          onClick={(e) => e.stopPropagation()}
        >
          ⠃
        </button>

        {fantasy.image_url && (
          <img
            src={fantasy.image_url}
            alt={fantasy.title}
            className="w-full h-56 object-cover rounded-t-xl"
          />
        )}

        {isMissingDescription && (
          <div
            className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1 z-10"
            title="Manglende beskrivelse"
          >
            <AlertCircle size={16} />
          </div>
        )}

        {fantasy.extra_images && fantasy.extra_images.length > 0 && (
          <div
            className="absolute top-2 left-10 bg-blue-600 text-white rounded-full px-2 py-1 text-xs flex items-center gap-1 z-10"
            title="Ekstra billeder"
          >
            <ImageIcon size={14} /> {fantasy.extra_images.length}
          </div>
        )}

        <div className="p-5 space-y-1">
          <h3 className="font-semibold text-lg text-foreground">{fantasy.title}</h3>
          {fantasy.created_date && (
            <div className="text-xs text-muted-foreground">
              Tilføjet: {fantasy.created_date}
            </div>
          )}
          {fantasy.planned_date && (
            <div className="text-xs text-muted-foreground">
              Planlagt: {fantasy.planned_date}
            </div>
          )}

          <div
            className="text-sm text-muted-foreground prose max-w-none line-clamp-5"
            dangerouslySetInnerHTML={{ __html: fantasy.description }}
          />

          <div className="flex flex-wrap gap-2 text-xs font-medium mt-2">
            {fantasy.category && (
              <TagBadge
                label={fantasy.category}
                icon={<Tag size={14} />}
                color={categoryColor}
              />
            )}
            {fantasy.effort && (
              <TagBadge
                label={fantasy.effort}
                icon={<Zap size={14} />}
                color={effortColor}
              />
            )}
            {pointLabel && (
              <TagBadge
                label={pointLabel}
                icon={<Star size={14} />}
                color="yellow"
              />
            )}
            {fulfilledXpLabel && (
              <TagBadge
                label={fulfilledXpLabel}
                icon={<Award size={14} />}
                color="green"
              />
            )}
            {fantasy.user_id && profileMap[fantasy.user_id] && (
              <TagBadge label={profileMap[fantasy.user_id]} color="gray" />
            )}
          </div>

          {fantasy.fulfilled_date && (
            <div className="text-xs text-muted-foreground mt-1">
              Opfyldt: {fantasy.fulfilled_date}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🌌 Fantasier</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          ➕ Tilføj
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: 'all', name: 'Alle' }, ...fantasyCategories].map((cat, idx) => (
          <TagBadge
            key={cat.id ?? `cat-${idx}`}
            label={cat.name}
            onClick={() =>
              setFilterCategory(cat.name === 'Alle' ? null : cat.name)
            }
            color={
              filterCategory === (cat.name === 'Alle' ? null : cat.name)
                ? 'primary'
                : 'gray'
            }
            className="cursor-pointer"
          />
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {fantasyStatuses.map(({ key, label }) => {
            const { setNodeRef } = useDroppable({ id: key });

            return (
              <div
                key={key}
                id={key}
                ref={setNodeRef}
                data-testid={`dropzone-${key}`}
                className="min-h-[300px] bg-muted/10 rounded-xl p-4 transition-all border-2 border-dashed border-transparent hover:border-primary"
              >
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  {label}{' '}
                  <span className="text-sm text-muted-foreground">
                    ({fantasyCountByStatus[key] || 0})
                  </span>
                </h2>
                {filteredFantasies
                  .filter((f) => f.status === key)
                  .map((fantasy) => (
                    <DraggableCard
                      key={fantasy.id}
                      fantasy={fantasy}
                      onView={() => setSelectedFantasy(fantasy)}
                      profileMap={profileMap}
                      xpMapStine={xpMapStine}
                      fantasyCategories={fantasyCategories}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </DndContext>

      {selectedFantasy && (
        <Modal
          title={selectedFantasy.title}
          onClose={() => setSelectedFantasy(null)}
          fantasy={selectedFantasy}
          newFantasy={newFantasyData}
          setNewFantasy={setNewFantasyData}
          readOnly={true}
          children={
            <button
              className="btn-primary mt-4"
              onClick={(e) => {
                e.stopPropagation();
                setEditingFantasy(selectedFantasy);
                setSelectedFantasy(null);
              }}
            >
              Redigér
            </button>
          }
        />
      )}

      {editingFantasy && (
        <Modal
          title="Redigér fantasi"
          onClose={() => setEditingFantasy(null)}
          fantasy={editingFantasy}
          newFantasy={newFantasyData}
          setNewFantasy={setNewFantasyData}
          onEdit={async (updated: Fantasy) => {
            const { error } = await supabase
              .from('fantasies')
              .update({
                title: updated.title,
                description: updated.description,
                category: updated.category,
                effort: updated.effort,
                image_url: updated.image_url,
                extra_images: updated.extra_images,
                status: updated.status,
              })
              .eq('id', updated.id);

            if (error) {
              console.error('Fejl ved opdatering:', error.message);
            }
            setEditingFantasy(null);
          }}
          onDelete={async (id: string) => {
            await handleDeleteFantasy(id);
            setEditingFantasy(null);
          }}
        />
      )}

      {showAddModal && (
        <Modal
          isCreateMode
          title="Tilføj ny fantasi"
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreateNewFantasy}
          newFantasy={newFantasyData}
          setNewFantasy={setNewFantasyData}
        />
      )}
    </div>
  );
}
