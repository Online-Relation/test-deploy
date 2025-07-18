"use client";
import { useCategory } from "@/context/CategoryContext";
import { supabase } from "@/lib/supabaseClient";
import { rectIntersection } from "@dnd-kit/core";
import useDateBoardLogic, { CategoryEntry } from "@/hooks/useDateBoardLogic";
import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { Tag, Calendar, AlertCircle, ImageIcon } from "lucide-react";
import Modal from "@/components/ui/modal";
import { TagBadge } from "@/components/ui/TagBadge";
import { useState, useEffect } from "react";

const dateStatuses = [
  { key: "idea", label: "Ideer" },
  { key: "planned", label: "Planlagt" },
  { key: "fulfilled", label: "Opfyldt" },
] as const;

const colorClasses = ["purple", "blue", "green", "yellow", "pink", "red"] as const;
type AllowedColors = typeof colorClasses[number] | "gray";

function CategoryDropdown({ value, setValue }: { value: string; setValue: (v: string) => void }) {
  const { dateCategories, refreshCategories } = useCategory();
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { data, error } = await supabase
      .from("date_categories")
      .insert([{ name: newCategoryName.trim() }])
      .select();
    if (!error && data?.length) {
      await refreshCategories();
      setValue(data[0].name);
      setShowNewCat(false);
      setNewCategoryName("");
    }
  };

  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium">Kategori</label>
      <select
        className="w-full p-2 border rounded"
        value={showNewCat ? "__new__" : value || ""}
        onChange={(e) => {
          if (e.target.value === "__new__") {
            setShowNewCat(true);
          } else {
            setValue(e.target.value);
            setShowNewCat(false);
          }
        }}
      >
        <option value="">Vælg kategori</option>
        {dateCategories.map((cat) => (
          <option key={cat.id} value={cat.name}>
            {cat.name}
          </option>
        ))}
        <option value="__new__">+ Opret ny kategori</option>
      </select>
      {showNewCat && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            className="flex-1 border rounded p-2"
            placeholder="Ny kategori"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button type="button" className="btn-primary" onClick={handleCreateCategory}>
            Gem
          </button>
          <button type="button" className="btn-secondary" onClick={() => setShowNewCat(false)}>
            Annuller
          </button>
        </div>
      )}
    </div>
  );
}

// -------------------------
// *** VIGTIGSTE RETTELSE HER: ***
function toSnakeCase(date: any) {
  return {
    title: date.title,
    description: date.description,
    category: date.category,
    image_url: date.imageUrl,
    extra_images: Array.isArray(date.extra_images) ? date.extra_images : [],
    gallery_images: Array.isArray(date.gallery_images) ? date.gallery_images : [],
    planned_date: date.planned_date,
    fulfilled_date: date.fulfilled_date,
    created_date: date.created_date,
    status: date.status,
  };
}
// -------------------------

function renderModalContent(newDate: any, setNewDate: any) {
  return (
    <>
      <CategoryDropdown
        value={newDate.category || ""}
        setValue={(v) => setNewDate((prev: any) => ({ ...prev, category: v }))}
      />
      {/* Flere felter kan tilføjes her */}
    </>
  );
}

