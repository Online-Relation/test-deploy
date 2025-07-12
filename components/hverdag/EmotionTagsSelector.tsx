// components/hverdag/EmotionTagsSelector.tsx

import React from "react";

interface ChipCategory {
  name: string;
  chips: string[];
}

interface EmotionTagsSelectorProps {
  chipCategories: ChipCategory[];
  customTags: string[];
  selectedTags: string[];
  newTag: string;
  newTagCategory: string;
  onToggleTag: (tag: string) => void;
  onAddTag: () => void;
  setNewTag: (value: string) => void;
  setNewTagCategory: (value: string) => void;
}

const EmotionTagsSelector: React.FC<EmotionTagsSelectorProps> = ({
  chipCategories,
  customTags,
  selectedTags,
  newTag,
  newTagCategory,
  onToggleTag,
  onAddTag,
  setNewTag,
  setNewTagCategory,
}) => {
  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">Dagens følelser / tanker</label>
      <div className="flex flex-col gap-3 mb-2">
        {chipCategories.map((cat) => (
          <div key={cat.name}>
            <div className="font-semibold text-xs mb-1 text-gray-600">{cat.name}</div>
            <div className="flex flex-wrap gap-2">
              {cat.chips.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
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
              {customTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddTag();
            }
          }}
        />
        <select
          value={newTagCategory}
          onChange={(e) => setNewTagCategory(e.target.value)}
          className="border rounded-xl px-2 py-2"
          style={{ minWidth: 120 }}
        >
          <option value="">Vælg kategori</option>
          {chipCategories.map((cat) => (
            <option key={cat.name} value={cat.name}>
              {cat.name}
            </option>
          ))}
          <option value="Egne følelser/tanker">Egne følelser/tanker</option>
        </select>
        <button
          type="button"
          disabled={!newTag.trim()}
          onClick={onAddTag}
          className="px-3 py-2 rounded bg-green-600 text-white font-semibold"
        >
          Tilføj
        </button>
      </div>
    </div>
  );
};

export default EmotionTagsSelector;
