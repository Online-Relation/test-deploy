// /app/data/sex/page.tsx

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
  const [positions, setPositions] = useState<{ id: string; name: string }[]>([]);
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


// Hent huller
useEffect(() => {
  async function loadPlaces() {
    const { data, error } = await supabase.from('sex_places').select('id, name').order('name');
    if (!error && data) setPlaces(data);
  }
  loadPlaces();
}, []);
  // Hent stillinger
  useEffect(() => {
    async function loadPositions() {
      const { data, error } = await supabase.from('sex_positions').select('id, name').order('name');
      if (!error && data) setPositions(data);
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

  // Stillings-chips
  const handleTogglePosition = (id: string) => {
    setSelectedPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  useEffect(() => {
  async function loadTags() {
    const { data, error } = await supabase.from('sex_tags').select('id, name').order('name');
    if (!error && data) setTags(data);
  }
  loadTags();
}, []);

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

  // Placering-chips
  const handleToggleLocation = (id: string) => {
    setSelectedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

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

  const handleTogglePlace = (id: string) => {
  setSelectedPlaces(prev => {
    const newSet = new Set(prev);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    return newSet;
  });
};

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

const handleToggleTag = (id: string) => {
  setSelectedTags(prev => {
    const newSet = new Set(prev);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    return newSet;
  });
};

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


const handleRegister = async () => {
  setSaving(true);
  setMessage('');

  // Generér dato/tid-formater
  const logDatetime = new Date(`${date}T${time}`);
  const isoDatetime = logDatetime.toISOString();
  const logDate = isoDatetime.split('T')[0]; // YYYY-MM-DD

  // Opret selve loggen - bemær alle felter!
  const { data: logData, error: logError } = await supabase
    .from('sexlife_logs')
    .insert([{
      log_datetime: isoDatetime,
      log_date: logDate,
      log_time: time,
      had_sex: true,
      initiator,
      sex_type: sexType
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

  // GEM TAGS - filtrer kun til eksisterende tags
  if (selectedTags.size > 0) {
    const existingTagIds = new Set(tags.map(tag => tag.id));
    const validSelectedTags = Array.from(selectedTags).filter(tag_id => existingTagIds.has(tag_id));
    if (validSelectedTags.length > 0) {
      const inserts = validSelectedTags.map(tag_id => ({
        log_id: logData.id,
        tag_id
      }));
      const { error } = await supabase.from('sexlife_log_tags').insert(inserts);
      if (error && error.code !== '23505') {
        setMessage('Der opstod en fejl ved gem af tags.');
        setSaving(false);
        return;
      }
    }
  }

  // Reset alle valg (så du starter “clean” ved næste registrering)
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

      {/* Stillinger */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Stillinger</h2>
        <form onSubmit={handleAddPosition} className="flex gap-2 mb-2">
          <input
            type="text"
            value={newPosition}
            onChange={e => setNewPosition(e.target.value)}
            placeholder="Tilføj ny stilling"
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
        <div className="flex flex-wrap gap-2">
          {positions.map(pos => (
            <div key={pos.id} className="flex items-center">
              <button
                type="button"
                onClick={() => handleTogglePosition(pos.id)}
                disabled={saving}
                className={
                  "px-4 py-2 rounded-full border font-medium mr-1 " +
                  (selectedPositions.has(pos.id)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-gray-100 text-gray-700 border-gray-200")
                }
              >
                {pos.name}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Vil du slette stillingen "${pos.name}"?`)) {
                    await supabase.from('sex_positions').delete().eq('id', pos.id);
                    setPositions(p => p.filter(x => x.id !== pos.id));
                    setSelectedPositions(s => {
                      const n = new Set(s);
                      n.delete(pos.id);
                      return n;
                    });
                  }
                }}
                disabled={saving}
                className="text-red-600 text-xl font-bold hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center"
                aria-label="Slet"
                title="Slet stilling"
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
       {/* Huller */}
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