export default function DateBoard() {
  const { dateCategories } = useCategory();
  const [selectedDate, setSelectedDate] = useState<any | null>(null);
  const [editingDate, setEditingDate] = useState<any | null>(null);

  const {
    dates,
    profileMap,
    filterCategory,
    showAddModal,
    newDateData,
    setFilterCategory,
    setShowAddModal,
    setNewDateData,
    handleCreateNewDate,
    handleDeleteDate,
    handleDragEnd,
  } = useDateBoardLogic();

  // Sikrer at gallery_images og extra_images ALTID er arrays ved init og ny date!
  useEffect(() => {
    if (showAddModal) {
      setNewDateData((prev: any) => ({
        ...prev,
        gallery_images: prev.gallery_images ?? [],
        extra_images: prev.extra_images ?? [],
      }));
    }
  }, [showAddModal, setNewDateData]);

  useEffect(() => {
    // console.log("[DateBoard] dates updated:", dates);
  }, [dates]);

  const filteredDates = filterCategory
    ? dates.filter((d: any) => d.category === filterCategory)
    : dates;

  const onDragEnd = async (event: any) => {
    await handleDragEnd(event);
  };

  const sensors = useSensors(useSensor(PointerSensor));

  function DraggableCard({
    date,
    onView,
    profileMap,
    dateCategories,
  }: {
    date: any;
    onView: () => void;
    profileMap: any;
    dateCategories: CategoryEntry[];
  }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: date.id,
    });

    const style = {
      transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      opacity: isDragging ? 0.5 : 1,
    };

    const idx =
      date.category && Array.isArray(dateCategories)
        ? dateCategories.findIndex((cat) => cat.name === date.category)
        : -1;
    const categoryColor: AllowedColors = idx >= 0 ? colorClasses[idx % colorClasses.length] : "gray";

    const isMissingDescription =
      !date.description || date.description.trim() === "" || date.description === "<p><br></p>";

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

        {date.image_url && (
          <img src={date.image_url} alt={date.title} className="w-full h-56 object-cover rounded-t-xl" />
        )}

        {isMissingDescription && (
          <div
            className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1 z-10"
            title="Manglende beskrivelse"
          >
            <AlertCircle size={16} />
          </div>
        )}

        {date.extra_images && date.extra_images.length > 0 && (
          <div
            className="absolute top-2 left-10 bg-blue-600 text-white rounded-full px-2 py-1 text-xs flex items-center gap-1 z-10"
            title="Ekstra billeder"
          >
            <ImageIcon size={14} /> {date.extra_images.length}
          </div>
        )}

        <div className="p-5 space-y-1">
          <h3 className="font-semibold text-lg text-foreground">{date.title}</h3>
          {date.created_date && (
            <div className="text-xs text-muted-foreground">Tilføjet: {date.created_date}</div>
          )}
          {date.planned_date && (
            <div className="text-xs text-muted-foreground">Planlagt: {date.planned_date}</div>
          )}

          <div
            className="text-sm text-muted-foreground prose max-w-none line-clamp-5"
            dangerouslySetInnerHTML={{ __html: date.description }}
          />

          <div className="flex flex-wrap gap-2 text-xs font-medium mt-2">
            {date.category && (
              <TagBadge label={date.category} icon={<Tag size={14} />} color={categoryColor} />
            )}
            {date.date && <TagBadge label={date.date} icon={<Calendar size={14} />} color="blue" />}
            {date.user_id && profileMap[date.user_id] && (
              <TagBadge label={profileMap[date.user_id]} color="gray" />
            )}
          </div>

          {date.fulfilled_date && (
            <div className="text-xs text-muted-foreground mt-1">Opfyldt: {date.fulfilled_date}</div>
          )}
        </div>
      </div>
    );
  }

  function DateModal(props: {
    title: string;
    onClose: () => void;
    date?: any;
    newDate: any;
    setNewDate: React.Dispatch<React.SetStateAction<any>>;
    readOnly?: boolean;
    children?: React.ReactNode;
    onEdit?: (updated: any) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    isCreateMode?: boolean;
    onCreate?: (date: any) => Promise<void>;
  }) {
    const {
      title,
      onClose,
      date,
      newDate,
      setNewDate,
      readOnly,
      children,
      onEdit,
      onDelete,
      isCreateMode,
      onCreate,
    } = props;

    return (
      <Modal
        title={title}
        onClose={onClose}
        readOnly={readOnly}
        onEdit={onEdit}
        onDelete={onDelete}
        isCreateMode={isCreateMode}
        onCreate={onCreate}
        newDate={newDate}
        setNewDate={setNewDate}
        date={date}
      >
        {children}
      </Modal>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">💖 Dates</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          ➕ Tilføj
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: "all", name: "Alle" }, ...dateCategories].map((cat, idx) => (
          <TagBadge
            key={cat.id ?? `cat-${idx}`}
            label={cat.name}
            onClick={() => setFilterCategory(cat.name === "Alle" ? null : cat.name)}
            color={filterCategory === (cat.name === "Alle" ? null : cat.name) ? "primary" : "gray"}
            className="cursor-pointer"
          />
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {dateStatuses.map(({ key }) => {
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
                  {dateStatuses.find((s) => s.key === key)?.label || key}
                </h2>
                {filteredDates
                  .filter((d: any) => d.status === key)
                  .map((date: any) => (
                    <DraggableCard
                      key={date.id}
                      date={date}
                      onView={() => setSelectedDate(date)}
                      profileMap={profileMap}
                      dateCategories={dateCategories}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </DndContext>

      {selectedDate && (
        <DateModal
          title={selectedDate.title}
          onClose={() => setSelectedDate(null)}
          date={selectedDate}
          newDate={newDateData}
          setNewDate={setNewDateData}
          readOnly={true}
        >
          <button
            className="btn-primary mt-4"
            onClick={(e) => {
              e.stopPropagation();
              setEditingDate(selectedDate);
              setSelectedDate(null);
            }}
          >
            Redigér
          </button>
        </DateModal>
      )}

      {editingDate && (
        <DateModal
          title="Redigér date"
          onClose={() => setEditingDate(null)}
          date={editingDate}
          newDate={newDateData}
          setNewDate={setNewDateData}
          onEdit={async (updated: any) => {
            const updateObj = toSnakeCase(updated);
            const { error } = await supabase
              .from("modal_objects")
              .update(updateObj)
              .eq("id", updated.id);

            if (error) {
              console.error("[DateBoard] Fejl ved opdatering:", error.message);
            }
            setEditingDate(null);
          }}
          onDelete={async (id: string) => {
            await handleDeleteDate(id);
            setEditingDate(null);
          }}
        >
          {renderModalContent(newDateData, setNewDateData)}
        </DateModal>
      )}

      {showAddModal && (
        <DateModal
          isCreateMode
          title="Tilføj ny date"
          onClose={() => setShowAddModal(false)}
          onCreate={async (newDate: any) => {
            // Garanter altid arrays i insert-objekt
            const createObj = toSnakeCase({
              ...newDate,
              gallery_images: newDate.gallery_images ?? [],
              extra_images: newDate.extra_images ?? [],
            });
            await handleCreateNewDate(createObj);
          }}
          newDate={newDateData}
          setNewDate={setNewDateData}
        >
          {renderModalContent(newDateData, setNewDateData)}
        </DateModal>
      )}
    </div>
  );
}
