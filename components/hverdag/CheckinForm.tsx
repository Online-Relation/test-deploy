"use client";

import React from "react";
import CheckinDatePicker from "./CheckinDatePicker";
import ConflictField from "./ConflictField";
import MoodBarometer from "./MoodBarometer";
import EmotionTagsSelector from "./EmotionTagsSelector";

interface ChipCategory {
  name: string;
  chips: string[];
}

interface Gift {
  giftWhat: string;
  giftCost: string;
}

interface CheckinFormProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  registeredDates: Date[];
  wasTogether: string;
  setWasTogether: (value: string) => void;
  conflict: string;
  conflictText: string;
  setConflict: (value: string) => void;
  setConflictText: (value: string) => void;
  mood: number;
  setMood: (value: number) => void;
  chipCategories: ChipCategory[];
  customTags: string[];
  selectedTags: string[];
  newTag: string;
  newTagCategory: string;
  onToggleTag: (tag: string) => void;
  onAddTag: () => void;
  setNewTag: (value: string) => void;
  setNewTagCategory: (value: string) => void;
  ilyWho: string;
  setIlyWho: (value: string) => void;
  loading: boolean;
  editingId: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  honestyTalk: string;
  setHonestyTalk: (value: string) => void;
  honestyTopic: string;
  setHonestyTopic: (value: string) => void;
  gift: string;
  setGift: (value: string) => void;
  gifts: Gift[];
  setGifts: (gifts: Gift[]) => void;
  flowers: string;
  setFlowers: (value: string) => void;
  alcohol: string;
  setAlcohol: (value: string) => void;

  dateday: string;
  setDateday: (value: string) => void;
  datedayGifts: Gift[];
  setDatedayGifts: (gifts: Gift[]) => void;
}

