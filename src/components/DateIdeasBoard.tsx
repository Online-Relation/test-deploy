'use client';

import { useCategory } from '@/context/CategoryContext';
import { useEffect, useState } from 'react';
import { useXp } from '@/context/XpContext';
import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from '@dnd-kit/core';

const costLevels = ['Free', '$', '$$', '$$$'];
const effortLevels = ['Low', 'Medium', 'High'];

const dateStatuses = [
  { key: 'new', label: 'New Ideas' },
  { key: 'next', label: 'Next Adventures' },
  { key: 'memory', label: 'Memories' },
];

type DateIdea = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
  cost?: string;
  effort?: string;
  status: 'new' | 'next' | 'memory';
  xpGranted?: boolean;
};

function DraggableCard({ idea, onView, onEdit }: { idea: DateIdea; onView: () => void; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: idea.id });
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const truncate = (str: string, n: number) =>
    str.length > n ? str.substring(0, n).trimEnd() + '…' : str;

  return (
    <div ref={setNodeRef} style={style} className="bg-white shadow mb-4 rounded border relative">
      <div className="absolute top-2 right-2 flex space-x-2">
        <button onClick={onEdit} className="text-gray-500 hover:text-blue-600">✏️</button>
        <button {...listeners} {...attributes} className="cursor-grab text-gray-400 hover:text-gray-700">⠿</button>
      </div>
      <div className="px-4 pt-6 pb-4 cursor-pointer" onClick={onView}>
        {idea.imageUrl && <img src={idea.imageUrl} alt={idea.title} className="w-full h-32 object-cover rounded mb-2" />}
        <h3 className="font-bold text-md mb-1">{idea.title}</h3>
        <p className="text-sm text-gray-600 mb-1">{truncate(idea.description, 100)}</p>
        <div className="text-xs text-blue-600 font-semibold">{idea.category} · {idea.cost} · {idea.effort}</div>
      </div>
    </div>
  );
}

function DroppableColumn({ status, ideas, onCardClick, onEdit }: { status: string; ideas: DateIdea[]; onCardClick: (f: DateIdea) => void; onEdit: (f: DateIdea) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} style={{ backgroundColor: isOver ? '#e0f2fe' : undefined }} className="bg-gray-50 p-4 rounded shadow min-h-[300px]">
      <h2 className="text-xl font-semibold mb-4">{dateStatuses.find(s => s.key === status)?.label || status}</h2>
      {ideas.map((idea) => (
        <DraggableCard key={idea.id} idea={idea} onView={() => onCardClick(idea)} onEdit={() => onEdit(idea)} />
      ))}
    </div>
  );
}

