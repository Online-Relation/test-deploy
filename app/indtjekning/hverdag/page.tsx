"use client";

import React, { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { da } from "react-day-picker/locale";
import "react-day-picker/dist/style.css";
import { supabase } from "@/lib/supabaseClient";

// Kategoriserede chips
const CHIP_CATEGORIES_INIT = [
  {
    name: "Positive",
    chips: [
      "Tryg", "Forbundet", "Elsket", "Håbefuld", "Optimistisk", "Taknemmelig", "Nysgerrig",
      "Afklaret", "Glæde", "Motiveret", "Inspireret", "Stolt", "Lettelse"
    ],
  },
  {
    name: "Udfordrende",
    chips: [
      "Usikker", "Tvivler", "Ensom", "Frustreret", "Overvældet", "Træt", "Skuffet", "Utryg",
      "Ængstelig", "Irriteret", "Ked af det", "Vred", "Jaloux", "Sårbar", "Opgivende", "Bekymret", "Resigneret"
    ],
  },
  {
    name: "Neutrale/Eftertænksomme",
    chips: [
      "Eftertænksom", "Neutral", "Reflekterende", "Afventende", "Uafklaret", "Forvirret", "Mangler energi", "Passiv"
    ],
  },
  {
    name: "Krop/sanser",
    chips: [
      "Rastløs", "Urolig", "Spændt", "Afslappet", "Tom", "Fyldt op"
    ],
  },
  {
    name: "Relationelle/Bonus",
    chips: [
      "Savn", "Nærhed", "Distance", "Styrke", "Omsorg", "Pleaser", "Overpræsterende"
    ],
  }
];

function flattenChips(categories: typeof CHIP_CATEGORIES_INIT) {
  return categories.flatMap(cat => cat.chips);
}

const moodOptions = [
  { value: 1, label: "Frost", color: "bg-blue-200 border-blue-400 text-blue-900" },
  { value: 2, label: "Kølig", color: "bg-cyan-200 border-cyan-400 text-cyan-900" },
  { value: 3, label: "Neutral", color: "bg-gray-200 border-gray-400 text-gray-900" },
  { value: 4, label: "Lun", color: "bg-orange-200 border-orange-400 text-orange-900" },
  { value: 5, label: "Hed", color: "bg-red-200 border-red-400 text-red-900" },
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function IndtjekningHverdag() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [wasTogether, setWasTogether] = useState("");
  const [conflict, setConflict] = useState("");
  const [conflictText, setConflictText] = useState("");
  const [mood, setMood] = useState(3);

  // Kategorier og egne/tilføjede
  const [chipCategories, setChipCategories] = useState(CHIP_CATEGORIES_INIT);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newTagCategory, setNewTagCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [registeredDates, setRegisteredDates] = useState<Date[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const baseChips = flattenChips(CHIP_CATEGORIES_INIT);

  useEffect(() => {
    setFetching(true);
    setErrorMsg(null);

    async function fetchData() {
      try {
        const { data: regData } = await supabase
          .from("daily_checkin")
          .select("checkin_date");

        if (regData) {
          const regDates = regData.map((row: any) => {
            const [year, month, day] = row.checkin_date.split("-");
            return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0);
          });
          setRegisteredDates(regDates);
        }

        const { data, error } = await supabase
          .from("daily_checkin")
          .select("*")
          .order("checkin_date", { ascending: false })
          .limit(5);

        if (error) {
          setErrorMsg("Fejl ved hentning: " + error.message);
          setLatest([]);
        } else {
          setLatest(data || []);
          setErrorMsg(null);
        }
      } catch (err: any) {
        setErrorMsg("Uventet fejl: " + err.message);
        setLatest([]);
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [done]);

  function matcher(day: Date) {
    return registeredDates.some((reg) => isSameDay(day, reg));
  }

  const handleToggleTag = (tag: string) => {
    setSelectedTags(selected =>
      selected.includes(tag)
        ? selected.filter(t => t !== tag)
        : [...selected, tag]
    );
  };

  // Opdater handleAddTag så den tilføjer chip til valgt kategori
  const handleAddTag = () => {
    const tag = newTag.trim();
    if (!tag) return;

    if (
      !baseChips.includes(tag) &&
      !customTags.includes(tag) &&
      newTagCategory &&
      chipCategories.find(c => c.name === newTagCategory)
    ) {
      // Tilføj til valgt kategori
      setChipCategories(categories =>
        categories.map(cat =>
          cat.name === newTagCategory && !cat.chips.includes(tag)
            ? { ...cat, chips: [...cat.chips, tag] }
            : cat
        )
      );
    } else if (
      !baseChips.includes(tag) &&
      !customTags.includes(tag) &&
      (!newTagCategory || newTagCategory === "Egne følelser/tanker")
    ) {
      // Tilføj som egen chip
      setCustomTags([...customTags, tag]);
    }
    if (!selectedTags.includes(tag)) setSelectedTags([...selectedTags, tag]);
    setNewTag("");
    setNewTagCategory("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const checkin_date = date
      ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
          .getDate()
          .toString()
          .padStart(2, "0")}`
      : undefined;

    const { error } = await supabase.from("daily_checkin").insert({
      checkin_date,
      was_together: wasTogether === "ja",
      conflict: conflict === "ja",
      conflict_text: conflict === "ja" ? conflictText : null,
      mood,
      tags: selectedTags,
    });

    setLoading(false);
    if (!error) {
      setDone(true);
      setConflictText("");
      setSelectedTags([]);
    } else {
      alert("Der opstod en fejl! Prøv igen.");
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto py-8 px-4">
        <div className="rounded-2xl shadow-lg bg-white p-6 text-center">
          <div className="text-2xl mb-4">Tak for din indtjekning!</div>
          <button
            className="btn-primary w-full mt-2"
            onClick={() => setDone(false)}
          >
            Indsend en ny
          </button>
        </div>
        <LatestRegistrations latest={latest} fetching={fetching} errorMsg={errorMsg} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-6 px-4">
      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl shadow-lg bg-white p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Indtjekning – Hverdag</h2>

          {/* Kalender-vælger med markerede dage */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Dato</label>
            <DayPicker
              mode="single"
              selected={date}
              onSelect={setDate}
              modifiers={{
                registered: matcher
              }}
              modifiersClassNames={{
                registered: "rdp-day_registered"
              }}
              showOutsideDays
              locale={da}
              weekStartsOn={1}
            />
          </div>

          {/* Var I sammen i dag */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Var I sammen i dag?</label>
            <select
              value={wasTogether}
              onChange={(e) => setWasTogether(e.target.value)}
              className="border rounded-xl px-3 py-2 w-full"
              required
            >
              <option value="">Vælg...</option>
              <option value="ja">Ja</option>
              <option value="nej">Nej</option>
            </select>
          </div>

          {/* Konflikt */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Var der konflikt?</label>
            <select
              value={conflict}
              onChange={(e) => {
                setConflict(e.target.value);
                if (e.target.value !== "ja") setConflictText("");
              }}
              className="border rounded-xl px-3 py-2 w-full"
              required
            >
              <option value="">Vælg...</option>
              <option value="ja">Ja</option>
              <option value="nej">Nej</option>
            </select>
          </div>

          {/* Konflikt-beskrivelse, kun hvis valgt ja */}
          {conflict === "ja" && (
            <div className="mb-4">
              <label className="block font-medium mb-1">Beskriv konflikten (valgfrit)</label>
              <textarea
                className="border rounded-xl px-3 py-2 w-full"
                rows={2}
                value={conflictText}
                onChange={(e) => setConflictText(e.target.value)}
                placeholder="Skriv kort hvad konflikten handlede om..."
              />
            </div>
          )}

          {/* Stemning barometer */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Humør for dagen</label>
            <div className="flex items-center gap-3 justify-between">
              {moodOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMood(opt.value)}
                  className={`rounded-full w-16 h-16 flex items-center justify-center border-2 font-medium text-xs
                    ${opt.color}
                    ${mood === opt.value ? "scale-110 border-black shadow" : "opacity-80"}
                    transition-all`}
                  aria-label={opt.label}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="mt-3 text-center text-base font-medium" style={{ minHeight: 24 }}>
              {moodOptions.find((opt) => opt.value === mood)?.label}
            </div>
          </div>

          {/* Følelser/tanker (tags) med kategorier */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Dagens følelser / tanker</label>
            <div className="flex flex-col gap-3 mb-2">
              {chipCategories.map(cat => (
                <div key={cat.name}>
                  <div className="font-semibold text-xs mb-1 text-gray-600">{cat.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {cat.chips.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-3 py-1 rounded-full border text-sm transition ${
                          selectedTags.includes(tag)
                            ? "bg-indigo-600 text-white border-indigo-600 shadow"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                        tabIndex={-1}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Egne/tilføjede tags */}
              {customTags.length > 0 && (
                <div>
                  <div className="font-semibold text-xs mb-1 text-gray-600">Egne følelser/tanker</div>
                  <div className="flex flex-wrap gap-2">
                    {customTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-3 py-1 rounded-full border text-sm transition ${
                          selectedTags.includes(tag)
                            ? "bg-indigo-600 text-white border-indigo-600 shadow"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                        tabIndex={-1}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Tilføj følelse/tanke…"
                className="flex-1 px-3 py-2 border rounded"
                maxLength={32}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <select
                value={newTagCategory}
                onChange={e => setNewTagCategory(e.target.value)}
                className="border rounded-xl px-2 py-2"
                style={{ minWidth: 120 }}
              >
                <option value="">Vælg kategori</option>
                {chipCategories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
                <option value="Egne følelser/tanker">Egne følelser/tanker</option>
              </select>
              <button
                type="button"
                disabled={!newTag.trim()}
                onClick={handleAddTag}
                className="px-3 py-2 rounded bg-green-600 text-white font-semibold"
              >
                Tilføj
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            className="btn-primary w-full mt-4 shadow"
            type="submit"
            disabled={loading}
          >
            {loading ? "Gemmer..." : "Gem"}
          </button>
        </div>
      </form>
      <LatestRegistrations latest={latest} fetching={fetching} errorMsg={errorMsg} />
    </div>
  );
}

function LatestRegistrations({ latest, fetching, errorMsg }: { latest: any[], fetching: boolean, errorMsg?: string | null }) {
  const moodOptions = [
    { value: 1, label: "Frost", color: "bg-blue-200 border-blue-400 text-blue-900" },
    { value: 2, label: "Kølig", color: "bg-cyan-200 border-cyan-400 text-cyan-900" },
    { value: 3, label: "Neutral", color: "bg-gray-200 border-gray-400 text-gray-900" },
    { value: 4, label: "Lun", color: "bg-orange-200 border-orange-400 text-orange-900" },
    { value: 5, label: "Hed", color: "bg-red-200 border-red-400 text-red-900" },
  ];

  return (
    <div className="rounded-2xl shadow bg-white p-4 mt-6">
      <h3 className="font-semibold mb-3 text-lg">Seneste indtjekninger</h3>
      {errorMsg ? (
        <div className="text-center text-red-500 break-all">{typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}</div>
      ) : fetching ? (
        <div className="text-center text-gray-500">Henter...</div>
      ) : latest.length === 0 ? (
        <div className="text-center text-gray-400">Ingen registreringer endnu.</div>
      ) : (
        <ul className="space-y-2">
          {latest.map((item) => {
            const mood = moodOptions.find((m) => m.value === item.mood);
            return (
              <li key={item.id} className="flex items-center justify-between border-b pb-1 last:border-b-0">
                <span className="text-sm">{item.checkin_date}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${mood?.color}`}>
                  {mood?.label}
                </span>
                <span className="text-xs">
                  {item.was_together ? "Sammen" : "Ikke sammen"}
                </span>
                <span className="text-xs">
                  {item.conflict ? "Konflikt" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
