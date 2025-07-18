// /components/FancyTodoDashboard.tsx

"use client";

import React, { useState } from "react";
import { CheckCircle, Circle } from "lucide-react";

// Dummy kategorier
const categories = [
  { key: "work", label: "Arbejde", color: "#7356bf" },
  { key: "home", label: "Hjem", color: "#fe8a71" },
  { key: "fitness", label: "Træning", color: "#00bfae" },
  { key: "other", label: "Andet", color: "#fae100" },
];

// Dummy todo's
const initialTodos = [
  { id: 1, text: "Skriv rapport færdig", done: false, category: "work" },
  { id: 2, text: "Gå tur med hunden", done: true, category: "home" },
  { id: 3, text: "Handl ind til aftensmad", done: false, category: "home" },
  { id: 4, text: "30 min cardio", done: true, category: "fitness" },
  { id: 5, text: "Læs i min bog", done: false, category: "other" },
  { id: 6, text: "Lav budget for juli", done: false, category: "work" },
  { id: 7, text: "Stræk ud", done: true, category: "fitness" },
];

export default function FancyTodoDashboard() {
  const [todos, setTodos] = useState(initialTodos);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("work");

  // Count udførte todo's
  const doneCount = todos.filter((t) => t.done).length;

  // Per kategori
  const doneByCat = categories.map((cat) => ({
    ...cat,
    count: todos.filter((t) => t.done && t.category === cat.key).length,
  }));

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos([
      ...todos,
      {
        id: Date.now(),
        text: input.trim(),
        done: false,
        category,
      },
    ]);
    setInput("");
  }

  function toggleTodo(id: number) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50 to-pink-50 py-10 px-2">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <h1 className="text-4xl font-extrabold text-center mb-2 tracking-tight text-indigo-800">To-Do Dash</h1>

        {/* Stat bokse */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white shadow p-6 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-green-500 mb-1">{doneCount}</span>
            <span className="text-gray-600">Udførte to-dos</span>
          </div>
          <div className="md:col-span-2 rounded-2xl bg-white shadow p-4 flex flex-wrap gap-3 items-center justify-center">
            {doneByCat.map((cat) => (
              <div
                key={cat.key}
                className="rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold"
                style={{
                  background: cat.color + "22",
                  color: cat.color,
                  border: `1.5px solid ${cat.color}`,
                }}
              >
                <span className="text-base">•</span>
                {cat.label}
                <span className="bg-white ml-2 rounded-full px-2 py-1 text-[10px] font-mono" style={{ color: cat.color, border: `1px solid ${cat.color}` }}>
                  {cat.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tilføj to-do */}
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3 bg-white rounded-2xl shadow px-4 py-5 items-center">
          <input
            className="border-2 border-indigo-200 focus:border-indigo-500 transition rounded-xl px-4 py-2 w-full md:w-2/3 font-medium"
            placeholder="Hvad skal du gøre?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <select
            className="border-2 border-indigo-200 rounded-xl px-3 py-2 font-medium bg-indigo-50"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-6 py-2 font-semibold transition shadow"
          >
            Tilføj
          </button>
        </form>

        {/* To-do liste */}
        <div className="grid gap-4">
          {todos.length === 0 && (
            <div className="text-center text-gray-400">Ingen to-dos endnu.</div>
          )}
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-4 bg-white rounded-2xl shadow-lg p-4 transition group border-2
              ${todo.done ? "border-green-400 opacity-70" : "border-transparent hover:border-indigo-300"}`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className="flex items-center justify-center rounded-full transition w-9 h-9"
                aria-label={todo.done ? "Marker som ikke udført" : "Marker som udført"}
                style={{
                  border: `2.5px solid ${categories.find(c => c.key === todo.category)?.color || "#999"}`,
                  background: todo.done ? (categories.find(c => c.key === todo.category)?.color || "#16a34a") : "white"
                }}
              >
                {todo.done ? (
                  <CheckCircle size={28} className="text-white" />
                ) : (
                  <Circle size={26} className="text-gray-300" />
                )}
              </button>
              <div className="flex-1">
                <div className={`font-medium text-lg ${todo.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                  {todo.text}
                </div>
                <div className="text-xs mt-1" style={{ color: categories.find(c => c.key === todo.category)?.color }}>
                  {categories.find(c => c.key === todo.category)?.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
