// /app/sex/positions/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { supabase } from '@/lib/supabaseClient';

type SexPosition = {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
  status?: 'ny' | 'prøvet' | 'afvist';
  tried_count?: number;
};

export default function SexPositionsPage() {
  const [positions, setPositions] = useState<SexPosition[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activePosition, setActivePosition] = useState<SexPosition | null>(null);

  // Felter til rediger/opret
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ny' | 'prøvet' | 'afvist'>('ny');
  const [triedCount, setTriedCount] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Hent stillinger på load
  useEffect(() => {
    loadPositions();
  }, []);

  async function loadPositions() {
    const { data } = await supabase
      .from('sex_positions')
      .select('id, name, image_url, description, status, tried_count')
      .order('name');
    if (data) setPositions(data);
  }

  // Åben modal i visningstilstand
  function openModalView(pos: SexPosition) {
    setActivePosition(pos);
    setEditMode(false);
    setOpen(true);
    setName(pos.name || '');
    setDescription(pos.description || '');
    setStatus(pos.status || 'ny');
    setTriedCount(pos.tried_count || 0);
    setImageUrl(pos.image_url || '');
    setImageFile(null);
  }

  // Åben modal til rediger/opret
  function openModalEdit(pos?: SexPosition) {
    setEditMode(true);
    setOpen(true);
    if (pos) {
      setActivePosition(pos);
      setName(pos.name || '');
      setDescription(pos.description || '');
      setStatus(pos.status || 'ny');
      setTriedCount(pos.tried_count || 0);
      setImageUrl(pos.image_url || '');
      setImageFile(null);
    } else {
      setActivePosition(null);
      setName('');
      setDescription('');
      setStatus('ny');
      setTriedCount(0);
      setImageUrl('');
      setImageFile(null);
    }
  }

  // Gem redigering eller ny stilling
  async function handleSave() {
    let uploadedUrl = imageUrl;
    if (imageFile) {
      setUploading(true);
      const ext = imageFile.name.split('.').pop();
      const fileName = `${activePosition?.id || Date.now()}.${ext}`;
      const { error } = await supabase
        .storage
        .from('sex-positions-images')
        .upload(fileName, imageFile, { upsert: true });
      if (!error) {
        const { publicUrl } = supabase
          .storage
          .from('sex-positions-images')
          .getPublicUrl(fileName).data;
        uploadedUrl = publicUrl;
      }
      setUploading(false);
    }

    if (activePosition) {
      await supabase.from('sex_positions').update({
        name: name.trim(),
        description: description.trim(),
        status,
        tried_count: triedCount,
        image_url: uploadedUrl,
      }).eq('id', activePosition.id);
    } else {
      await supabase.from('sex_positions').insert([{
        name: name.trim(),
        description: description.trim(),
        status,
        tried_count: triedCount,
        image_url: uploadedUrl,
      }]);
    }

    setOpen(false);
    await loadPositions();
  }

  // Slet stilling
  async function handleDelete() {
    if (!activePosition) return;
    if (!confirm('Vil du slette denne stilling?')) return;
    await supabase.from('sex_positions').delete().eq('id', activePosition.id);
    setOpen(false);
    await loadPositions();
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-2 sm:px-4">
      <h1 className="text-2xl font-bold mb-6">Sexstillinger – Inspiration</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {positions.map(pos => (
          <div
            key={pos.id}
            className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition"
            onClick={() => openModalView(pos)}
          >
            {pos.image_url ? (
              <img src={pos.image_url} alt={pos.name} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400">
                <span>Intet billede</span>
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg truncate">{pos.name}</h2>
                {pos.tried_count && pos.tried_count > 0 && (
                  <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                    {pos.tried_count}x
                  </span>
                )}
                {pos.status === 'prøvet' && (
                  <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                    Prøvet
                  </span>
                )}
                {pos.status === 'afvist' && (
                  <span className="inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                    Afvist
                  </span>
                )}
              </div>
              {pos.description && <p className="text-gray-600 text-sm line-clamp-3 mb-2">{pos.description}</p>}
            </div>
          </div>
        ))}
        {/* Opret ny stilling */}
        <div
          onClick={() => openModalEdit()}
          className="flex items-center justify-center border-2 border-dashed rounded-xl p-6 min-h-48 cursor-pointer hover:border-gray-400 transition bg-white"
        >
          + Tilføj ny stilling
        </div>
      </div>

      {/* Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-lg mx-auto space-y-6 max-h-[90vh] overflow-y-auto">
          {/* View-mode */}
          {!editMode && activePosition && (
            <>
              <h2 className="text-xl font-bold mb-2">{activePosition.name}</h2>
              {activePosition.image_url && (
                <img src={activePosition.image_url} alt="Stillingsbillede" className="w-full h-64 object-contain rounded mb-2" />
              )}
              <p className="mb-2">{activePosition.description}</p>
              <div className="flex gap-2">
                {activePosition.tried_count && activePosition.tried_count > 0 && (
                  <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                    {activePosition.tried_count}x
                  </span>
                )}
                {activePosition.status === 'prøvet' && (
                  <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                    Prøvet
                  </span>
                )}
                {activePosition.status === 'afvist' && (
                  <span className="inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                    Afvist
                  </span>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => setEditMode(true)} className="btn btn-primary">Rediger</button>
              </div>
            </>
          )}

          {/* Edit-mode */}
          {editMode && (
            <>
              <h2 className="text-xl font-bold mb-2">{activePosition ? 'Rediger stilling' : 'Tilføj ny stilling'}</h2>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 mb-2"
                placeholder="Navn"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <textarea
                className="w-full border rounded px-3 py-2 mb-2"
                placeholder="Beskrivelse"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <div className="flex gap-3 mb-2">
                <label className="flex items-center gap-2">
                  Status:
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="ny">Ny</option>
                    <option value="prøvet">Prøvet</option>
                    <option value="afvist">Afvist</option>
                  </select>
                </label>
                {status === 'prøvet' && (
                  <label className="flex items-center gap-1">
                    Antal gange:
                    <input
                      type="number"
                      value={triedCount}
                      onChange={e => setTriedCount(Number(e.target.value))}
                      min={1}
                      className="border rounded px-2 py-1 w-16"
                    />
                  </label>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label>
                  Billede:
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                </label>
                {imageUrl && !imageFile && (
                  <img src={imageUrl} alt="Nu" className="w-32 h-32 rounded object-cover mt-2" />
                )}
                {imageFile && (
                  <span className="text-sm text-gray-500">Billede valgt: {imageFile.name}</span>
                )}
              </div>
              <div className="flex justify-between gap-2 mt-4">
                {activePosition && (
                  <button
                    onClick={handleDelete}
                    className="btn btn-outline text-red-600"
                  >
                    Slet
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={uploading || !name.trim()}
                  >
                    {activePosition ? 'Gem ændringer' : 'Opret'}
                  </button>
                  <button onClick={() => {
                    setEditMode(false);
                    if (activePosition) openModalView(activePosition);
                  }} className="btn btn-outline">Annuller</button>
                </div>
              </div>
            </>
          )}
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}