export default function DateIdeasBoard() {
  const { dateCategories } = useCategory();
  const { addXp } = useXp();

  const [ideas, setIdeas] = useState<DateIdea[]>([]);
  const [newIdea, setNewIdea] = useState<Omit<DateIdea, 'id'>>({
    title: '', description: '', imageUrl: '', category: '', cost: '', effort: '', status: 'new'
  });
  const [editingIdea, setEditingIdea] = useState<DateIdea | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<DateIdea | null>(null);
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('dateIdeas');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setIdeas(parsed);
      } catch (e) {
        console.error('Kunne ikke parse dateIdeas:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (ideas.length > 0) {
      localStorage.setItem('dateIdeas', JSON.stringify(ideas));
    }
  }, [ideas]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    setIdeas((prev) => {
      let shouldGrantXp = false;
      const updated: DateIdea[] = prev.map((idea) => {
        if (idea.id === active.id) {
          const movedToMemory = over.id === 'memory' && idea.status !== 'memory';
          if (movedToMemory && !idea.xpGranted) {
            shouldGrantXp = true;
            return { ...idea, status: 'memory', xpGranted: true };
          }
          return { ...idea, status: over.id as DateIdea['status'] };
        }
        return idea;
      });
      localStorage.setItem('dateIdeas', JSON.stringify(updated));
      if (shouldGrantXp) setTimeout(() => addXp(10), 0);
      return updated;
    });
  };

  const addIdea = () => {
    if (!newIdea.title.trim()) return;
    const idea: DateIdea = {
      id: crypto.randomUUID(),
      ...newIdea,
      xpGranted: false,
    };
    const updated = [...ideas, idea];
    setIdeas(updated);
    setTimeout(() => addXp(5), 0);
    setNewIdea({ title: '', description: '', imageUrl: '', category: '', cost: '', effort: '', status: 'new' });
  };

  const updateIdea = () => {
    if (!editingIdea) return;
    const updated = ideas.map((idea) => (idea.id === editingIdea.id ? editingIdea : idea));
    setIdeas(updated);
    setEditingIdea(null);
  };

  const deleteIdea = (id: string) => {
    const updated = ideas.filter((idea) => idea.id !== id);
    setIdeas(updated);
    setEditingIdea(null);
  };

  return (
    <div className="max-w-7xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">💘 Date Ideas</h1>

      <div className="mb-6">
        <label className="block mb-2 font-medium">Filtrér efter kategori:</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full px-3 py-2 border rounded text-black bg-white"
        >
          <option value="">Vis alle</option>
          {dateCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {dateStatuses.map(({ key }) => (
            <DroppableColumn
              key={key}
              status={key}
              ideas={ideas.filter(i => i.status === key && (!filterCategory || i.category === filterCategory))}
              onCardClick={setSelectedIdea}
              onEdit={setEditingIdea}
            />
          ))}
        </div>
      </DndContext>

      <div className="bg-gray-100 p-4 rounded shadow">
        <h2 className="font-semibold mb-2">➕ Tilføj ny idé</h2>
        <input
          type="text"
          placeholder="Titel"
          value={newIdea.title}
          onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
          className="w-full mb-2 px-3 py-2 border rounded text-black bg-white"
        />
        <textarea
          placeholder="Beskrivelse"
          value={newIdea.description}
          onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
          className="w-full mb-2 px-3 py-2 border rounded text-black bg-white"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onloadend = () => setNewIdea({ ...newIdea, imageUrl: reader.result as string });
            reader.readAsDataURL(file);
          }}
          className="w-full mb-2"
        />
        <select
          value={newIdea.category}
          onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value })}
          className="w-full mb-2 px-3 py-2 border rounded text-black bg-white"
        >
          <option value="">Vælg kategori</option>
          {dateCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={newIdea.cost}
          onChange={(e) => setNewIdea({ ...newIdea, cost: e.target.value })}
          className="w-full mb-2 px-3 py-2 border rounded text-black bg-white"
        >
          <option value="">Vælg prisniveau</option>
          {costLevels.map((cost) => (
            <option key={cost} value={cost}>{cost}</option>
          ))}
        </select>
        <select
          value={newIdea.effort}
          onChange={(e) => setNewIdea({ ...newIdea, effort: e.target.value })}
          className="w-full mb-4 px-3 py-2 border rounded text-black bg-white"
        >
          <option value="">Vælg effort</option>
          {effortLevels.map((eff) => (
            <option key={eff} value={eff}>{eff}</option>
          ))}
        </select>
        <button
          onClick={addIdea}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Tilføj idé
        </button>
      </div>

      {editingIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full relative">
            <button
              onClick={() => setEditingIdea(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black"
            >✕</button>
            <h2 className="text-xl font-bold mb-4">Redigér idé</h2>
            <input
              type="text"
              value={editingIdea.title}
              onChange={(e) => setEditingIdea({ ...editingIdea, title: e.target.value })}
              className="w-full mb-2 px-3 py-2 border rounded text-black bg-white"
            />
            <textarea
              value={editingIdea.description}
              onChange={(e) => setEditingIdea({ ...editingIdea, description: e.target.value })}
              className="w-full mb-2 px-3 py-2 border rounded text-black bg-white"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => setEditingIdea({ ...editingIdea, imageUrl: reader.result as string });
                reader.readAsDataURL(file);
              }}
              className="w-full mb-2"
            />
            <select
              value={editingIdea.category}
              onChange={(e) => setEditingIdea({ ...editingIdea, category: e.target.value })}
              className="w-full mb-2 px-3 py-2 border rounded text-black bg-white"
            >
              <option value="">Vælg kategori</option>
              {dateCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={editingIdea.cost}
              onChange={(e) => setEditingIdea({ ...editingIdea, cost: e.target.value })}
              className="w-full mb-2 px-3 py-2 border rounded text-black bg-white"
            >
              <option value="">Vælg prisniveau</option>
              {costLevels.map((cost) => (
                <option key={cost} value={cost}>{cost}</option>
              ))}
            </select>
            <select
              value={editingIdea.effort}
              onChange={(e) => setEditingIdea({ ...editingIdea, effort: e.target.value })}
              className="w-full mb-4 px-3 py-2 border rounded text-black bg-white"
            >
              <option value="">Vælg effort</option>
              {effortLevels.map((eff) => (
                <option key={eff} value={eff}>{eff}</option>
              ))}
            </select>
            <button
              onClick={() => deleteIdea(editingIdea.id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mr-2"
            >🗑️ Slet</button>
            <button
              onClick={updateIdea}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >Gem ændringer</button>
          </div>
        </div>
      )}

      {selectedIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full relative">
            <button
              onClick={() => setSelectedIdea(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black"
            >✕</button>
            <h2 className="text-xl font-bold mb-4">{selectedIdea.title}</h2>
            {selectedIdea.imageUrl && (
              <img src={selectedIdea.imageUrl} alt="" className="mb-3 rounded w-full h-40 object-cover" />
            )}
            <p className="mb-2 text-gray-700">{selectedIdea.description}</p>
            <div className="text-sm text-blue-600 font-semibold">
              {selectedIdea.category} · {selectedIdea.cost} · {selectedIdea.effort}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
