// app/indtjekning/hverdag/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import CheckinForm from "@/components/hverdag/CheckinForm";
import LatestRegistrations from "@/components/hverdag/LatestRegistrations";
import { useUserContext } from "@/context/UserContext";

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

export default function IndtjekningHverdag() {
  const { user } = useUserContext();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [wasTogether, setWasTogether] = useState("");
  const [conflict, setConflict] = useState("");
  const [conflictText, setConflictText] = useState("");
  const [mood, setMood] = useState(3);

  const [ilyWho, setIlyWho] = useState("");

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

  const [editingId, setEditingId] = useState<string | null>(null);

  // NYE FELTER:
  const [honestyTalk, setHonestyTalk] = useState("nej");
  const [honestyTopic, setHonestyTopic] = useState("");
  const [gift, setGift] = useState("nej");
  const [gifts, setGifts] = useState([{ giftWhat: "", giftCost: "" }]);
  const [flowers, setFlowers] = useState("nej");
  const [alcohol, setAlcohol] = useState("nej");

  // Dateday og tilhørende gaver:
  const [dateday, setDateday] = useState("nej");
  const [datedayGifts, setDatedayGifts] = useState([{ giftWhat: "", giftCost: "" }]);

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

  const handleToggleTag = (tag: string) => {
    setSelectedTags(selected =>
      selected.includes(tag)
        ? selected.filter(t => t !== tag)
        : [...selected, tag]
    );
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (!tag) return;

    if (
      !baseChips.includes(tag) &&
      !customTags.includes(tag) &&
      newTagCategory &&
      chipCategories.find(c => c.name === newTagCategory)
    ) {
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
      setCustomTags([...customTags, tag]);
    }
    if (!selectedTags.includes(tag)) setSelectedTags([...selectedTags, tag]);
    setNewTag("");
    setNewTagCategory("");
  };

  function loadForEdit(item: any) {
    setEditingId(item.id);
    setDate(item.checkin_date ? new Date(item.checkin_date) : undefined);
    setWasTogether(item.was_together ? "ja" : "nej");
    setConflict(item.conflict ? "ja" : "nej");
    setConflictText(item.conflict_text || "");
    setMood(item.mood);
    setSelectedTags(item.tags || []);
    setIlyWho(item.ily_who || "");

    // NYT - load felter fra item:
    setHonestyTalk(item.honesty_talk ? "ja" : "nej");
    setHonestyTopic(item.honesty_topic || "");
    setGift(item.gift ? "ja" : "nej");
    setGifts(item.gift && Array.isArray(item.gifts) ? item.gifts : [{ giftWhat: "", giftCost: "" }]);
    setFlowers(item.flowers ? "ja" : "nej");
    setAlcohol(item.alcohol ? "ja" : "nej");

    // Dateday
    setDateday(item.dateday || "nej");
    setDatedayGifts(item.dateday_gifts && Array.isArray(item.dateday_gifts) ? item.dateday_gifts : [{ giftWhat: "", giftCost: "" }]);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const checkin_date = date
      ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
          .getDate()
          .toString()
          .padStart(2, "0")}`
      : undefined;

    let result;
    if (editingId) {
      result = await supabase
        .from("daily_checkin")
        .update({
          checkin_date,
          was_together: wasTogether === "ja",
          conflict: conflict === "ja",
          conflict_text: conflict === "ja" ? conflictText : null,
          mood,
          tags: selectedTags,
          ily_who: ilyWho || null,

          honesty_talk: honestyTalk === "ja",
          honesty_topic: honestyTalk === "ja" ? honestyTopic : null,
          gift: gift === "ja",
          gifts: gift === "ja" ? gifts : null,
          flowers: flowers === "ja",
          alcohol: alcohol === "ja",

          dateday: dateday === "ja",
          dateday_gifts: dateday === "ja" ? datedayGifts : null,
        })
        .eq("id", editingId);
    } else {
      result = await supabase
        .from("daily_checkin")
        .insert({
          checkin_date,
          was_together: wasTogether === "ja",
          conflict: conflict === "ja",
          conflict_text: conflict === "ja" ? conflictText : null,
          mood,
          tags: selectedTags,
          ily_who: ilyWho || null,

          honesty_talk: honestyTalk === "ja",
          honesty_topic: honestyTalk === "ja" ? honestyTopic : null,
          gift: gift === "ja",
          gifts: gift === "ja" ? gifts : null,
          flowers: flowers === "ja",
          alcohol: alcohol === "ja",

          dateday: dateday === "ja",
          dateday_gifts: dateday === "ja" ? datedayGifts : null,
        });
    }
    const { error } = result;

    if (!error && flowers === "ja" && user?.id) {
      const now = new Date().toISOString();
      const { error: flowerError } = await supabase
        .from("flowers_log")
        .insert([{ user_id: user.id, given_at: now }]);
      if (flowerError) {
        console.error("Fejl ved indsættelse i flowers_log:", flowerError.message);
      }
    }

    setLoading(false);
    if (!error) {
      setDone(true);
      setConflictText("");
      setSelectedTags([]);
      setIlyWho("");
      setEditingId(null);

      setHonestyTalk("nej");
      setHonestyTopic("");
      setGift("nej");
      setGifts([{ giftWhat: "", giftCost: "" }]);
      setFlowers("nej");
      setAlcohol("nej");

      setDateday("nej");
      setDatedayGifts([{ giftWhat: "", giftCost: "" }]);
    } else {
      alert("Der opstod en fejl! Prøv igen.");
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setDate(new Date());
    setWasTogether("");
    setConflict("");
    setConflictText("");
    setMood(3);
    setSelectedTags([]);
    setIlyWho("");

    setHonestyTalk("nej");
    setHonestyTopic("");
    setGift("nej");
    setGifts([{ giftWhat: "", giftCost: "" }]);
    setFlowers("nej");
    setAlcohol("nej");

    setDateday("nej");
    setDatedayGifts([{ giftWhat: "", giftCost: "" }]);
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
        <LatestRegistrations latest={latest} fetching={fetching} errorMsg={errorMsg} onEdit={loadForEdit} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-6 px-4">
      <CheckinForm
        date={date}
        setDate={setDate}
        registeredDates={registeredDates}
        wasTogether={wasTogether}
        setWasTogether={setWasTogether}
        conflict={conflict}
        conflictText={conflictText}
        setConflict={setConflict}
        setConflictText={setConflictText}
        mood={mood}
        setMood={setMood}
        chipCategories={chipCategories}
        customTags={customTags}
        selectedTags={selectedTags}
        newTag={newTag}
        newTagCategory={newTagCategory}
        onToggleTag={handleToggleTag}
        onAddTag={handleAddTag}
        setNewTag={setNewTag}
        setNewTagCategory={setNewTagCategory}
        ilyWho={ilyWho}
        setIlyWho={setIlyWho}
        loading={loading}
        editingId={editingId}
        onSubmit={handleSubmit}
        onCancelEdit={handleCancelEdit}

        honestyTalk={honestyTalk}
        setHonestyTalk={setHonestyTalk}
        honestyTopic={honestyTopic}
        setHonestyTopic={setHonestyTopic}
        gift={gift}
        setGift={setGift}
        gifts={gifts}
        setGifts={setGifts}
        flowers={flowers}
        setFlowers={setFlowers}
        alcohol={alcohol}
        setAlcohol={setAlcohol}

        dateday={dateday}
        setDateday={setDateday}
        datedayGifts={datedayGifts}
        setDatedayGifts={setDatedayGifts}
      />
      <LatestRegistrations latest={latest} fetching={fetching} errorMsg={errorMsg} onEdit={loadForEdit} />
    </div>
  );
}
