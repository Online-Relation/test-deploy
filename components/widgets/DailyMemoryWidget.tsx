// /components/widgets/DailyMemoryWidget.tsx

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";

function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyMemoryWidget() {
  const { user } = useUserContext();
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setShow(false);
      setLoading(false);
      return;
    }

    const fetchMemory = async () => {
      const today = getTodayDateStr();
      const now = new Date();
      const hour = now.getHours();

      const { data, error } = await supabase
        .from("daily_memories")
        .select("id, memory_text")
        .eq("user_id", user.id)
        .eq("memory_date", today)
        .maybeSingle();

      // Skal kun vises hvis:
      // 1) Klokken er 20-23
      // 2) Der IKKE er indsendt et minde endnu for i dag
      if (!data && hour >= 20 && hour < 24) {
        setShow(true);
      } else {
        setShow(false);
      }
      setText(data?.memory_text || "");
      setLoading(false);
    };

    fetchMemory();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user?.id) return;

    const today = getTodayDateStr();

    const { error } = await supabase.from("daily_memories").insert([
      {
        user_id: user.id,
        memory_date: today,
        memory_text: text.trim(),
      },
    ]);
    if (!error) {
      setShow(false); // Skjul widget direkte efter submit!
    } else {
      alert("Kunne ikke gemme minde: " + error.message);
    }
  };

  if (loading || !show) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-5 flex flex-col items-center">
      <h2 className="font-bold text-lg mb-2 text-indigo-800">Dagens Minde</h2>
      <p className="text-gray-500 mb-3 text-center">
        Hvad var <span className="font-semibold text-indigo-700">det bedste i dag?</span>
      </p>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <textarea
          className="rounded-xl border border-indigo-200 focus:border-indigo-500 transition p-3 w-full resize-none text-sm"
          rows={3}
          maxLength={180}
          placeholder="Skriv kort her..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-6 py-2 font-semibold transition shadow"
          type="submit"
        >
          Gem mit minde
        </button>
      </form>
    </div>
  );
}
