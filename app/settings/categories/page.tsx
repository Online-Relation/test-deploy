// /app/settings/categories/page.tsx

'use client';

import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X } from 'lucide-react';

type Entry = { id: string; name: string };

const colorClasses = [
  'bg-purple-100 text-purple-800',
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-pink-100 text-pink-800',
  'bg-red-100 text-red-800',
];

export default function CategoriesPage() {
  // State for each category type
  const [fantasyCategories, setFantasyCategories] = useState<Entry[]>([]);
  const [types, setTypes] = useState<Entry[]>([]);
  const [giftCategories, setGiftCategories] = useState<Entry[]>([]);
  const [bucketCategories, setBucketCategories] = useState<Entry[]>([]);
  const [tags, setTags] = useState<Entry[]>([]);

  // Inputs
  const [newFantasyCategory, setNewFantasyCategory] = useState('');
  const [newType, setNewType] = useState('');
  const [newGiftCategory, setNewGiftCategory] = useState('');
  const [newBucketCategory, setNewBucketCategory] = useState('');
  const [newTag, setNewTag] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [
      { data: fc },
      { data: tp },
      { data: gc },
      { data: bc },
      { data: tg }
    ] = await Promise.all([
      supabase.from('fantasy_categories').select('*'),
      supabase.from('fantasy_types').select('*'),
      supabase.from('gift_categories').select('*'),
      supabase.from('bucket_categories').select('*'),
      supabase.from('tags').select('*')
    ]);
    if (fc) setFantasyCategories(fc as Entry[]);
    if (tp) setTypes(tp as Entry[]);
    if (gc) setGiftCategories(gc as Entry[]);
    if (bc) setBucketCategories(bc as Entry[]);
    if (tg) setTags(tg as Entry[]);
  }

  async function addEntry(
    table: string,
    value: string,
    setList: Dispatch<SetStateAction<Entry[]>>,
    resetInput: Dispatch<SetStateAction<string>>
  ) {
    if (!value.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from(table).insert([{ name: value }]).select();
    if (error) console.error(`Error inserting into ${table}:`, error.message);
    else if (data) {
      setList(prev => [...prev, ...(data as Entry[])]);
      resetInput('');
    }
    setLoading(false);
  }

  async function deleteEntry(
    table: string,
    id: string,
    setList: Dispatch<SetStateAction<Entry[]>>
  ) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.error(`Error deleting from ${table}:`, error.message);
    else setList(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Kategorier, Typer og Tags</h1>

      {/* Fantasikategorier */}
      <Section
        title="Fantasikategorier"
        items={fantasyCategories}
        newValue={newFantasyCategory}
        onChange={setNewFantasyCategory}
        onAdd={() => addEntry('fantasy_categories', newFantasyCategory, setFantasyCategories, setNewFantasyCategory)}
        onDelete={id => deleteEntry('fantasy_categories', id, setFantasyCategories)}
      />

      {/* Gavetyper */}
      <Section
        title="Gavetyper"
        items={types}
        newValue={newType}
        onChange={setNewType}
        onAdd={() => addEntry('fantasy_types', newType, setTypes, setNewType)}
        onDelete={id => deleteEntry('fantasy_types', id, setTypes)}
      />

      {/* Gavekategorier */}
      <Section
        title="Gavekategorier"
        items={giftCategories}
        newValue={newGiftCategory}
        onChange={setNewGiftCategory}
        onAdd={() => addEntry('gift_categories', newGiftCategory, setGiftCategories, setNewGiftCategory)}
        onDelete={id => deleteEntry('gift_categories', id, setGiftCategories)}
      />

      {/* Bucketlist-kategorier */}
      <Section
        title="Bucketlist-kategorier"
        items={bucketCategories}
        newValue={newBucketCategory}
        onChange={setNewBucketCategory}
        onAdd={() => addEntry('bucket_categories', newBucketCategory, setBucketCategories, setNewBucketCategory)}
        onDelete={id => deleteEntry('bucket_categories', id, setBucketCategories)}
      />

      {/* Tags */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Tags</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Ny tag (fx romantisk, overraskelse)"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            className="flex-grow px-4 py-2 border rounded"
          />
          <button
            onClick={() => addEntry('tags', newTag, setTags, setNewTag)}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Tilføj
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <span
              key={tag.id}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClasses[idx % colorClasses.length]}`}
            >
              {tag.name}
              <button
                onClick={() => deleteEntry('tags', tag.id, setTags)}
                className="ml-2 text-black hover:text-red-600"
                title="Slet tag"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Genbrugelig sektion-komponent
function Section({
  title,
  items,
  newValue,
  onChange,
  onAdd,
  onDelete
}: {
  title: string;
  items: Entry[];
  newValue: string;
  onChange: Dispatch<SetStateAction<string>>;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder={`Ny ${title.toLowerCase()}`}
          value={newValue}
          onChange={e => onChange(e.target.value)}
          className="flex-grow px-4 py-2 border rounded"
        />
        <button
          onClick={onAdd}
          disabled={false}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Tilføj
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={item.id}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClasses[idx % colorClasses.length]}`}
          >
            {item.name}
            <button
              onClick={() => onDelete(item.id)}
              className="ml-2 text-black hover:text-red-600"
              title={`Slet ${title.toLowerCase()}`}
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
