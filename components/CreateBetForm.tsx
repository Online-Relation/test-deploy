// /app/components/CreateBetForm.tsx

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Profile {
  id: string;
  username: string;
}

interface Reward {
  id: string;
  title: string;
}

export default function CreateBetForm() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_at: "",
    end_at: "",
    participant_1: "",
    participant_2: "",
    reward_id_1: "",
    reward_id_2: "",
    template: false,
    template_name: "",
    guess_1_min: "",
    guess_1_max: "",
    guess_2_min: "",
    guess_2_max: "",
  });

  // Hent profiler og præmier fra Supabase
  useEffect(() => {
    (async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username");
      setProfiles(profileData || []);

      const { data: rewardData } = await supabase
        .from("rewards")
        .select("id, title");
      setRewards(rewardData || []);
    })();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
        ...(name === "template" && !(e.target as HTMLInputElement).checked
          ? { template_name: "" }
          : {}),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("bets").insert([
      {
        ...form,
        start_at: new Date(form.start_at),
        end_at: new Date(form.end_at),
        status: "active",
        template_name: form.template ? form.template_name : null,
        guess_1_min: form.guess_1_min !== "" ? Number(form.guess_1_min) : null,
        guess_1_max: form.guess_1_max !== "" ? Number(form.guess_1_max) : null,
        guess_2_min: form.guess_2_min !== "" ? Number(form.guess_2_min) : null,
        guess_2_max: form.guess_2_max !== "" ? Number(form.guess_2_max) : null,
      },
    ]);
    setLoading(false);
    if (!error) {
      alert("Væddemål oprettet!");
      setForm({
        title: "",
        description: "",
        start_at: "",
        end_at: "",
        participant_1: "",
        participant_2: "",
        reward_id_1: "",
        reward_id_2: "",
        template: false,
        template_name: "",
        guess_1_min: "",
        guess_1_max: "",
        guess_2_min: "",
        guess_2_max: "",
      });
    } else {
      alert("Fejl: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">Opret væddemål</h2>
      <input
        name="title"
        placeholder="Overskrift"
        value={form.title}
        onChange={handleChange}
        required
        className="w-full p-2 rounded border"
      />
      <textarea
        name="description"
        placeholder="Beskrivelse"
        value={form.description}
        onChange={handleChange}
        rows={3}
        className="w-full p-2 rounded border"
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm">Start dato & tid</label>
          <input
            name="start_at"
            type="datetime-local"
            value={form.start_at}
            onChange={handleChange}
            required
            className="w-full p-2 rounded border"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm">Slut dato & tid</label>
          <input
            name="end_at"
            type="datetime-local"
            value={form.end_at}
            onChange={handleChange}
            required
            className="w-full p-2 rounded border"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm">Deltager 1</label>
          <select name="participant_1" value={form.participant_1} onChange={handleChange} required className="w-full p-2 rounded border">
            <option value="">Vælg deltager</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.username}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm">Deltager 2</label>
          <select name="participant_2" value={form.participant_2} onChange={handleChange} required className="w-full p-2 rounded border">
            <option value="">Vælg deltager</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.username}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm">Præmie til deltager 1</label>
          <select name="reward_id_1" value={form.reward_id_1} onChange={handleChange} className="w-full p-2 rounded border">
            <option value="">Vælg præmie</option>
            {rewards.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm">Præmie til deltager 2</label>
          <select name="reward_id_2" value={form.reward_id_2} onChange={handleChange} className="w-full p-2 rounded border">
            <option value="">Vælg præmie</option>
            {rewards.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Gæt som interval */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm">Deltager 1's gæt (interval)</label>
          <div className="flex gap-2">
            <input
              type="number"
              name="guess_1_min"
              value={form.guess_1_min}
              onChange={handleChange}
              placeholder="Min"
              className="w-1/2 p-2 rounded border"
            />
            <input
              type="number"
              name="guess_1_max"
              value={form.guess_1_max}
              onChange={handleChange}
              placeholder="Max"
              className="w-1/2 p-2 rounded border"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-sm">Deltager 2's gæt (interval)</label>
          <div className="flex gap-2">
            <input
              type="number"
              name="guess_2_min"
              value={form.guess_2_min}
              onChange={handleChange}
              placeholder="Min"
              className="w-1/2 p-2 rounded border"
            />
            <input
              type="number"
              name="guess_2_max"
              value={form.guess_2_max}
              onChange={handleChange}
              placeholder="Max"
              className="w-1/2 p-2 rounded border"
            />
          </div>
        </div>
      </div>
      {/* Skabelon */}
      <label className="inline-flex items-center mt-2">
        <input
          type="checkbox"
          name="template"
          checked={form.template}
          onChange={handleChange}
          className="mr-2"
        />
        Gem som skabelon
      </label>

      {form.template && (
        <input
          name="template_name"
          placeholder="Navn på skabelon"
          value={form.template_name}
          onChange={handleChange}
          required={form.template}
          className="w-full p-2 rounded border mt-2"
        />
      )}

      <button type="submit" disabled={loading} className="w-full p-2 mt-2 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition">
        {loading ? "Opretter..." : "Opret væddemål"}
      </button>
    </form>
  );
}
