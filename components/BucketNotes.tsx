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
    .then(data => {
      console.log("DEBUG notes (fra getBucketNotes):", data);
      setNotes(data);
    })
    .finally(() => setLoading(false));
}, [bucketId]);


  const handleAdd = async () => {
    const myUserId = user?.id || "190a3151-97bc-43be-9daf-1f3b3062f97f";
    if (!note.trim() || !bucketId) return;
    setLoading(true);
    try {
      await addBucketNote(bucketId, note, myUserId);
      setNote('');
      const updatedNotes = await getBucketNotes(bucketId);
      console.log("DEBUG after add:", updatedNotes);
      setNotes(updatedNotes);
    } catch (err) {
      console.error("Fejl ved tilføj notat:", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    await deleteBucketNote(id);
    const updatedNotes = await getBucketNotes(bucketId);
    console.log("DEBUG after delete:", updatedNotes);
    setNotes(updatedNotes);
    setLoading(false);
  };

  const handleEdit = async (id: string) => {
    if (!editText.trim()) return;
    setLoading(true);
    await updateBucketNote(id, editText);
    setEditingId(null);
    setEditText('');
    const updatedNotes = await getBucketNotes(bucketId);
    console.log("DEBUG after edit:", updatedNotes);
    setNotes(updatedNotes);
    setLoading(false);
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2 text-primary">Historik / Noter</h3>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          className="flex-1 border rounded px-2 py-1 min-h-[80px]"
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
      <ul className="space-y-4">
        {notes.map(n => {
          const isEditing = editingId === n.id;
          const isOwnNote = user?.id === n.created_by;
          const profile = n.profiles || {};
          console.log("DEBUG note:", n);
          return (
            <li key={n.id} className="flex gap-3 items-start">
              <img
                src={profile.avatar_url || 'https://ui-avatars.com/api/?name=Ukendt'}
                alt={profile.display_name || 'Profil'}
                className="w-10 h-10 rounded-full object-cover mt-1"
              />
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-medium text-gray-800 mr-2">{profile.display_name || 'Ukendt'}</span>
                  <span className="text-xs">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="flex-1 border rounded px-2 py-1 min-h-[60px]"
                    />
                    <div className="flex flex-col gap-1">
                      <button className="btn btn-xs btn-primary" onClick={() => handleEdit(n.id)} disabled={loading}>
                        Gem
                      </button>
                      <button className="btn btn-xs btn-outline" onClick={() => setEditingId(null)}>
                        Annullér
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-sm whitespace-pre-wrap">{n.note}</span>
                    {isOwnNote && (
                      <div className="flex flex-col gap-1 ml-2">
                        <button className="btn btn-xs btn-outline" onClick={() => { setEditingId(n.id); setEditText(n.note); }}>
                          Rediger
                        </button>
                        <button className="btn btn-xs btn-destructive" onClick={() => handleDelete(n.id)}>
                          Slet
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {notes.length === 0 && <li className="text-xs text-gray-500">Ingen noter endnu.</li>}
      </ul>
    </div>
  );
}
