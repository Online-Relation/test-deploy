import React, { useState, useRef, useEffect } from "react";

const categories = [
  { key: "work", label: "Arbejde" },
  { key: "home", label: "Hjem" },
  { key: "fitness", label: "Træning" },
  { key: "other", label: "Andet" },
];

const repeatOptions = [
  { value: "never", label: "Gentag aldrig" },
  { value: "daily", label: "Gentag hver dag" },
  { value: "weekly", label: "Gentag hver uge" },
  { value: "monthly", label: "Gentag hver måned" },
];

export default function ToDoForm({ onAdd }: { onAdd: (data: any) => void }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("work");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [repeatType, setRepeatType] = useState("never");
  const [repeatUntil, setRepeatUntil] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autosize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({
      text: text.trim(),
      done: false,
      category,
      priority,
      deadline: deadline || null,
      repeat_type: repeatType,
      repeat_until: repeatType !== "never" && repeatUntil ? repeatUntil : null,
    });
    setText("");
    setPriority("medium");
    setDeadline("");
    setRepeatType("never");
    setRepeatUntil("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow px-4 py-5 flex flex-col gap-3 w-full"
    >
      {/* Første række: Tekstfelt */}
      <textarea
        ref={textareaRef}
        rows={2}
        placeholder="Hvad skal du gøre? (du kan skrive flere linjer)"
        value={text}
        onChange={e => setText(e.target.value)}
        className="border-2 border-indigo-200 focus:border-indigo-500 transition rounded-xl px-4 py-3 w-full font-medium resize-none min-h-[44px] max-h-[180px] bg-indigo-50 text-base"
        style={{ fontSize: 18, lineHeight: 1.5 }}
      />

      {/* Anden række: valgfelter og knap */}
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <select
          className="border-2 border-indigo-200 rounded-xl px-3 py-2 font-medium bg-indigo-50 flex-1"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat.key} value={cat.key}>{cat.label}</option>
          ))}
        </select>
        <select
          className="border-2 border-indigo-200 rounded-xl px-3 py-2 font-medium bg-indigo-50 flex-1"
          value={priority}
          onChange={e => setPriority(e.target.value)}
        >
          <option value="high">Vigtig</option>
          <option value="medium">Normal</option>
          <option value="low">Lav</option>
        </select>
        <input
          type="date"
          className="border-2 border-indigo-200 rounded-xl px-3 py-2 font-medium bg-indigo-50 flex-1"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
        />
      </div>

      {/* Tredje række: gentagelse */}
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <select
          className="border-2 border-indigo-200 rounded-xl px-3 py-2 font-medium bg-indigo-50 flex-1"
          value={repeatType}
          onChange={e => setRepeatType(e.target.value)}
        >
          {repeatOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {repeatType !== "never" && (
          <input
            type="date"
            className="border-2 border-indigo-200 rounded-xl px-3 py-2 font-medium bg-indigo-50 flex-1"
            value={repeatUntil}
            onChange={e => setRepeatUntil(e.target.value)}
            placeholder="Gentag indtil (valgfrit)"
          />
        )}
        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-6 py-2 font-semibold transition shadow min-w-[96px] flex-1"
          style={{ fontSize: 18 }}
        >
          Tilføj
        </button>
      </div>
    </form>
  );
}
