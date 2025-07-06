// /app/indtjekning/sex/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const INITIATORS = [
  { key: 'mads', label: 'Mads' },
  { key: 'stine', label: 'Stine' },
  { key: 'fælles', label: 'Fælles' },
];

const SEX_TYPES = [
  { key: 'hverdag', label: 'Hverdag' },
  { key: 'passioneret', label: 'Passioneret' },
  { key: 'vild', label: 'Vild' },
  { key: 'grænseoverskridende', label: 'Grænseoverskridende' },
];

export default function SexRegisterPage() {
  const router = useRouter();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>('12:00');
  const [initiator, setInitiator] = useState<string>('');
  const [sexType, setSexType] = useState<string>('');
  const [positions, setPositions] = useState<{ id: string; name: string; image_url?: string; rejected?: boolean; tried_count?: number }[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [newPosition, setNewPosition] = useState<string>('');
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [newLocation, setNewLocation] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [places, setPlaces] = useState<{ id: string; name: string }[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set());
  const [newPlace, setNewPlace] = useState<string>('');
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [newTag, setNewTag] = useState<string>('');
  const [triedSomethingNew, setTriedSomethingNew] = useState(false);
  const [triedSomethingNewText, setTriedSomethingNewText] = useState('');

  // Hent stillinger med billede, tried_count osv.
  useEffect(() => {
    async function loadPositions() {
      const { data, error } = await supabase
        .from('sex_positions')
        .select('id, name, image_url, rejected, tried_count')
        .order('name');
      if (!error && data) setPositions(data.filter(pos => !pos.rejected));
    }
    loadPositions();
  }, []);

  // Hent placeringer
  useEffect(() => {
    async function loadLocations() {
      const { data, error } = await supabase.from('sex_locations').select('id, name').order('name');
      if (!error && data) setLocations(data);
    }
    loadLocations();
  }, []);

  // Hent steder
  useEffect(() => {
    async function loadPlaces() {
      const { data, error } = await supabase.from('sex_places').select('id, name').order('name');
      if (!error && data) setPlaces(data);
    }
    loadPlaces();
  }, []);

  // Hent tags
  useEffect(() => {
    async function loadTags() {
      const { data, error } = await supabase.from('sex_tags').select('id, name').order('name');
      if (!error && data) setTags(data);
    }
    loadTags();
  }, []);

  // Toggle position
  const handleTogglePosition = (id: string) => {
    setSelectedPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Tilføj ny stilling
  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPosition.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from('sex_positions')
      .insert([{ name }])
      .select('id, name')
      .maybeSingle();
    if (!error && data) {
      setPositions(p => [...p, data]);
      setSelectedPositions(s => new Set(s).add(data.id));
      setNewPosition('');
    }
  };

  // Toggle location
  const handleToggleLocation = (id: string) => {
    setSelectedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Tilføj ny location
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLocation.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from('sex_locations')
      .insert([{ name }])
      .select('id, name')
      .maybeSingle();
    if (!error && data) {
      setLocations(p => [...p, data]);
      setSelectedLocations(s => new Set(s).add(data.id));
      setNewLocation('');
    }
  };

  // Toggle place
  const handleTogglePlace = (id: string) => {
    setSelectedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Tilføj nyt sted
  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPlace.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from('sex_places')
      .insert([{ name }])
      .select('id, name')
      .maybeSingle();
    if (!error && data) {
      setPlaces(p => [...p, data]);
      setSelectedPlaces(s => new Set(s).add(data.id));
      setNewPlace('');
    }
  };

  // Toggle tag
  const handleToggleTag = (id: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Tilføj tag
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTag.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from('sex_tags')
      .insert([{ name }])
      .select('id, name')
      .maybeSingle();
    if (!error && data) {
      setTags(p => [...p, data]);
      setSelectedTags(s => new Set(s).add(data.id));
      setNewTag('');
    }
  };

  // Gem registrering
  const handleRegister = async () => {
    setSaving(true);
    setMessage('');

    // Dato og tid
    const logDatetime = new Date(`${date}T${time}`);
    const isoDatetime = logDatetime.toISOString();
    const logDate = isoDatetime.split('T')[0];

    // Insert log
    const { data: logData, error: logError } = await supabase
      .from('sexlife_logs')
      .insert([{
        log_datetime: isoDatetime,
        log_date: logDate,
        log_time: time,
        had_sex: true,
        initiator,
        sex_type: sexType,
        tried_something_new: triedSomethingNew,
        tried_something_new_text: triedSomethingNew ? triedSomethingNewText : null,
      }])
      .select('id')
      .maybeSingle();

    if (logError || !logData?.id) {
      setMessage('Kunne ikke gemme registrering.');
      setSaving(false);
      return;
    }

    // Gem stillinger
    if (selectedPositions.size > 0) {
      const inserts = Array.from(selectedPositions).map(position_id => ({
        log_id: logData.id,
        position_id
      }));
      await supabase.from('sexlife_log_positions').insert(inserts);
    }

    // Gem placeringer
    if (selectedLocations.size > 0) {
      const inserts = Array.from(selectedLocations).map(location_id => ({
        log_id: logData.id,
        location_id
      }));
      await supabase.from('sexlife_log_locations').insert(inserts);
    }

    // Gem steder
    if (selectedPlaces.size > 0) {
      const inserts = Array.from(selectedPlaces).map(place_id => ({
        log_id: logData.id,
        place_id
      }));
      await supabase.from('sexlife_log_places').insert(inserts);
    }

    // Gem tags
    if (selectedTags.size > 0) {
      const inserts = Array.from(selectedTags).map(tag_id => ({
        log_id: logData.id,
        tag_id
      }));
      await supabase.from('sexlife_log_tags').insert(inserts);
    }

    // Reset valg
    setSelectedTags(new Set());
    setSelectedPositions(new Set());
    setSelectedLocations(new Set());
    setSelectedPlaces(new Set());

    setMessage('Registrering gemt!');
    setSaving(false);
    setTimeout(() => router.push('/'), 1000);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Registrer sex</h1>

      {/* Dato */}
      <div className="mb-4">
        <label className="block font-medium mb-1">Dato</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          disabled={saving}
        />
      </div>
      {/* Klokkeslæt */}
      <div className="mb-6">
        <label className="block font-medium mb-1">Klokkeslæt</label>
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          disabled={saving}
        />
      </div>

      {/* Initiativ */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Initiativ</h2>
        <div className="flex gap-2">
          {INITIATORS.map(option => (
            <button
              key={option.key}
              type="button"
              onClick={() => setInitiator(option.key)}
              disabled={saving}
              className={
                "px-4 py-2 rounded-full border font-medium " +
                (initiator === option.key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-gray-100 text-gray-700 border-gray-200")
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Type</h2>
        <div className="flex gap-2">
          {SEX_TYPES.map(option => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSexType(option.key)}
              disabled={saving}
              className={
                "px-4 py-2 rounded-full border font-medium " +
                (sexType === option.key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-gray-100 text-gray-700 border-gray-200")
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={triedSomethingNew}
            onChange={e => setTriedSomethingNew(e.target.checked)}
            className="form-checkbox h-5 w-5 text-indigo-600"
            disabled={saving}
          />
          <span className="ml-2">Vi prøvede noget nyt</span>
        </label>
        {triedSomethingNew && (
          <textarea
            value={triedSomethingNewText}
            onChange={e => setTriedSomethingNewText(e.target.value)}
            placeholder="Hvad prøvede I?"
            className="w-full mt-2 p-2 border rounded"
            disabled={saving}
            rows={2}
            maxLength={100}
          />
        )}
      </div>

      {/* Stillinger */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Stillinger</h2>
        <form onSubmit={handleAddPosition} className="flex gap-2 mb-2">
          <input
            type="text"
            value={newPosition}
            onChange={e => setNewPosition(e.target.value)}
            placeholder="Tilføj eller søg stilling"
            className="flex-1 px-3 py-2 border rounded"
            disabled={saving}
          />
          <button
            type="submit"
            disabled={saving || !newPosition.trim()}
            className="px-3 py-2 rounded bg-green-600 text-white font-semibold"
          >
            Tilføj
          </button>
        </form>

        {/* Autocomplete-søgning */}
        {newPosition.length > 0 && (
          <div className="mb-2 border rounded shadow bg-white z-10 relative">
            {positions
              .filter(pos =>
                pos.name.toLowerCase().includes(newPosition.toLowerCase()) &&
                !selectedPositions.has(pos.id)
              )
              .slice(0, 5)
              .map(pos => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => {
                    handleTogglePosition(pos.id);
                    setNewPosition('');
                  }}
                  className="block w-full text-left px-4 py-2 border-b hover:bg-indigo-50 flex items-center gap-2"
                >
                  {pos.image_url && (
                    <img
                      src={pos.image_url}
                      alt={pos.name}
                      className="w-6 h-6 object-cover rounded-full border border-gray-300"
                    />
                  )}
                  {pos.name}
                  {pos.tried_count && pos.tried_count > 0 && (
                    <span className="ml-2 text-xs bg-indigo-50 text-indigo-700 rounded-full px-2">
                      {pos.tried_count}x
                    </span>
                  )}
                </button>
              ))}
          </div>
        )}

        {/* Top 10 mest brugte */}
        <div className="mb-2 flex flex-wrap gap-2">
          {positions
            .filter(pos => !selectedPositions.has(pos.id))
            .sort((a, b) => ((b.tried_count || 0) - (a.tried_count || 0)))
            .slice(0, 10)
            .map(pos => (
              <button
                key={pos.id}
                type="button"
                onClick={() => handleTogglePosition(pos.id)}
                disabled={saving}
                className={
                  "flex items-center gap-2 px-4 py-2 rounded-full border font-medium " +
                  "bg-gray-100 text-gray-700 border-gray-200 hover:bg-indigo-100"
                }
              >
                {pos.image_url && (
                  <img
                    src={pos.image_url}
                    alt={pos.name}
                    className="w-6 h-6 object-cover rounded-full border border-gray-300"
                  />
                )}
                <span>{pos.name}</span>
                {pos.tried_count && pos.tried_count > 0 && (
                  <span className="ml-2 text-xs bg-indigo-50 text-indigo-700 rounded-full px-2">
                    {pos.tried_count}x
                  </span>
                )}
              </button>
            ))}
        </div>

        {/* Valgte stillinger */}
        <div className="flex flex-wrap gap-2 mt-2">
          {positions.filter(pos => selectedPositions.has(pos.id)).map(pos => (
            <div key={pos.id} className="flex items-center gap-2 border rounded-lg px-2 py-1 bg-indigo-50">
              {pos.image_url && (
                <img
                  src={pos.image_url}
                  alt={pos.name}
                  className="w-6 h-6 object-cover rounded-full border border-gray-300"
                />
              )}
              <span>{pos.name}</span>
              <button
                type="button"
                onClick={() => handleTogglePosition(pos.id)}
                className="text-red-600 text-xl font-bold hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center"
                aria-label="Fjern"
                title="Fjern"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Placering */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Placering</h2>
        <form onSubmit={handleAddLocation} className="flex gap-2 mb-2">
          <input
            type="text"
            value={newLocation}
            onChange={e => setNewLocation(e.target.value)}
            placeholder="Tilføj ny placering"
            className="flex-1 px-3 py-2 border rounded"
            disabled={saving}
          />
          <button
            type="submit"
            disabled={saving || !newLocation.trim()}
            className="px-3 py-2 rounded bg-green-600 text-white font-semibold"
          >
            Tilføj
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {locations.map(loc => (
            <div key={loc.id} className="flex items-center">
              <button
                type="button"
                onClick={() => handleToggleLocation(loc.id)}
                disabled={saving}
                className={
                  "px-4 py-2 rounded-full border font-medium mr-1 " +
                  (selectedLocations.has(loc.id)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-gray-100 text-gray-700 border-gray-200")
                }
              >
                {loc.name}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Vil du slette placeringen "${loc.name}"?`)) {
                    await supabase.from('sex_locations').delete().eq('id', loc.id);
                    setLocations(p => p.filter(x => x.id !== loc.id));
                    setSelectedLocations(s => {
                      const n = new Set(s);
                      n.delete(loc.id);
                      return n;
                    });
                  }
                }}
                disabled={saving}
                className="text-red-600 text-xl font-bold hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center"
                aria-label="Slet"
                title="Slet placering"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sted */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Sted</h2>
        <form onSubmit={handleAddPlace} className="flex gap-2 mb-2">
          <input
            type="text"
            value={newPlace}
            onChange={e => setNewPlace(e.target.value)}
            placeholder="Tilføj nyt sted"
            className="flex-1 px-3 py-2 border rounded"
            disabled={saving}
          />
          <button
            type="submit"
            disabled={saving || !newPlace.trim()}
            className="px-3 py-2 rounded bg-green-600 text-white font-semibold"
          >
            Tilføj
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {places.map(place => (
            <div key={place.id} className="flex items-center">
              <button
                type="button"
                onClick={() => handleTogglePlace(place.id)}
                disabled={saving}
                className={
                  "px-4 py-2 rounded-full border font-medium mr-1 " +
                  (selectedPlaces.has(place.id)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-gray-100 text-gray-700 border-gray-200")
                }
              >
                {place.name}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Vil du slette stedet "${place.name}"?`)) {
                    await supabase.from('sex_places').delete().eq('id', place.id);
                    setPlaces(p => p.filter(x => x.id !== place.id));
                    setSelectedPlaces(s => {
                      const n = new Set(s);
                      n.delete(place.id);
                      return n;
                    });
                  }
                }}
                disabled={saving}
                className="text-red-600 text-xl font-bold hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center"
                aria-label="Slet"
                title="Slet sted"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Tags</h2>
        <form onSubmit={handleAddTag} className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            placeholder="Tilføj nyt tag"
            className="flex-1 px-3 py-2 border rounded"
            disabled={saving}
          />
          <button
            type="submit"
            disabled={saving || !newTag.trim()}
            className="px-3 py-2 rounded bg-green-600 text-white font-semibold"
          >
            Tilføj
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center">
              <button
                type="button"
                onClick={() => handleToggleTag(tag.id)}
                disabled={saving}
                className={
                  "px-4 py-2 rounded-full border font-medium mr-1 " +
                  (selectedTags.has(tag.id)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-gray-100 text-gray-700 border-gray-200")
                }
              >
                {tag.name}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Vil du slette tagget "${tag.name}"?`)) {
                    await supabase.from('sex_tags').delete().eq('id', tag.id);
                    setTags(p => p.filter(x => x.id !== tag.id));
                    setSelectedTags(s => {
                      const n = new Set(s);
                      n.delete(tag.id);
                      return n;
                    });
                  }
                }}
                disabled={saving}
                className="text-red-600 text-xl font-bold hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center"
                aria-label="Slet"
                title="Slet tag"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleRegister}
        disabled={saving || !initiator || !sexType}
        className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
      >
        {saving ? 'Gemmer…' : 'Registrer'}
      </button>
      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
}
