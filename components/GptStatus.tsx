// /components/GptStatus.tsx

import { useEffect, useState } from "react";

interface Props {
  model: string;
}

export default function GptStatus({ model }: Props) {
  const [status, setStatus] = useState<"ok" | "error" | "loading">("loading");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/gpt-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model }),
        });

        const data = await res.json();
        if (res.ok && data?.ok) setStatus("ok");
        else setStatus("error");
      } catch {
        setStatus("error");
      }
    };

    check();
  }, [model]);

  if (status === "loading") return null;

  return (
    <div
      className={`text-sm px-3 py-2 rounded shadow w-fit ${
        status === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {status === "ok"
        ? `GPT-${model.includes("4") ? "4" : "3.5"} er forbundet og klar`
        : "GPT kunne ikke tilgås"}
    </div>
  );
}
