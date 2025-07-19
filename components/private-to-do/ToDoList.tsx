import React, { useState } from "react";
import { CheckCircle, Circle, Trash, Pencil, Save, X, RefreshCcw } from "lucide-react";
import { ToDo } from "@/lib/todoApi";

const categories = [
  { key: "work", label: "Arbejde", color: "#7356bf" },
  { key: "home", label: "Hjem", color: "#fe8a71" },
  { key: "fitness", label: "Træning", color: "#00bfae" },
  { key: "other", label: "Andet", color: "#fae100" },
];

const repeatLabels: Record<string, string> = {
  daily: "Daglig",
  weekly: "Ugentlig",
  monthly: "Månedlig",
};

export default function ToDoList({
  todos,
  loading,
  onToggle,
  onDelete,
  onUpdate,
  readOnly = false,
}: {
  todos: ToDo[];
  loading: boolean;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<ToDo>) => void;
  readOnly?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ToDo>>({});

  if (loading) return <div className="text-center text-gray-400">Indlæser to-dos…</div>;
  if (todos.length === 0) return <div className="text-center text-gray-400">Ingen to-dos endnu.</div>;

  function startEdit(todo: ToDo) {
    setEditingId(todo.id);
    setEditData({
      text: todo.text,
      category: todo.category,
      priority: todo.priority,
      deadline: todo.deadline ? todo.deadline.slice(0, 10) : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({});
  }

  function saveEdit(id: string) {
    if (onUpdate) {
      onUpdate(id, { ...editData });
    }
    setEditingId(null);
    setEditData({});
  }

  return (
    <div className="grid gap-4">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className={`flex items-center gap-4 bg-white rounded-2xl shadow-lg p-4 transition group border-2
            ${todo.done ? "border-green-400 opacity-70" : "border-transparent hover:border-indigo-300"}`}
        >
          <button
            onClick={() => !readOnly && onToggle(todo.id, !todo.done)}
            disabled={readOnly || editingId === todo.id}
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

          {/* === EDIT-MODE === */}
          {editingId === todo.id ? (
            <form
              className="flex-1 flex flex-col gap-2"
              onSubmit={e => {
                e.preventDefault();
                saveEdit(todo.id);
              }}
            >
              <input
                className="border rounded px-2 py-1 font-medium"
                value={editData.text || ""}
                onChange={e => setEditData(ed => ({ ...ed, text: e.target.value }))}
                autoFocus
              />
              <div className="flex gap-2 items-center">
                <select
                  className="border rounded px-2 py-1"
                  value={editData.category}
                  onChange={e => setEditData(ed => ({ ...ed, category: e.target.value }))}
                >
                  {categories.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
                <select
                  className="border rounded px-2 py-1"
                  value={editData.priority}
                  onChange={e => setEditData(ed => ({ ...ed, priority: e.target.value as ToDo["priority"] }))}
                >
                  <option value="high">Vigtig</option>
                  <option value="medium">Normal</option>
                  <option value="low">Lav</option>
                </select>
                <input
                  type="date"
                  className="border rounded px-2 py-1"
                  value={editData.deadline || ""}
                  onChange={e => setEditData(ed => ({ ...ed, deadline: e.target.value }))}
                />
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1 ml-2"
                  title="Gem"
                >
                  <Save size={18} />
                </button>
                <button
                  type="button"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded px-3 py-1"
                  onClick={cancelEdit}
                  title="Annullér"
                >
                  <X size={18} />
                </button>
              </div>
            </form>
          ) : (
            // === VIEW-MODE ===
            <div className="flex-1">
              <div className={`font-medium text-lg flex items-center gap-2 ${todo.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                {todo.text}
                {/* REPEAT BADGE */}
                {todo.repeat_type && todo.repeat_type !== "never" && (
                  <span className="ml-2 inline-flex items-center bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded font-semibold">
                    <RefreshCcw size={14} className="mr-1" />
                    {repeatLabels[todo.repeat_type] || "Gentag"}
                  </span>
                )}
              </div>
              <div className="flex gap-2 items-center mt-1">
                <span className="text-xs" style={{ color: categories.find(c => c.key === todo.category)?.color }}>
                  {categories.find(c => c.key === todo.category)?.label}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ml-2 font-semibold`}
                  style={{
                    background:
                      todo.priority === "high"
                        ? "#fe8a71"
                        : todo.priority === "medium"
                        ? "#7356bf22"
                        : "#00bfae22",
                    color:
                      todo.priority === "high"
                        ? "#fe8a71"
                        : todo.priority === "medium"
                        ? "#7356bf"
                        : "#00bfae",
                  }}
                >
                  {todo.priority === "high"
                    ? "Vigtig"
                    : todo.priority === "medium"
                    ? "Normal"
                    : "Lav"}
                </span>
                {todo.deadline && (
                  <span className="text-xs ml-2 text-gray-500">
                    Deadline: {new Date(todo.deadline).toLocaleDateString("da-DK")}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* === ACTION BUTTONS === */}
          {!readOnly && editingId !== todo.id && (
            <>
              <button
                className="text-gray-400 hover:text-indigo-700 transition"
                onClick={() => startEdit(todo)}
                title="Rediger"
              >
                <Pencil size={20} />
              </button>
              <button
                className="text-gray-300 hover:text-red-500 transition"
                onClick={() => onDelete(todo.id)}
                title="Slet"
              >
                <Trash size={20} />
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
