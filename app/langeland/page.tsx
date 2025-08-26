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
      className="h-8 px-3 shrink-0"
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
            <p className="text-sm text-muted-foreground">Huskeliste, Indkøbsliste & Idéer (MVP)</p>
          </div>

          {/* Responsive chip-række: fuld bredde + horisontal scroll på mobil */}
          <div className="w-full md:w-auto mt-2 md:mt-0">
            <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible -mx-1 pr-1 md:mx-0 md:pr-0">
              <Chip id="all" label="Alle" />
              <Chip id="tasks" label="Huskeliste" />
              <Chip id="shopping" label="Indkøbsliste" />
              <Chip id="ideas" label="Idéer & noter" />
            </div>
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
