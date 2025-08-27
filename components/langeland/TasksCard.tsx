// components/langeland/TasksCard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, PencilLine, CheckCircle2, Circle } from "lucide-react";
// ⚠️ heic2any må IKKE importeres på top-level (SSR fejler). Vi lazy-loader i browser.

// Types
interface Task {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  note: string | null;
  done: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

type FormState = {
  title: string;
  priority: "low" | "medium" | "high";
  note: string;
};

const emptyForm: FormState = { title: "", priority: "medium", note: "" };

export default function TasksCard() {
  const { user } = useUserContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Debug logs
  useEffect(() => {
    console.log("🧩 [TasksCard] mounted");
    console.log("👤 [TasksCard] user:", user);
  }, [user]);

  const fetchTasks = async () => {
    console.log("⏳ [TasksCard] fetchTasks() start");
    setLoading(true);
    const { data, error } = await supabase
      .from("langeland_tasks")
      .select("id, title, priority, note, done, created_by, created_at, updated_at, image_url")
      .order("done", { ascending: true })
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [TasksCard] fetchTasks error:", {
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      });
      setLoading(false);
      return;
    }
    console.log("✅ [TasksCard] fetchTasks count:", data?.length || 0);
    setTasks((data as Task[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const sortedTasks = useMemo(() => {
    const weight: Record<Task["priority"], number> = { high: 0, medium: 1, low: 2 } as any;
    const arr = [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (weight[a.priority] !== weight[b.priority]) return weight[a.priority] - weight[b.priority];
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return arr;
  }, [tasks]);

  const openCreate = () => {
    console.log("🆕 [TasksCard] openCreate");
    setEditId(null);
    setForm(emptyForm);
    setFile(null);
    setPreview(null);
    setModalOpen(true);
  };

  const openEdit = (t: Task) => {
    console.log("✏️ [TasksCard] openEdit", t.id);
    setEditId(t.id);
    setForm({ title: t.title, priority: t.priority, note: t.note || "" });
    setFile(null);
    setPreview(t.image_url || null);
    setModalOpen(true);
  };

  // Dynamisk HEIC -> JPEG konvertering (kun i browser)
  const convertHeicToJpeg = async (f: File): Promise<File> => {
    console.log("📦 [TasksCard] loading heic2any …");
    const mod: any = await import("heic2any");
    const heic2any = mod?.default || mod;
    const converted = (await heic2any({ blob: f, toType: "image/jpeg", quality: 0.86 })) as Blob;
    const jpeg = new File([converted], f.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
    console.log("✅ [TasksCard] Converted to JPEG", { name: jpeg.name, type: jpeg.type, size: jpeg.size });
    return jpeg;
  };

  const handleHeicIfNeeded = async (f: File | null) => {
    console.log("📁 [TasksCard] handleHeicIfNeeded file:", f?.name, f?.type, f?.size);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    const isHeic = /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);
    try {
      const finalFile = isHeic ? await convertHeicToJpeg(f) : f;
      setFile(finalFile);
      const url = URL.createObjectURL(finalFile);
      setPreview(url);
      console.log("🖼️ [TasksCard] preview set", { url });
    } catch (err) {
      console.error("❌ [TasksCard] HEIC conversion failed, using original file", err);
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  };

  const uploadIfNeeded = async (): Promise<string | null> => {
    if (!file) {
      console.log("ℹ️ [TasksCard] no new file, keep preview:", preview);
      return preview || null; // keep existing when editing
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `tasks/${user?.id || "anon"}/${Date.now()}.${ext}`;
    console.log("⬆️ [TasksCard] upload start", { bucket: "langeland", path, type: file.type, size: file.size });

    const { data, error } = await supabase.storage.from("langeland").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || (ext === "jpg" ? "image/jpeg" : undefined),
    });

    if (error) {
      console.error("❌ [TasksCard] upload error", {
        message: (error as any)?.message,
        name: (error as any)?.name,
        statusCode: (error as any)?.statusCode,
        __raw: error,
      });
      return preview || null;
    }
    console.log("✅ [TasksCard] upload ok", data);

    const { data: pub } = supabase.storage.from("langeland").getPublicUrl(path);
    console.log("🔗 [TasksCard] public url", pub?.publicUrl);
    return pub?.publicUrl || null;
  };

  const handleSave = async () => {
    console.log("💾 [TasksCard] handleSave", { editId, form, hasFile: !!file });
    if (!form.title.trim()) {
      console.warn("⚠️ [TasksCard] empty title – abort");
      return;
    }

    console.time("[TasksCard] upload+save");
    const imageUrl = await uploadIfNeeded();

    if (editId) {
      const payload: any = {
        title: form.title.trim(),
        priority: form.priority,
        note: form.note.trim() || null,
      };
      if (imageUrl !== null) payload.image_url = imageUrl; // keep or replace
      console.log("📝 [TasksCard] update payload", payload);
      const { error } = await supabase.from("langeland_tasks").update(payload).eq("id", editId);
      if (error) {
        console.error("❌ [TasksCard] update error", error);
        console.timeEnd("[TasksCard] upload+save");
        return;
      }
      console.log("✅ [TasksCard] task updated", editId);
    } else {
      const payload = {
        title: form.title.trim(),
        priority: form.priority,
        note: form.note.trim() || null,
        image_url: imageUrl,
      };
      console.log("➕ [TasksCard] insert payload", payload);
      const { error } = await supabase.from("langeland_tasks").insert(payload);
      if (error) {
        console.error("❌ [TasksCard] insert error", error);
        console.timeEnd("[TasksCard] upload+save");
        return;
      }
      console.log("✅ [TasksCard] task inserted");
    }

    console.timeEnd("[TasksCard] upload+save");

    setModalOpen(false);
    setForm(emptyForm);
    setEditId(null);
    setFile(null);
    setPreview(null);
    fetchTasks();
  };

  const toggleDone = async (task: Task) => {
    console.log("🔁 [TasksCard] toggleDone", task.id, !task.done);
    const { error } = await supabase
      .from("langeland_tasks")
      .update({ done: !task.done })
      .eq("id", task.id);
    if (error) return console.error("❌ [TasksCard] toggleDone error", error);
    setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, done: !t.done } : t)));
  };

  const handleDelete = async (id: string) => {
    console.log("🗑️ [TasksCard] delete", id);
    const { error } = await supabase.from("langeland_tasks").delete().eq("id", id);
    if (error) return console.error("❌ [TasksCard] delete error", error);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const priorityBadge = (p: Task["priority"]) => {
    const map: Record<string, string> = {
      high: "bg-rose-100 text-rose-700",
      medium: "bg-amber-100 text-amber-700",
      low: "bg-emerald-100 text-emerald-700",
    };
    const label = p === "high" ? "Høj" : p === "medium" ? "Mellem" : "Lav";
    return <span className={`text-xs px-2 py-0.5 rounded-full ${map[p]}`}>{label}</span>;
  };

  return (
    <Card className="rounded-2xl p-5 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold flex items-center gap-2">📋 Huskeliste</h2>
        </div>
        <Button onClick={openCreate} variant="primary" className="gap-2 rounded-full">
          <Plus className="h-4 w-4" /> Ny opgave
        </Button>
      </div>

      {/* List */}
      {loading && <div className="py-6 text-sm text-muted-foreground">Indlæser…</div>}
      {!loading && sortedTasks.length === 0 && (
        <div className="py-6 text-sm text-muted-foreground">Ingen opgaver endnu.</div>
      )}

      <ul className="space-y-2">
        {!loading && sortedTasks.map((t) => (
          <li key={t.id} className="group rounded-xl border bg-background/50 hover:bg-muted/50 transition-colors">
            <div className="p-3 md:p-4 flex items-start gap-3">
              {/* Done-toggle */}
              <button
                onClick={() => toggleDone(t)}
                className="mt-0.5 shrink-0 rounded-full border w-5 h-5 grid place-items-center"
                aria-label={t.done ? "Markér som ikke fuldført" : "Markér som fuldført"}
              >
                {t.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
              </button>

              {/* Indhold */}
              <div className="flex-1 min-w-0">
                {/* Toplinje: titel + badge i højre side */}
                <div className="flex items-start justify-between gap-3">
                  <p className={`font-medium ${t.done ? "line-through text-slate-400" : ""}`}>{t.title}</p>
                  <div className="shrink-0">{priorityBadge(t.priority)}</div>
                </div>

                {t.note && (
                  <p className={`text-sm mt-1 whitespace-pre-wrap ${t.done ? "line-through text-slate-400" : "text-muted-foreground"}`}>
                    {t.note}
                  </p>
                )}

                {t.image_url && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.image_url} alt="Vedhæftet billede" className="rounded-lg border max-h-48 object-cover" />
                  </div>
                )}

                {/* Bundlinje: venstre = opdateret, højre = actions */}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Opdateret: {new Date(t.updated_at).toLocaleString()}</p>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)} aria-label="Rediger" className="hover:bg-muted">
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} aria-label="Slet" className="hover:bg-muted">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          console.log("🪟 [TasksCard] Dialog open change:", open);
          setModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Rediger opgave" : "Ny opgave"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => {
                  console.log("⌨️ [TasksCard] title change:", e.target.value);
                  setForm((s) => ({ ...s, title: e.target.value }));
                }}
                placeholder="Fx Tjek filtre i opvaskemaskinen"
              />
            </div>

            <div className="grid gap-2">
              <Label>Prioritet</Label>
              <Select
                value={form.priority}
                onValueChange={(v: "low" | "medium" | "high") => {
                  console.log("🎚️ [TasksCard] priority change:", v);
                  setForm((s) => ({ ...s, priority: v }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Vælg prioritet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Høj</SelectItem>
                  <SelectItem value="medium">Mellem</SelectItem>
                  <SelectItem value="low">Lav</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                rows={4}
                value={form.note}
                onChange={(e) => {
                  console.log("📝 [TasksCard] note change length:", e.target.value.length);
                  setForm((s) => ({ ...s, note: e.target.value }));
                }}
                placeholder="Detaljer, fx hvor i huset, seneste status m.m."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Billede (valgfrit)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*,.heic,.heif"
                onChange={async (e) => {
                  const f = e.target.files?.[0] || null;
                  console.log("📥 [TasksCard] file input change:", f?.name, f?.type, f?.size);
                  await handleHeicIfNeeded(f);
                }}
              />
              {preview && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Forhåndsvisning" className="rounded-lg border max-h-48 object-cover" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                console.log("❎ [TasksCard] cancel");
                setModalOpen(false);
                setEditId(null);
                setFile(null);
                setPreview(null);
              }}
            >
              Annullér
            </Button>
            <Button variant="primary" onClick={handleSave}>{editId ? "Gem" : "Opret"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
