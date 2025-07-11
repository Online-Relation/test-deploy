'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RichTextEditor from '@/components/ui/RichTextEditor';

type Subgoal = {
  id: string;
  title: string;
  done: boolean;
  deadline?: string | null;
};

type Manifestation = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  subgoals: Subgoal[];
};

function formatDeadline(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-2 mt-1">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function ManifestationCard({
  card,
  onClick,
  onToggleSubgoal,
}: {
  card: Manifestation;
  onClick: () => void;
  onToggleSubgoal: (subgoal: Subgoal) => void;
}) {
  const doneCount = card.subgoals.filter((sg) => sg.done).length;
  const totalCount = card.subgoals.length;

  return (
    <div
      className="rounded-xl bg-white shadow p-0 cursor-pointer flex flex-col border border-gray-100 hover:shadow-lg transition"
      onClick={onClick}
    >
      {card.image_url ? (
        <img
          src={card.image_url}
          alt={card.title}
          className="w-full h-36 object-cover rounded-t-xl"
        />
      ) : (
        <div className="w-full h-36 bg-gray-200 rounded-t-xl" />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-1">{card.title}</h3>
        <div
          className="text-gray-600 text-sm line-clamp-2 mb-2"
          dangerouslySetInnerHTML={{ __html: card.description }}
        />
        <div className="flex flex-col gap-1 mt-auto">
          <span className="text-xs font-semibold text-gray-500">Delmål:</span>
          <ul className="text-xs text-gray-700 list-disc pl-4">
            {card.subgoals.map((sg) => (
              <li key={sg.id} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={sg.done}
                  onChange={e => {
                    e.stopPropagation();
                    onToggleSubgoal(sg);
                  }}
                  className="accent-blue-500 cursor-default"
                  onClick={e => e.stopPropagation()}
                />
                <span className={sg.done ? "line-through" : ""}>{sg.title}</span>
                {sg.deadline && (
                  <span className="ml-1 text-[11px] text-blue-500">
                    ({formatDeadline(sg.deadline)})
                  </span>
                )}
              </li>
            ))}
          </ul>
          {/* Progress bar og afsluttet kun hvis der er delmål */}
          {totalCount > 0 && (
            <>
              <ProgressBar value={doneCount} max={totalCount} />
              <span className="text-xs text-gray-500">
                {doneCount} / {totalCount} afsluttet
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ManifestationModal({
  card,
  open,
  onClose,
  onEdited,
}: {
  card: Manifestation | null;
  open: boolean;
  onClose: () => void;
  onEdited: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card?.title || '');
  const [editDesc, setEditDesc] = useState(card?.description || '');
  const [newSubgoal, setNewSubgoal] = useState('');
  const [newSubgoalDeadline, setNewSubgoalDeadline] = useState('');
  const [subgoals, setSubgoals] = useState<Subgoal[]>([]);
  const [editingDeadlines, setEditingDeadlines] = useState<{ [id: string]: string }>({});
  

  useEffect(() => {
    if (!card) return;
    setEditTitle(card.title);
    setEditDesc(card.description);
    setEditing(false);
    setEditingDeadlines({});
    fetchSubgoals();
    // eslint-disable-next-line
  }, [card, open]);

  async function fetchSubgoals() {
    if (!card) return;
    const { data } = await supabase
      .from('manifestation_subgoals')
      .select('id, title, done, deadline')
      .eq('manifestation_id', card.id)
      .order('created_at', { ascending: true });
    setSubgoals(data || []);
  }

  const handleSave = async () => {
    await supabase
      .from('manifestations')
      .update({ title: editTitle, description: editDesc })
      .eq('id', card!.id);
    setEditing(false);
    onClose();
    onEdited();
  };

  const handleAddSubgoal = async () => {
    if (!newSubgoal.trim()) return;
    const { error } = await supabase.from('manifestation_subgoals').insert([
      {
        manifestation_id: card!.id,
        title: newSubgoal,
        done: false,
        deadline: newSubgoalDeadline || null,
      },
    ]);
    if (!error) {
      setNewSubgoal('');
      setNewSubgoalDeadline('');
      await fetchSubgoals();
      onEdited();
    } else {
      alert('Fejl ved oprettelse af delmål: ' + error.message);
    }
  };

  const handleDeleteSubgoal = async (subgoalId: string) => {
    await supabase.from('manifestation_subgoals').delete().eq('id', subgoalId);
    await fetchSubgoals();
    onEdited();
  };
  const handleToggleDone = async (subgoal: Subgoal) => {
    await supabase
      .from('manifestation_subgoals')
      .update({ done: !subgoal.done })
      .eq('id', subgoal.id);
    await fetchSubgoals();
    onEdited();
  };

  const handleDeadlineChange = (subgoalId: string, value: string) => {
    setEditingDeadlines({ ...editingDeadlines, [subgoalId]: value });
  };
  const handleSaveDeadline = async (subgoalId: string) => {
    const newDate = editingDeadlines[subgoalId];
    await supabase
      .from('manifestation_subgoals')
      .update({ deadline: newDate || null })
      .eq('id', subgoalId);
    setEditingDeadlines({ ...editingDeadlines, [subgoalId]: '' });
    await fetchSubgoals();
    onEdited();
  };

  if (!open || !card) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative flex flex-col min-h-[440px] max-h-[90vh] overflow-y-auto">

        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-black text-xl"
        >
          ×
        </button>
        {card.image_url && (
          <img
            src={card.image_url}
            alt={card.title}
            className="w-full h-40 object-cover rounded mb-4"
          />
        )}
        {editing ? (
          <>
            <input
              type="text"
              className="w-full border rounded px-2 py-1 mb-2"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
            />
            <RichTextEditor
              value={editDesc}
              onChange={val => setEditDesc(val)}
            />
            <div className="mt-4">
              <span className="font-semibold text-gray-700 text-sm mb-2 block">Delmål:</span>
              <ul className="mb-2">
                {subgoals.map((sg) => (
                  <li key={sg.id} className="flex items-center gap-2 text-sm py-1">
                    <span className={sg.done ? 'line-through' : ''}>{sg.title}</span>
                    <span className="text-xs text-blue-500">
                      {sg.deadline ? `(${formatDeadline(sg.deadline)})` : ''}
                    </span>
                    <input
                      type="date"
                      value={editingDeadlines[sg.id] ?? (sg.deadline ? sg.deadline.slice(0, 10) : '')}
                      onChange={e => handleDeadlineChange(sg.id, e.target.value)}
                      className="border rounded px-1 text-xs"
                      style={{ width: 120 }}
                    />
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => handleSaveDeadline(sg.id)}
                    >Gem</button>
                    <button
                      onClick={() => handleDeleteSubgoal(sg.id)}
                      className="text-xs text-red-500 hover:underline"
                    >Slet</button>
                    <button
                      onClick={() => handleToggleDone(sg)}
                      className="text-xs text-green-500 hover:underline"
                    >{sg.done ? 'Fortryd' : 'Afslut'}</button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nyt delmål"
                  value={newSubgoal}
                  onChange={e => setNewSubgoal(e.target.value)}
                  className="border px-2 py-1 rounded flex-1 text-sm"
                />
                <input
                  type="date"
                  value={newSubgoalDeadline}
                  onChange={e => setNewSubgoalDeadline(e.target.value)}
                  className="border px-2 py-1 rounded text-sm"
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddSubgoal}
                >Tilføj</button>
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={handleSave}
                className="btn btn-primary"
              >
                Gem ændringer
              </button>
              <button
                onClick={() => setEditing(false)}
                className="btn btn-outline"
              >
                Annuller
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-bold text-xl mb-2">{card.title}</h2>
            <div
              className="mb-4"
              dangerouslySetInnerHTML={{ __html: card.description }}
            />
            <span className="font-semibold text-gray-700 text-sm mb-2 block">Delmål:</span>
            <ul>
              {subgoals.map(sg => (
                <li key={sg.id} className="text-sm">
                  {sg.title}
                  {sg.deadline && (
                    <span className="ml-2 text-[11px] text-blue-500">({formatDeadline(sg.deadline)})</span>
                  )} {sg.done ? '✅' : ''}
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setEditing(true)}
                className="btn btn-outline"
              >
                Rediger
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- HOVEDKOMPONENT ----------

export default function ManifestationBoard() {
  const [cards, setCards] = useState<Manifestation[]>([]);
  const [modalCard, setModalCard] = useState<Manifestation | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Til oprettelse
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);

  async function fetchManifestations() {
    const { data: manifestations, error } = await supabase
      .from('manifestations')
      .select('id, title, description, image_url');

    if (error) {
      console.error('Fejl ved hentning:', error.message);
      return;
    }
    const { data: subgoals } = await supabase
      .from('manifestation_subgoals')
      .select('id, manifestation_id, title, done, deadline');

    const cardsWithSubgoals: Manifestation[] = (manifestations || []).map((manifest) => ({
      ...manifest,
      subgoals: (subgoals || []).filter(
        (sg) => sg.manifestation_id === manifest.id
      ),
    }));

    setCards(cardsWithSubgoals);
  }

  useEffect(() => {
    fetchManifestations();
  }, []);

  // Toggle done på subgoal
  const handleToggleSubgoal = async (subgoal: Subgoal) => {
    await supabase
      .from('manifestation_subgoals')
      .update({ done: !subgoal.done })
      .eq('id', subgoal.id);

    await fetchManifestations();
  };

async function handleCreateManifestation() {
  let imageUrl = '';
  if (newImage) {
    const fileExt = newImage.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase
      .storage
      .from('manifestation-images')
      .upload(fileName, newImage, { upsert: true });
    if (uploadError) {
      alert('Fejl ved billedupload: ' + uploadError.message);
      return;
    }
    const { publicUrl } = supabase.storage.from('manifestation-images').getPublicUrl(fileName).data;
    imageUrl = publicUrl;
  }

  const { data, error } = await supabase
    .from('manifestations')
    .insert([
      {
        title: newTitle,
        description: newDesc,
        image_url: imageUrl,
      },
    ])
    .select()
    .single();

  if (error) {
    alert('Fejl ved oprettelse: ' + error.message);
    return;
  }

  // --- NYT: indsæt tilsvarende i manifestation_points tabel ---
  if (data) {
    const { error: mpError } = await supabase
      .from('manifestation_points')
      .insert([
        {
          manifestation_id: data.id,
          title: newTitle,
          content: newDesc,
          remind_me: true, // eller false efter behov
        },
      ]);

    if (mpError) {
      console.error('Fejl ved indsættelse i manifestation_points:', mpError);
      // evt. vis alert her
    }
  }

  await fetchManifestations();
  setNewTitle('');
  setNewDesc('');
  setNewImage(null);
  setCreateOpen(false);
}


  return (
    <div className="w-full mx-auto px-0 sm:px-4 py-6" style={{ paddingLeft: '0px', paddingRight: '0px' }}>
      <h1 className="text-2xl font-bold mb-4 text-center sm:text-left flex items-center gap-2">
        <span role="img" aria-label="manifestation">🧭</span> Manifestation Board
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map(card => (
          <ManifestationCard
            key={card.id}
            card={card}
            onClick={() => setModalCard(card)}
            onToggleSubgoal={handleToggleSubgoal}
          />
        ))}
        {/* Tilføj-nyt kort */}
        <div
          onClick={() => setCreateOpen(true)}
          className="flex items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-gray-400 transition bg-white text-gray-500 font-bold"
        >
          + Ny manifestation
        </div>
      </div>

      {/* Modal til visning/redigering */}
      <ManifestationModal
        card={modalCard}
        open={!!modalCard}
        onClose={() => setModalCard(null)}
        onEdited={fetchManifestations}
      />

      {/* Modal til oprettelse */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setCreateOpen(false)}
              className="absolute right-3 top-3 text-gray-400 hover:text-black text-xl"
            >
              ×
            </button>
            <h2 className="font-bold text-xl mb-4">Ny manifestation</h2>
            <input
              type="text"
              placeholder="Titel"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
            />
            <textarea
              placeholder="Beskrivelse"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
            />
            <input
              type="file"
              accept="image/*"
              onChange={e => setNewImage(e.target.files?.[0] || null)}
              className="w-full border rounded px-3 py-2 mb-3"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setCreateOpen(false)} className="btn btn-outline">Annuller</button>
              <button onClick={handleCreateManifestation} className="btn btn-primary">Gem</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
