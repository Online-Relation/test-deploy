// components/hverdag/ConflictField.tsx

import React from "react";

interface ConflictFieldProps {
  conflict: string;
  conflictText: string;
  setConflict: (value: string) => void;
  setConflictText: (value: string) => void;
}

const ConflictField: React.FC<ConflictFieldProps> = ({
  conflict,
  conflictText,
  setConflict,
  setConflictText,
}) => {
  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">Var der konflikt?</label>
      <select
        value={conflict}
        onChange={(e) => {
          setConflict(e.target.value);
          if (e.target.value !== "ja") setConflictText("");
        }}
        className="border rounded-xl px-3 py-2 w-full"
        required
      >
        <option value="">Vælg...</option>
        <option value="ja">Ja</option>
        <option value="nej">Nej</option>
      </select>

      {conflict === "ja" && (
        <div className="mt-4">
          <label className="block font-medium mb-1">Beskriv konflikten (valgfrit)</label>
          <textarea
            className="border rounded-xl px-3 py-2 w-full"
            rows={2}
            value={conflictText}
            onChange={(e) => setConflictText(e.target.value)}
            placeholder="Skriv kort hvad konflikten handlede om..."
          />
        </div>
      )}
    </div>
  );
};

export default ConflictField;
