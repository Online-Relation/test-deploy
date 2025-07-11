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
  const [positions, setPositions] = useState<any[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [newPosition, setNewPosition] = useState<string>('');
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [newLocation, setNewLocation] = useState<string>('');
  const [places, setPlaces] = useState<any[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set());
  const [newPlace, setNewPlace] = useState<string>('');
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [newTag, setNewTag] = useState<string>('');
  const [triedSomethingNew, setTriedSomethingNew] = useState(false);
  const [triedSomethingNewText, setTriedSomethingNewText] = useState('');
  const [searchNewPosition, setSearchNewPosition] = useState('');
  const [triedNewPositionId, setTriedNewPositionId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  // -------- GLOBAL fetchLogs funktion --------
  const fetchLogs = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('sexlife_logs')
      .select('*, sexlife_log_positions(position_id), sexlife_log_locations(location_id), sexlife_log_places(place_id), sexlife_log_tags(tag_id)')
      .order('log_datetime', { ascending: false })
      .limit(5);
    if (!error && data) setRecentLogs(data);
    setFetching(false);
  };

  // Hent alt fra DB
  useEffect(() => {
    async function loadData() {
      const [pos, loc, place, tag] = await Promise.all([
        supabase.from('sex_positions').select('id, name, image_url, rejected, tried_count').order('name'),
        supabase.from('sex_locations').select('id, name').order('name'),
        supabase.from('sex_places').select('id, name').order('name'),
        supabase.from('sex_tags').select('id, name').order('name')
      ]);
      setPositions((pos.data || []).filter((p: any) => !p.rejected));
      setLocations(loc.data || []);
      setPlaces(place.data || []);
      setTags(tag.data || []);
    }
    loadData();
    fetchLogs(); // <-- Hent logs ved første load
  }, []);

  // Hent seneste logs når message ændres (fx "Redigering gemt!")
  useEffect(() => {
    if (message) fetchLogs();
  }, [message]);

  // Toggle helper
  const handleToggleSet = (id: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setter(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Tilføj ny mulighed
  async function handleAddOption(table: string, name: string, setter: any, selectedSetter: any, reset: any) {
    const clean = name.trim();
    if (!clean) return;
    const { data, error } = await supabase.from(table).insert([{ name: clean }]).select('id, name').maybeSingle();
    if (!error && data) {
      setter((x: any[]) => [...x, data]);
      selectedSetter((set: Set<string>) => new Set(set).add(data.id));
      reset('');
    }
  }

  // GEM / REDIGER
  const handleRegister = async () => {
    setSaving(true);
    setMessage('');
    const logDatetime = new Date(`${date}T${time}`);
    const isoDatetime = logDatetime.toISOString();
    const logDate = isoDatetime.split('T')[0];
    let logData, logError, logId = editingId;

    if (editingId) {
      // UPDATE hovedlog
      const { error } = await supabase
        .from('sexlife_logs')
        .update({
          log_datetime: isoDatetime,
          log_date: logDate,
          log_time: time,
          had_sex: true,
          initiator,
          sex_type: sexType,
          tried_something_new: triedSomethingNew,
          tried_something_new_text: triedSomethingNew ? triedSomethingNewText : null,
          tried_new_position_id: triedNewPositionId || null,
        })
        .eq('id', editingId);
      logError = error;
      logData = { id: editingId };

      // Slet gamle koblinger
      await supabase.from('sexlife_log_positions').delete().eq('log_id', editingId);
      await supabase.from('sexlife_log_locations').delete().eq('log_id', editingId);
      await supabase.from('sexlife_log_places').delete().eq('log_id', editingId);
      await supabase.from('sexlife_log_tags').delete().eq('log_id', editingId);
    } else {
      // INSERT hovedlog
      const { data: insertData, error: insertError } = await supabase
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
          tried_new_position_id: triedNewPositionId || null,
        }])
        .select('id')
        .maybeSingle();
      logError = insertError;
      logData = insertData;
      logId = insertData?.id;
    }

    if (logError || !logData?.id) {
      setMessage('Kunne ikke gemme registrering.');
      setSaving(false);
      return;
    }

    // batchInsert helper
    async function batchInsert(
      table: string,
      ids: Set<string>,
      col: string
    ): Promise<void> {
      if (!logId) return;
      if (!ids || ids.size === 0) return;
      const rows = Array.from(ids).map((id: string) => ({
        log_id: logId,
        [col]: id,
      }));
      await supabase.from(table).insert(rows);
    }

    await batchInsert('sexlife_log_positions', selectedPositions, 'position_id');
    await batchInsert('sexlife_log_locations', selectedLocations, 'location_id');
    await batchInsert('sexlife_log_places', selectedPlaces, 'place_id');
    await batchInsert('sexlife_log_tags', selectedTags, 'tag_id');

    // Reset state
    setSelectedTags(new Set());
    setSelectedPositions(new Set());
    setSelectedLocations(new Set());
    setSelectedPlaces(new Set());
    setSearchNewPosition('');
    setTriedNewPositionId('');
    setTriedSomethingNewText('');
    setTriedSomethingNew(false);

    setMessage(editingId ? 'Redigering gemt!' : 'Registrering gemt!');
    setSaving(false);
    setEditingId(null);

    // Opdater seneste logs direkte – ingen reload, ingen fejl
    fetchLogs();
  };

  // Redigering
  function handleEdit(log: any) {
    setEditingId(log.id);
    setDate(log.log_date || new Date().toISOString().split('T')[0]);
    setTime(log.log_time || '12:00');
    setInitiator(log.initiator || '');
    setSexType(log.sex_type || '');
    setTriedSomethingNew(log.tried_something_new || false);
    setTriedSomethingNewText(log.tried_something_new_text || '');
    setTriedNewPositionId(log.tried_new_position_id || '');
    setSearchNewPosition('');
    setSelectedPositions(new Set((log.sexlife_log_positions || []).map((x: any) => x.position_id)));
    setSelectedLocations(new Set((log.sexlife_log_locations || []).map((x: any) => x.location_id)));
    setSelectedPlaces(new Set((log.sexlife_log_places || []).map((x: any) => x.place_id)));
    setSelectedTags(new Set((log.sexlife_log_tags || []).map((x: any) => x.tag_id)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function handleCancelEdit() {
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setTime('12:00');
    setInitiator('');
    setSexType('');
    setTriedSomethingNew(false);
    setTriedSomethingNewText('');
    setTriedNewPositionId('');
    setSearchNewPosition('');
    setSelectedTags(new Set());
    setSelectedPositions(new Set());
    setSelectedLocations(new Set());
    setSelectedPlaces(new Set());
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">{editingId ? 'Rediger sexregistrering' : 'Registrer sex'}</h1>

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

      {/* Vi prøvede noget nyt */}
      <div className="mb-6 relative">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={triedSomethingNew}
            onChange={e => {
              setTriedSomethingNew(e.target.checked);
              if (!e.target.checked) {
                setTriedSomethingNewText('');
                setTriedNewPositionId('');
                setSearchNewPosition('');
              }
            }}
            className="form-checkbox h-5 w-5 text-indigo-600"
            disabled={saving}
          />
          <span className="ml-2">Vi prøvede noget nyt</span>
        </label>
        {triedSomethingNew && (
          <>
            <textarea
              value={triedSomethingNewText}
              onChange={e => setTriedSomethingNewText(e.target.value)}
              placeholder="Hvad prøvede I?"
              className="w-full mt-2 p-2 border rounded"
              disabled={saving}
              rows={2}
              maxLength={100}
            />
            {/* NYT FELT: Vælg ny stilling */}
            <div className="mt-4 relative">
              <label className="block text-sm font-medium mb-1">Ny stilling vi prøvede</label>
              <input
                type="text"
                placeholder="Søg og vælg stilling"
                className="w-full px-3 py-2 border rounded"
                value={searchNewPosition}
                onChange={e => {
                  setSearchNewPosition(e.target.value);
                  setTriedNewPositionId('');
                }}
                disabled={saving}
              />
              {/* Autocomplete dropdown */}
              {searchNewPosition && (
                <div className="border rounded shadow bg-white mt-1 max-h-40 overflow-auto z-10 absolute w-full">
                  {positions
                    .filter(pos =>
                      pos.name.toLowerCase().includes(searchNewPosition.toLowerCase())
                    )
                    .slice(0, 6)
                    .map(pos => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => {
                          setTriedNewPositionId(pos.id);
                          setSearchNewPosition(''); // VIGTIGT: dropdown lukkes
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
                      </button>
                    ))}
                </div>
              )}
              {/* Valgt stilling preview */}
              {triedNewPositionId && (
                <div className="mt-2 text-xs text-gray-700 flex items-center gap-2">
                  Valgt: {positions.find(p => p.id === triedNewPositionId)?.name}
                  <button
                    type="button"
                    className="ml-2 text-red-600"
                    onClick={() => {
                      setTriedNewPositionId('');
                      setSearchNewPosition('');
                    }}
                  >✕</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stillinger */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Stillinger</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAddOption('sex_positions', newPosition, setPositions, setSelectedPositions, setNewPosition);
          }}
          className="flex gap-2 mb-2"
        >
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
                    handleToggleSet(pos.id, setSelectedPositions);
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
                onClick={() => handleToggleSet(pos.id, setSelectedPositions)}
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
                onClick={() => handleToggleSet(pos.id, setSelectedPositions)}
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
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAddOption('sex_locations', newLocation, setLocations, setSelectedLocations, setNewLocation);
          }}
          className="flex gap-2 mb-2"
        >
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
          {locations.map((loc: any) => (
            <div key={loc.id} className="flex items-center">
              <button
                type="button"
                onClick={() => handleToggleSet(loc.id, setSelectedLocations)}
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
                    setLocations((p: any[]) => p.filter((x: any) => x.id !== loc.id));
                    setSelectedLocations((s: Set<string>) => {
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
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAddOption('sex_places', newPlace, setPlaces, setSelectedPlaces, setNewPlace);
          }}
          className="flex gap-2 mb-2"
        >
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
          {places.map((place: any) => (
            <div key={place.id} className="flex items-center">
              <button
                type="button"
                onClick={() => handleToggleSet(place.id, setSelectedPlaces)}
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
                    setPlaces((p: any[]) => p.filter((x: any) => x.id !== place.id));
                    setSelectedPlaces((s: Set<string>) => {
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
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAddOption('sex_tags', newTag, setTags, setSelectedTags, setNewTag);
          }}
          className="flex gap-2 mb-2"
        >
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
          {tags.map((tag: any) => (
            <div key={tag.id} className="flex items-center">
              <button
                type="button"
                onClick={() => handleToggleSet(tag.id, setSelectedTags)}
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
                    setTags((p: any[]) => p.filter((x: any) => x.id !== tag.id));
                    setSelectedTags((s: Set<string>) => {
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

      {/* Submit/annuller */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleRegister}
          disabled={saving || !initiator || !sexType}
          className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
        >
          {saving ? (editingId ? 'Opdaterer…' : 'Gemmer…') : (editingId ? 'Opdater' : 'Registrer')}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="w-full py-2 rounded bg-gray-200 text-gray-800 font-semibold border"
          >
            Annuller redigering
          </button>
        )}
      </div>
      {message && <p className="mt-4 text-green-600">{message}</p>}

      {/* Seneste logs */}
      <div className="mt-10">
        <h3 className="font-semibold mb-3 text-lg">Seneste sexregistreringer</h3>
        {fetching ? (
          <div className="text-gray-500">Henter...</div>
        ) : recentLogs.length === 0 ? (
          <div className="text-gray-400">Ingen registreringer endnu.</div>
        ) : (
          <ul className="space-y-2">
            {recentLogs.map((log: any) => (
              <li key={log.id} className="flex items-center gap-2 border-b pb-1 last:border-b-0 flex-wrap">
                <span className="text-sm">{log.log_date}</span>
                <span className="text-xs">{log.initiator}</span>
                <span className="text-xs">{log.sex_type}</span>
                <span className="text-xs">{log.tried_something_new ? 'Nyt!' : ''}</span>
                <button
                  className="ml-2 px-2 py-1 text-xs rounded bg-yellow-300"
                  onClick={() => handleEdit(log)}
                  type="button"
                >
                  Rediger
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
