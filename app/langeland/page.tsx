// app/langeland/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import TasksCard from "@/components/langeland/TasksCard";
import ShoppingCard from "@/components/langeland/ShoppingCard";
import IdeasCard from "@/components/langeland/IdeasCard";
import { Button } from "@/components/ui/button";
import { ClipboardList, Lightbulb, ShoppingBag } from "lucide-react";

type TabId = "tasks" | "shopping" | "ideas";

export default function LangelandPage() {
  const [tab, setTab] = useState<TabId>("tasks");

  useEffect(() => {
    console.log("🏷️ Langeland tab:", tab);
  }, [tab]);

  const SectionCard = ({
    id,
    title,
    description,
    icon,
    accent,
  }: {
    id: TabId;
    title: string;
    description: string;
    icon: React.ReactNode;
    accent: "blue" | "green" | "amber";
  }) => {
    const isActive = tab === id;

    const accentClasses =
      accent === "blue"
        ? "from-sky-50 to-sky-100 border-sky-200"
        : accent === "green"
        ? "from-emerald-50 to-emerald-100 border-emerald-200"
        : "from-amber-50 to-amber-100 border-amber-200";

    const dotClasses =
      accent === "blue"
        ? "bg-sky-400"
        : accent === "green"
        ? "bg-emerald-400"
        : "bg-amber-400";

    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        className={`w-full text-left rounded-2xl border bg-gradient-to-br px-4 py-3 md:px-5 md:py-4 shadow-sm transition-all active:scale-[0.98] ${
          accentClasses
        } ${
          isActive
            ? "ring-2 ring-offset-2 ring-indigo-400 shadow-md"
            : "hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 shadow-inner">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">
                {title}
              </span>
              {isActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                  <span className={`h-1.5 w-1.5 rounded-full ${dotClasses}`} />
                  Aktiv
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-600">{description}</p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-10 max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Hero / header */}
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 border border-amber-100 shadow-sm">
        <div className="flex flex-col gap-3 px-4 py-5 md:px-6 md:py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">
            Sommerhus · Langeland
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            🏡 Vores Langeland-univers
          </h1>
          <p className="max-w-xl text-sm md:text-base text-slate-700">
            Ét sted til alt det praktiske – og alt det hyggelige. Brug siden når
            I pakker, planlægger indkøb eller får idéer til huset og dagene derovre.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Klar til næste tur
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1">
              📱 Optimeret til mobil
            </span>
          </div>
        </div>
      </header>

      {/* Tre hovedområder */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Områder
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <SectionCard
            id="tasks"
            title="Huskeliste"
            description="Alt det I skal have styr på til og i sommerhuset – praktiske opgaver, små projekter og to-dos."
            icon={<ClipboardList className="h-5 w-5 text-sky-600" />}
            accent="blue"
          />
          <SectionCard
            id="shopping"
            title="Indkøb"
            description="Ting der skal købes næste gang – fra rengøring og basisvarer til hyggelige ekstra-sager."
            icon={<ShoppingBag className="h-5 w-5 text-emerald-600" />}
            accent="green"
          />
          <SectionCard
            id="ideas"
            title="Idéer & noter"
            description="Små tanker, forbedringer, ture og hyggeidéer, I vil huske til næste gang I er der."
            icon={<Lightbulb className="h-5 w-5 text-amber-600" />}
            accent="amber"
          />
        </div>
      </section>

      {/* Aktivt område */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Aktuelt område
            </p>
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">
              {tab === "tasks"
                ? "Huskeliste til sommerhuset"
                : tab === "shopping"
                ? "Indkøb til næste tur"
                : "Idéer & noter til Langeland"}
            </h2>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-3 md:p-4">
          {tab === "tasks" && <TasksCard />}
          {tab === "shopping" && <ShoppingCard />}
          {tab === "ideas" && <IdeasCard />}
        </div>
      </section>

      {/* Mobil-footer CTA */}
      <div className="h-4" />

      <div className="fixed inset-x-0 bottom-4 z-30 px-4 md:hidden">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur-md px-3 py-2 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Hurtig handling
            </span>
            <span className="text-xs text-slate-700">
              Tilføj noget nyt til det valgte område
            </span>
          </div>
          {/* Denne knap bruger de eksisterende knapper i kortene –
              så vi holder den som en “scroll-to”-hjælper i stedet
              for at lave ny logik. */}
          <Button
            size="sm"
            className="rounded-full text-xs px-4 py-1.5"
            onClick={() => {
              // Scroll ned til aktivt område
              const el = document.getElementById("langeland-active-section");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          >
            Tilføj her
          </Button>
        </div>
      </div>
    </div>
  );
}
