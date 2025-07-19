"use client";

import React, { useEffect, useState } from "react";
import { fetchTodos, addTodo, updateTodo, deleteTodo, ToDo } from "@/lib/todoApi";
import ToDoForm from "@/components/private-to-do/ToDoForm";
import ToDoList from "@/components/private-to-do/ToDoList";
import { useUserContext } from "@/context/UserContext";

export default function ToDoDashboard() {
  const { user, loading: userLoading } = useUserContext();
  const [todos, setTodos] = useState<ToDo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchTodos(user.id)
      .then(setTodos)
      .finally(() => setLoading(false));
  }, [user?.id]);

  async function handleAdd(todo: Omit<ToDo, "id" | "created_at" | "updated_at">) {
    if (!user?.id) return;
    const newTodo = await addTodo({ ...todo, user_id: user.id });
    setTodos((t) => [newTodo, ...t]);
  }

  // Repeat-LOGIK indbygget:
  async function handleToggle(id: string, done: boolean) {
    const toggledTodo = todos.find(todo => todo.id === id);
    if (!toggledTodo) return;

    // Opdater selve to-do'en
    const updated = await updateTodo(id, { done });
    setTodos((t) => t.map(todo => todo.id === id ? updated : todo));

    // Hvis "done" + repeat-type ≠ never → opret næste
    if (
      done === true &&
      toggledTodo.repeat_type &&
      toggledTodo.repeat_type !== "never"
    ) {
      let nextDeadline: string | null = null;
      const currentDeadline = toggledTodo.deadline ? new Date(toggledTodo.deadline) : new Date();
      if (toggledTodo.repeat_type === "daily") {
        nextDeadline = new Date(currentDeadline.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      } else if (toggledTodo.repeat_type === "weekly") {
        nextDeadline = new Date(currentDeadline.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      } else if (toggledTodo.repeat_type === "monthly") {
        const nextMonth = new Date(currentDeadline);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextDeadline = nextMonth.toISOString().slice(0, 10);
      }

      // Tjek om vi skal stoppe for repeat_until
      if (
        toggledTodo.repeat_until &&
        nextDeadline &&
        new Date(nextDeadline) > new Date(toggledTodo.repeat_until)
      ) {
        return;
      }

      // Opret ny to-do med næste deadline, men ikke "done"
      if (nextDeadline) {
        const newTodoData = {
          ...toggledTodo,
          id: undefined,
          created_at: undefined,
          updated_at: undefined,
          done: false,
          deadline: nextDeadline,
        };
        const newTodo = await addTodo(newTodoData);
        setTodos((prev) => [newTodo, ...prev]);
      }
    }
  }

  async function handleDelete(id: string) {
    await deleteTodo(id);
    setTodos((t) => t.filter(todo => todo.id !== id));
  }

  async function handleUpdate(id: string, updates: Partial<ToDo>) {
    const updated = await updateTodo(id, updates);
    setTodos((t) => t.map(todo => todo.id === id ? updated : todo));
  }

  // Counter og filtrering
  const doneCount = todos.filter(t => t.done).length;
  const openCount = todos.filter(t => !t.done).length;
  const activeTodos = todos.filter(todo => !todo.done);
  const completedTodos = todos
    .filter(todo => todo.done)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10);

  const filteredActive = activeTodos.filter(todo =>
    todo.text.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCompleted = completedTodos.filter(todo =>
    todo.text.toLowerCase().includes(search.toLowerCase())
  );

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-400">
        Henter brugerdata...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50 to-pink-50 py-10 px-2">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <h1 className="text-4xl font-extrabold text-center mb-2 tracking-tight text-indigo-800">
          To-Do Dash
        </h1>

        {/* Søgning */}
        <input
          type="text"
          placeholder="Søg to-do…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border-2 border-indigo-100 rounded-xl px-4 py-2 mb-2 w-full"
        />

        <ToDoForm onAdd={handleAdd} />

        {/* Aktive to-dos */}
        <ToDoList
          todos={filteredActive}
          loading={loading}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />

        {/* Historik */}
        {filteredCompleted.length > 0 && (
          <div>
            <h2 className="mt-8 mb-2 text-xl font-bold text-indigo-700">Historik (seneste 10 gennemførte)</h2>
            <ToDoList
              todos={filteredCompleted}
              loading={false}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              readOnly
            />
          </div>
        )}

        {/* Status-kasser helt i bunden */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <div className="rounded-2xl bg-white shadow flex flex-col items-center py-6">
            <span className="text-3xl font-extrabold text-indigo-700 mb-1">{openCount}</span>
            <span className="text-gray-600 font-semibold tracking-wide">Åbne to-dos</span>
          </div>
          <div className="rounded-2xl bg-white shadow flex flex-col items-center py-6">
            <span className="text-3xl font-extrabold text-green-600 mb-1">{doneCount}</span>
            <span className="text-gray-600 font-semibold tracking-wide">Gennemførte to-dos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
