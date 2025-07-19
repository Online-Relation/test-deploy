// /components/BucketNotes.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  getBucketNotes,
  addBucketNote,
  updateBucketNote,
  deleteBucketNote
} from '@/lib/bucketHistoryApi';
import { useUser } from '@supabase/auth-helpers-react';

export default function BucketNotes({ bucketId }: { bucketId: string }) {
  const user = useUser();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!bucketId) return;
    setLoading(true);
    getBucketNotes(bucketId)
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [bucketId]);

const handleAdd = async () => {
  const myUserId = user?.id || "190a3151-97bc-43be-9daf-1f3b3062f97f";
  console.log("PRØVER AT INDSÆTTE", {bucketId, note, userId: myUserId});

  if (!note.trim() || !bucketId) {
    console.log("No bucketId or empty note", { note, bucketId });
    return;
  }
  setLoading(true);
  try {
    await addBucketNote(bucketId, note, myUserId);
    setNote('');
    setNotes(await getBucketNotes(bucketId));
  } catch (err) {
    console.error("Fejl ved tilføj notat:", err);
  }
  setLoading(false);
};



  const handleDelete = async (id: string) => {
    setLoading(true);
    await deleteBucketNote(id);
    setNotes(await getBucketNotes(bucketId));
    setLoading(false);
  };

  const handleEdit = async (id: string) => {
    if (!editText.trim()) return;
    setLoading(true);
    await updateBucketNote(id, editText);
    setEditingId(null);
    setEditText('');
    setNotes(await getBucketNotes(bucketId));
    setLoading(false);
  };

  return (
  <div className="mt-4">
    <h3 className="font-semibold mb-2">Historik / Noter</h3>
    {/* Responsive input + knap */}
    <div className="flex flex-col sm:flex-row gap-2 mb-2">
      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        className="flex-1 border rounded px-2 py-1"
        placeholder="Tilføj notat…"
        disabled={loading}
      />
      <button
        onClick={handleAdd}
        className="btn btn-primary w-full sm:w-auto"
        disabled={loading || !note.trim()}
      >
        Tilføj
      </button>
    </div>
    <ul className="space-y-2">
      {notes.map(n =>
        editingId === n.id ? (
          <li key={n.id} className="flex gap-2 items-center">
            <input
              type="text"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="flex-1 border rounded px-2 py-1"
            />
            <button className="btn btn-xs btn-primary" onClick={() => handleEdit(n.id)} disabled={loading}>
              Gem
            </button>
            <button className="btn btn-xs btn-outline" onClick={() => setEditingId(null)}>
              Annullér
            </button>
          </li>
        ) : (
          <li key={n.id} className="flex gap-2 items-center">
            <span className="flex-1 text-sm">{n.note}</span>
            <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
            {user?.id === n.created_by && (
              <>
                <button className="btn btn-xs btn-outline" onClick={() => { setEditingId(n.id); setEditText(n.note); }}>
                  Rediger
                </button>
                <button className="btn btn-xs btn-destructive" onClick={() => handleDelete(n.id)}>
                  Slet
                </button>
              </>
            )}
          </li>
        )
      )}
      {notes.length === 0 && <li className="text-xs text-gray-500">Ingen noter endnu.</li>}
    </ul>
  </div>
);
}
