"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import GptStatus from "@/components/GptStatus";

type Source = {
  table_name: string;
  enabled: boolean;
  description: string | null;
};

export default function TableSettingsPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({});
  const [newSource, setNewSource] = useState<Source>({
    table_name: "",
    enabled: true,
    description: "",
  });
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recommendation_sources")
      .select("*")
      .order("table_name");

    if (error) {
      console.error("❌ Fejl ved hentning:", error.message);
      setErrorMsg("Kunne ikke hente tabeller.");
    } else {
      setSources(data);
      fetchCounts(data);
    }

    setLoading(false);
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
      setNewSource({ table_name: "", enabled: true, description: "" });
      await fetchSources();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold">Anbefalingstabeller</h1>

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

              {confirmations[source.table_name] && (
                <p className="text-xs text-green-600 mt-1">✅ Opdateret</p>
              )}

              {rowCounts[source.table_name] !== undefined && (
                <p className="text-xs text-muted-foreground mt-2">
                  Denne tabel indeholder {rowCounts[source.table_name]} datapunkter.
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

      <GptStatus />
    </div>
  );
}
