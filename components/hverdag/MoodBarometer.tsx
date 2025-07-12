// components/hverdag/MoodBarometer.tsx

import React from "react";

const moodOptions = [
  { value: 1, label: "Frost", color: "bg-blue-200 border-blue-400 text-blue-900" },
  { value: 2, label: "Kølig", color: "bg-cyan-200 border-cyan-400 text-cyan-900" },
  { value: 3, label: "Neutral", color: "bg-gray-200 border-gray-400 text-gray-900" },
  { value: 4, label: "Lun", color: "bg-orange-200 border-orange-400 text-orange-900" },
  { value: 5, label: "Hed", color: "bg-red-200 border-red-400 text-red-900" },
];

interface MoodBarometerProps {
  mood: number;
  setMood: (value: number) => void;
}

const MoodBarometer: React.FC<MoodBarometerProps> = ({ mood, setMood }) => {
  return (
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
  );
};

export default MoodBarometer;
