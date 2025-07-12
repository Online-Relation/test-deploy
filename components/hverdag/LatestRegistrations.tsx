// components/hverdag/LatestRegistrations.tsx

import React from "react";

interface LatestRegistrationsProps {
  latest: any[];
  fetching: boolean;
  errorMsg?: string | null;
  onEdit: (item: any) => void;
}

const moodOptions = [
  { value: 1, label: "Frost", color: "bg-blue-200 border-blue-400 text-blue-900" },
  { value: 2, label: "Kølig", color: "bg-cyan-200 border-cyan-400 text-cyan-900" },
  { value: 3, label: "Neutral", color: "bg-gray-200 border-gray-400 text-gray-900" },
  { value: 4, label: "Lun", color: "bg-orange-200 border-orange-400 text-orange-900" },
  { value: 5, label: "Hed", color: "bg-red-200 border-red-400 text-red-900" },
];

// Mapping for ily_who-feltet
const ilyWhoText: Record<string, string> = {
  partner_first: "Min kæreste sagde det først",
  me_first: "Jeg sagde det først",
  partner_only: "Kun min kæreste sagde det",
  me_only: "Kun jeg sagde det",
  "": "", // Ingen
  mig: "Kun jeg sagde det", // gamle data support
  partner: "Kun min kæreste sagde det", // gamle data support
  begge: "Begge sagde det", // gamle data support
};

const LatestRegistrations: React.FC<LatestRegistrationsProps> = ({
  latest,
  fetching,
  errorMsg,
  onEdit,
}) => {
  return (
    <div className="rounded-2xl shadow bg-white p-4 mt-6">
      <h3 className="font-semibold mb-3 text-lg">Seneste indtjekninger</h3>
      {errorMsg ? (
        <div className="text-center text-red-500 break-all">
          {typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg)}
        </div>
      ) : fetching ? (
        <div className="text-center text-gray-500">Henter...</div>
      ) : latest.length === 0 ? (
        <div className="text-center text-gray-400">Ingen registreringer endnu.</div>
      ) : (
        <ul className="space-y-2">
          {latest.map((item) => {
            const mood = moodOptions.find((m) => m.value === item.mood);
            return (
              <li
                key={item.id}
                className="flex items-center justify-between border-b pb-1 last:border-b-0 gap-1 flex-wrap"
              >
                <span className="text-sm">{item.checkin_date}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${mood?.color}`}>
                  {mood?.label}
                </span>
                <span className="text-xs">
                  {item.was_together ? "Sammen" : "Ikke sammen"}
                </span>
                <span className="text-xs">
                  {item.conflict ? "Konflikt" : ""}
                </span>
                <span className="text-xs">
                  {ilyWhoText[item.ily_who || ""] || ""}
                </span>
                <button
                  className="ml-2 px-2 py-1 text-xs rounded bg-yellow-300"
                  onClick={() => onEdit(item)}
                  type="button"
                >
                  Rediger
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LatestRegistrations;