const CheckinForm: React.FC<CheckinFormProps> = ({
  date,
  setDate,
  registeredDates,
  wasTogether,
  setWasTogether,
  conflict,
  conflictText,
  setConflict,
  setConflictText,
  mood,
  setMood,
  chipCategories,
  customTags,
  selectedTags,
  newTag,
  newTagCategory,
  onToggleTag,
  onAddTag,
  setNewTag,
  setNewTagCategory,
  ilyWho,
  setIlyWho,
  loading,
  editingId,
  onSubmit,
  onCancelEdit,
  honestyTalk,
  setHonestyTalk,
  honestyTopic,
  setHonestyTopic,
  gift,
  setGift,
  gifts,
  setGifts,
  flowers,
  setFlowers,
  alcohol,
  setAlcohol,

  dateday,
  setDateday,
  datedayGifts,
  setDatedayGifts,
}) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="rounded-2xl shadow-lg bg-white p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Rediger indtjekning" : "Indtjekning – Hverdag"}
        </h2>

        <CheckinDatePicker
          date={date}
          onSelect={setDate}
          registeredDates={registeredDates}
        />

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

        <ConflictField
          conflict={conflict}
          conflictText={conflictText}
          setConflict={setConflict}
          setConflictText={setConflictText}
        />

        {/* Sagde nogen "jeg elsker dig"? */}
        <div className="mb-4">
          <label className="block font-medium mb-1">
            Hvem sagde "jeg elsker dig" i dag?
          </label>
          <select
            value={ilyWho}
            onChange={(e) => setIlyWho(e.target.value)}
            className="border rounded-xl px-3 py-2 w-full"
          >
            <option value="">Ingen</option>
            <option value="partner_first">Min kæreste sagde det først</option>
            <option value="me_first">Jeg sagde det først</option>
            <option value="partner_only">Kun min kæreste sagde det</option>
            <option value="me_only">Kun jeg sagde det</option>
          </select>
        </div>

        <MoodBarometer mood={mood} setMood={setMood} />

        <EmotionTagsSelector
          chipCategories={chipCategories}
          customTags={customTags}
          selectedTags={selectedTags}
          newTag={newTag}
          newTagCategory={newTagCategory}
          onToggleTag={onToggleTag}
          onAddTag={onAddTag}
          setNewTag={setNewTag}
          setNewTagCategory={setNewTagCategory}
        />

        {/* Ærlighedssnak */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Ærlighedssnak?</label>
          <select
            value={honestyTalk}
            onChange={(e) => setHonestyTalk(e.target.value)}
            className="border rounded-xl px-3 py-2 w-full"
          >
            <option value="nej">Nej</option>
            <option value="ja">Ja</option>
          </select>
          {honestyTalk === "ja" && (
            <input
              type="text"
              value={honestyTopic}
              onChange={(e) => setHonestyTopic(e.target.value)}
              className="border rounded px-3 py-2 w-full mt-2"
              placeholder="Hvad omhandlede det?"
              maxLength={64}
            />
          )}
        </div>

        {/* Gave */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Gave?</label>
          <select
            value={gift}
            onChange={(e) => {
              setGift(e.target.value);
              if (e.target.value === "nej") setGifts([{ giftWhat: "", giftCost: "" }]);
            }}
            className="border rounded-xl px-3 py-2 w-full"
          >
            <option value="nej">Nej</option>
            <option value="ja">Ja</option>
          </select>
          {gift === "ja" && (
            <div className="flex flex-col gap-2 mt-2">
              {gifts.map((g, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={g.giftWhat}
                    onChange={(e) => {
                      const newGifts = [...gifts];
                      newGifts[i].giftWhat = e.target.value;
                      setGifts(newGifts);
                    }}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Hvad var gaven?"
                    maxLength={64}
                  />
                  <input
                    type="text"
                    value={g.giftCost}
                    onChange={(e) => {
                      const newGifts = [...gifts];
                      newGifts[i].giftCost = e.target.value;
                      setGifts(newGifts);
                    }}
                    className="border rounded px-3 py-2 w-32"
                    placeholder="Pris"
                    maxLength={32}
                  />
                  {gifts.length > 1 && (
                    <button
                      type="button"
                      className="text-red-600 font-bold px-2"
                      onClick={() => setGifts(gifts.filter((_, idx) => idx !== i))}
                      tabIndex={-1}
                      title="Fjern gave"
                    >
                      –
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="mt-1 px-3 py-1 rounded bg-green-600 text-white font-semibold w-fit"
                onClick={() => setGifts([...gifts, { giftWhat: "", giftCost: "" }])}
                tabIndex={-1}
              >
                + Tilføj gave
              </button>
            </div>
          )}
        </div>

        {/* Blomster */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Blomster?</label>
          <select
            value={flowers}
            onChange={(e) => setFlowers(e.target.value)}
            className="border rounded-xl px-3 py-2 w-full"
          >
            <option value="nej">Nej</option>
            <option value="ja">Ja</option>
          </select>
        </div>

        {/* Alkohol */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Drak I alkohol?</label>
          <select
            value={alcohol}
            onChange={(e) => setAlcohol(e.target.value)}
            className="border rounded-xl px-3 py-2 w-full"
          >
            <option value="nej">Nej</option>
            <option value="ja">Ja</option>
          </select>
        </div>

        {/* Dateday */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Dateday?</label>
          <select
            value={dateday}
            onChange={(e) => {
              setDateday(e.target.value);
              if (e.target.value === "nej") setDatedayGifts([{ giftWhat: "", giftCost: "" }]);
            }}
            className="border rounded-xl px-3 py-2 w-full"
          >
            <option value="nej">Nej</option>
            <option value="ja">Ja</option>
          </select>
        </div>

        {/* Gaver til dateday */}
        {dateday === "ja" && (
          <div className="mb-4">
            <label className="block font-medium mb-1">Gaver til dateday</label>
            <div className="flex flex-col gap-2 mt-2">
              {datedayGifts.map((g, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={g.giftWhat}
                    onChange={(e) => {
                      const newGifts = [...datedayGifts];
                      newGifts[i].giftWhat = e.target.value;
                      setDatedayGifts(newGifts);
                    }}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Hvad var gaven?"
                    maxLength={64}
                  />
                  <input
                    type="text"
                    value={g.giftCost}
                    onChange={(e) => {
                      const newGifts = [...datedayGifts];
                      newGifts[i].giftCost = e.target.value;
                      setDatedayGifts(newGifts);
                    }}
                    className="border rounded px-3 py-2 w-32"
                    placeholder="Pris"
                    maxLength={32}
                  />
                  {datedayGifts.length > 1 && (
                    <button
                      type="button"
                      className="text-red-600 font-bold px-2"
                      onClick={() => setDatedayGifts(datedayGifts.filter((_, idx) => idx !== i))}
                      tabIndex={-1}
                      title="Fjern gave"
                    >
                      –
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="mt-1 px-3 py-1 rounded bg-green-600 text-white font-semibold w-fit"
                onClick={() => setDatedayGifts([...datedayGifts, { giftWhat: "", giftCost: "" }])}
                tabIndex={-1}
              >
                + Tilføj gave
              </button>
            </div>
          </div>
        )}

        {/* Submit & Cancel */}
        <div className="flex gap-3 mt-4">
          <button
            className="btn-primary flex-1 shadow"
            type="submit"
            disabled={loading}
          >
            {loading ? "Gemmer..." : editingId ? "Opdater indtjekning" : "Gem"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 rounded bg-gray-200 border border-gray-400 text-gray-800 font-semibold shadow"
            >
              Annuller redigering
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default CheckinForm;
