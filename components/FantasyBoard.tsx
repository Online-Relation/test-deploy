// components/FantasyBoard.tsx
'use client';

import { useCategory } from '@/context/CategoryContext';
import { useXp } from '@/context/XpContext';
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
} from '@dnd-kit/core';
import { Tag, Zap, Star } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { TagBadge } from '@/components/ui/TagBadge';

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

  const {
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
  } = useFantasyBoardLogic();

  // Konverter rå categories til { id, name }
  const fantasyCategories: CategoryEntry[] = rawCategories.map((cat) =>
    typeof cat === 'string' ? { id: cat, name: cat } : cat
  );

  const filteredFantasies = filterCategory
    ? fantasies.filter((f) => f.category === filterCategory)
    : fantasies;

  // DnD: wrapper der kalder handleDragEnd fra hook
  const onDragEnd = async (event: any) => {
    await handleDragEnd(event);
  };

  // Dette er ren layout-kode: Ingen Supabase eller user direkte her
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
      fantasy.effort === 'Low'
        ? 'green'
        : fantasy.effort === 'Medium'
        ? 'yellow'
        : 'red';

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
}
 else if (fantasy.status === 'planned') {
        const xpVal = xpMapStine[`complete_fantasy_${effLower}`] || 0;
        if (xpVal > 0) pointLabel = `Fuldfør: +${xpVal} XP`;
      }
    }

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
          <h3 className="font-semibold text-lg text-foreground">
            {fantasy.title}
          </h3>
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
            {fantasy.user_id && profileMap[fantasy.user_id] && (
              <TagBadge
                label={profileMap[fantasy.user_id]}
                color="gray"
              />
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

  function DroppableColumn({
    status,
    fantasies,
    onCardClick,
    profileMap,
    xpMapStine,
    fantasyCategories,
  }: {
    status: string;
    fantasies: Fantasy[];
    onCardClick: (f: Fantasy) => void;
    profileMap: ProfileMap;
    xpMapStine: XpMap;
    fantasyCategories: CategoryEntry[];
  }) {
    const { isOver, setNodeRef } = useDroppable({ id: status });

    return (
      <div
        ref={setNodeRef}
        className={`p-4 rounded shadow min-h-[300px] transition-colors ${
          isOver ? 'bg-primary/10' : 'bg-muted'
        }`}
      >
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          {fantasyStatuses.find((s) => s.key === status)?.label || status}
        </h2>
        {fantasies.map((fantasy) => (
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

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {fantasyStatuses.map(({ key }) => (
            <DroppableColumn
              key={key}
              status={key}
              fantasies={filteredFantasies.filter((f) => f.status === key)}
              onCardClick={(f) => setSelectedFantasy(f)}
              profileMap={profileMap}
              xpMapStine={xpMapStine}
              fantasyCategories={fantasyCategories}
            />
          ))}
        </div>
      </DndContext>

      {showAddModal && (
        <Modal
          isCreateMode
          title="Tilføj ny fantasi"
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreateNewFantasy}
          newFantasy={newFantasyData}
          setNewFantasy={(f) => setNewFantasyData(f)}
        />
      )}

      {selectedFantasy && (
        <Modal
          fantasy={selectedFantasy}
          onClose={() => setSelectedFantasy(null)}
          onEdit={async (updated) => {
            setSelectedFantasy(null);
          }}
          onDelete={async (id) => {
            await handleDeleteFantasy(id);
          }}
        />
      )}
    </div>
  );
}
