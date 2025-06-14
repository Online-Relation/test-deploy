'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getISOWeek, differenceInCalendarWeeks, subWeeks } from 'date-fns';

interface Tag { id: string; name: string; }

const colorClasses = [
  'bg-purple-100 text-purple-800',
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-pink-100 text-pink-800',
  'bg-red-100 text-red-800',
];

export default function SexPage() {
  const router = useRouter();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [averageSexDaysPerWeek, setAverageSexDaysPerWeek] = useState<number | null>(null);

  useEffect(() => {
    async function loadTags() {
      const { data, error } = await supabase.from('tags').select('id, name');
      if (error) console.error('Error loading tags:', error);
      else if (data) setTags(data as Tag[]);
    }
    loadTags();
  }, []);

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(tagId) ? next.delete(tagId) : next.add(tagId);
      return next;
    });
  };

  const handleRegister = async () => {
    setSaving(true);
    setMessage('');
    const { data: logData, error: logErr } = await supabase
      .from('sexlife_logs')
      .insert([{ log_date: date, had_sex: true }])
      .select('id')
      .maybeSingle();

    if (logErr || !logData?.id) {
      console.error('Error creating log:', logErr);
      setMessage('Kunne ikke oprette log.');
      setSaving(false);
      return;
    }

    const logId = logData.id;
    if (selectedTags.size) {
      const inserts = Array.from(selectedTags).map(tagId => ({ log_id: logId, tag_id: tagId }));
      const { error: tagErr } = await supabase.from('sexlife_log_tags').insert(inserts);
      if (tagErr) console.error('Error tagging log:', tagErr);
    }

    setMessage('Registrering gemt!');
    setSaving(false);
    router.push('/');
  };

  async function calculateAverageSexDaysPerWeek() {
    const today = new Date();
    const fourWeeksAgo = subWeeks(today, 4);
    const fourWeeksAgoStr = fourWeeksAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('sexlife_logs')
      .select('log_date')
      .gte('log_date', fourWeeksAgoStr)
      .eq('had_sex', true);

    if (error || !data) {
      console.error('Error fetching sexlife_logs:', error);
      setAverageSexDaysPerWeek(null);
      return;
    }

    const uniqueDates = Array.from(new Set(data.map((entry: any) => entry.log_date)));

    const weeksMap: Record<number, Set<string>> = {};

    uniqueDates.forEach((dateStr) => {
      const date = new Date(dateStr);
      const isoWeek = getISOWeek(date);
      if (!weeksMap[isoWeek]) {
        weeksMap[isoWeek] = new Set();
      }
      weeksMap[isoWeek].add(dateStr);
    });

    const numberOfWeeks = differenceInCalendarWeeks(today, fourWeeksAgo) + 1;

    const totalSexDays = Object.values(weeksMap).reduce((acc, daysSet) => acc + daysSet.size, 0);

    const average = totalSexDays / numberOfWeeks;

    setAverageSexDaysPerWeek(average);
  }

  useEffect(() => {
    calculateAverageSexDaysPerWeek();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Sex-registrering</h1>

      <div className="mt-4">
        <label className="block">
          <span className="text-sm font-medium">Dato</span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            disabled={saving}
            className="mt-1 block w-full px-3 py-2 border rounded"
          />
        </label>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Vælg tags</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => {
            const isSelected = selectedTags.has(tag.id);
            const colorClass = colorClasses[idx % colorClasses.length];
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                disabled={saving}
                className={
                  `px-3 py-1 rounded-full border transition focus:outline-none ` +
                  (isSelected
                    ? `bg-indigo-600 border-indigo-600 text-white`
                    : `${colorClass} border-transparent`)
                }
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleRegister}
          disabled={saving}
          className="w-full px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {saving ? 'Gemmer…' : 'Registrer'}
        </button>
        {message && <p className="mt-2 text-sm text-green-600">{message}</p>}

        {averageSexDaysPerWeek !== null && (
          <p className="mt-4 text-lg font-semibold">
            Gennemsnitligt antal dage med sex pr. uge (sidste 4 uger): {averageSexDaysPerWeek.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}
