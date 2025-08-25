// app/langeland/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import TasksCard from "@/components/langeland/TasksCard";
import ShoppingCard from "@/components/langeland/ShoppingCard";
import IdeasCard from "@/components/langeland/IdeasCard";
import { Button } from "@/components/ui/button";

export default function LangelandPage() {
  // Starter på "Alle"
  const [tab, setTab] = useState<"all" | "tasks" | "shopping" | "ideas">("all");

  useEffect(() => {
    console.log("🏷️ Langeland tab:", tab);
  }, [tab]);

  const Chip = ({ id, label }: { id: "all" | "tasks" | "shopping" | "ideas"; label: string }) => (
    <Button
      variant={tab === id ? "primary" : "secondary"}
      className="h-8 px-3"
      onClick={() => setTab(id)}
    >
      {label}
    </Button>
  );

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">🏡 Langeland</h1>
            <p className="text-sm text-muted-foreground">
              Huskeliste, Indkøbsliste & Idéer (MVP)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Chip id="all" label="Alle" />
            <Chip id="tasks" label="Huskeliste" />
            <Chip id="shopping" label="Indkøbsliste" />
            <Chip id="ideas" label="Idéer & noter" />
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {tab === "all" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TasksCard />
              <ShoppingCard />
            </div>
            <IdeasCard />
          </>
        )}

        {tab === "tasks" && <TasksCard />}
        {tab === "shopping" && <ShoppingCard />}
        {tab === "ideas" && <IdeasCard />}
      </div>
    </div>
  );
}
