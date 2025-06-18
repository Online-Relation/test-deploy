// /app/settings/tables/page.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import GptStatus from "@/components/GptStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Source = {
  table_name: string;
  enabled: boolean;
  description: string | null;
  priority?: number;
};

const GPT_MODELS = [
  { value: "gpt-3.5-turbo", label: "GPT-3.5" },
  { value: "gpt-4", label: "GPT-4" },
];

export default function TableSettingsPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({});
  const [latestRowCounts, setLatestRowCounts] = useState<Record<string, number>>({});
  const [newSource, setNewSource] = useState<Source>({
    table_name: "",
    enabled: true,
    description: "",
    priority: 5,
  });
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");

  useEffect(() => {
    fetchSources();
    fetchLatestRowCounts();
    fetchSelectedModel();
  }, []);

  const fetchSelectedModel = async () => {
    const { data } = await supabase
      .from("gpt_settings")
      .select("value")
      .eq("key", "default_model")
      .maybeSingle();

    if (data?.value) {
      setSelectedModel(data.value);
    }
  };

  const updateSelectedModel = async (value: string) => {
    setSelectedModel(value);

    const { error } = await supabase
      .from("gpt_settings")
      .upsert({ key: "default_model", value }, { onConflict: "key" });

    if (!error) {
      alert("🧠 GPT-model opdateret til: " + value);
    }
  };

  const fetchSources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recommendation_sources")
      .select("*")
      .order("priority", { ascending: true });

    if (error) {
      console.error("❌ Fejl ved hentning:", error.message);
      setErrorMsg("Kunne ikke hente tabeller.");
    } else {
      setSources(data);
      fetchCounts(data);
    }

    setLoading(false);
  };

  const fetchLatestRowCounts = async () => {
    const { data } = await supabase
      .from("overall_meta")
      .select("row_counts")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.row_counts) {
      setLatestRowCounts(data.row_counts);
    }
  };

  const fetchCounts = async (sourceList: Source[]) => {
    const counts: Record<string, number> = {};

    for (const source of sourceList) {
      const { count, error } = await supabase
        .from(source.table_name)
        .select("*", { count: "exact", head: true });

      counts[source.table_name] = !error && typeof count === "number" ? count : 0;
    }

    setRowCounts(counts);
  };

  const handleToggle = (index: number) => {
    const updated = [...sources];
    updated[index].enabled = !updated[index].enabled;
    setSources(updated);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const updated = [...sources];
    updated[index].description = value;
    setSources(updated);
  };

  const handleSave = async (source: Source, index: number) => {
    if (!source.table_name) {
      setErrorMsg("Mangler table_name");
      return;
    }

    setSavingIndex(index);
    setErrorMsg(null);

    const { error } = await supabase.from("recommendation_sources").upsert(
      {
        table_name: source.table_name,
        enabled: source.enabled,
        description: source.description ?? "",
        priority: source.priority ?? 5,
      },
      { onConflict: "table_name" }
    );

    if (error) {
      console.error("Fejl:", error);
      setErrorMsg("Fejl ved gemning.");
    } else {
      setConfirmations((prev) => ({
        ...prev,
        [source.table_name]: true,
      }));

      setTimeout(() => {
        setConfirmations((prev) => ({
          ...prev,
          [source.table_name]: false,
        }));
      }, 2000);

      // sortér efter ny prioritet
      setSources((prev) =>
        [...prev].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
      );
    }

    setSavingIndex(null);
  };

  const handleAddSource = async () => {
    if (!newSource.table_name) {
      setErrorMsg("Tabellens navn er påkrævet.");
      return;
    }

    const { error } = await supabase
      .from("recommendation_sources")
      .insert(newSource);

    if (error) {
      console.error("❌ Fejl ved oprettelse:", error.message);
      setErrorMsg("Kunne ikke tilføje tabellen.");
    } else {
      setErrorMsg(null);
      setNewSource({ table_name: "", enabled: true, description: "", priority: 5 });
      await fetchSources();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">Anbefalingstabeller</h1>

      <div className="flex items-center space-x-4">
        <Label>GPT-model</Label>
        <Select value={selectedModel} onValueChange={updateSelectedModel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Vælg model" />
          </SelectTrigger>
          <SelectContent>
            {GPT_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <GptStatus model={selectedModel} />
      </div>

      {errorMsg && (
        <div className="p-2 text-sm text-red-700 border border-red-300 bg-red-100 rounded">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <p>Indlæser...</p>
      ) : (
        sources.map((source, index) => (
          <Card key={source.table_name} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg">{source.table_name}</Label>
              <label className="flex items-center space-x-2">
                <Input
                  type="checkbox"
                  checked={source.enabled}
                  onChange={() => handleToggle(index)}
                />
                <span>Aktiv</span>
              </label>
            </div>

            <div>
              <Label>Beskrivelse til GPT</Label>
              <Textarea
                value={sources[index]?.description ?? ""}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                placeholder="Forklar hvad GPT skal analysere i denne tabel"
              />

              <div className="mt-2">
                <Label>Prioritet (1 = vigtigst)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={source.priority ?? 5}
                  onChange={(e) => {
                    const updated = [...sources];
                    updated[index].priority = parseInt(e.target.value);
                    setSources(updated);
                  }}
                />
              </div>

              {confirmations[source.table_name] && (
                <p className="text-xs text-green-600 mt-1">✅ Opdateret</p>
              )}

              {rowCounts[source.table_name] !== undefined && (
                <p className="text-xs text-muted-foreground mt-2">
                  Aktuelle rækker i Supabase: {rowCounts[source.table_name]}
                </p>
              )}

              {latestRowCounts[source.table_name] !== undefined && (
                <p className="text-xs text-blue-600">
                  Brugte rækker i seneste anbefaling: {latestRowCounts[source.table_name]}
                </p>
              )}
            </div>

            <div className="text-right">
              <Button
                disabled={savingIndex === index}
                onClick={() => handleSave(source, index)}
              >
                {savingIndex === index ? "Gemmer..." : "Gem"}
              </Button>
            </div>
          </Card>
        ))
      )}

      <Card className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Tilføj ny tabel</h2>
        <div>
          <Label>Tabellens navn</Label>
          <Input
            placeholder="f.eks. sexlife_logs"
            value={newSource.table_name}
            onChange={(e) =>
              setNewSource((prev) => ({ ...prev, table_name: e.target.value }))
            }
          />
        </div>

        <div>
          <Label>Beskrivelse</Label>
          <Textarea
            placeholder="Forklar hvad GPT skal analysere"
            value={newSource.description ?? ""}
            onChange={(e) =>
              setNewSource((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </div>

        <div className="flex items-center space-x-2">
          <Input
            type="checkbox"
            checked={newSource.enabled}
            onChange={(e) =>
              setNewSource((prev) => ({
                ...prev,
                enabled: e.target.checked,
              }))
            }
          />
          <span>Aktiv</span>
        </div>

        <div className="text-right">
          <Button onClick={handleAddSource}>Tilføj tabel</Button>
        </div>
      </Card>
    </div>
  );
}
