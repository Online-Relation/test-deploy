// components/langeland/IdeasCard.tsx
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
import { Trash2, Plus, PencilLine } from "lucide-react";
// ⚠️ heic2any må IKKE importeres på top-level (SSR). Vi lazy-loader i browser.

interface Idea {
  id: string;
  title: string;
  type: string; // bevidst bred, DB er tekst
  description: string | null;
  proposed_by: string | null; // matcher DB
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

type FormState = { title: string; type: string; description: string };
const emptyForm: FormState = { title: "", type: "idea", description: "" };

export default function IdeasCard() {
  const { user } = useUserContext();
  const [items, setItems] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    console.log("💡 [IdeasCard] mounted", user);
    fetchIdeas();
  }, [user]);

  const fetchIdeas = async () => {
    console.log("⏳ [IdeasCard] fetchIdeas()");
    setLoading(true);
    const { data, error } = await supabase
      .from("langeland_ideas").select("id, title, type, description, proposed_by, created_at, updated_at, image_url")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [IdeasCard] fetchIdeas error:", {
        raw: error,
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      });
      try { console.log("JSON:", JSON.stringify(error)); } catch {}
      setLoading(false);
      return;
    }
    console.log("✅ [IdeasCard] count:", data?.length || 0);
    setItems((data as Idea[]) || []);
    setLoading(false);
  };

  const list = useMemo(() => [...items], [items]);

  const openCreate = () => {
    console.log("🆕 [IdeasCard] openCreate");
    setEditId(null);
    setForm(emptyForm);
    setFile(null);
    setPreview(null);
    setModalOpen(true);
  };

  const openEdit = (i: Idea) => {
    console.log("✏️ [IdeasCard] openEdit", i.id);
    setEditId(i.id);
    setForm({ title: i.title, type: i.type || "idea", description: i.description || "" });
    setFile(null);
    setPreview(i.image_url || null);
    setModalOpen(true);
  };

  // Dynamisk HEIC -> JPEG (kun i browser)
  const convertHeicToJpeg = async (f: File): Promise<File> => {
    console.log("📦 [IdeasCard] loading heic2any …");
    const mod: any = await import("heic2any");
    const heic2any = mod?.default || mod;
    const converted = (await heic2any({ blob: f, toType: "image/jpeg", quality: 0.86 })) as Blob;
    const jpeg = new File([converted], f.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
    console.log("✅ [IdeasCard] Converted to JPEG", { name: jpeg.name, type: jpeg.type, size: jpeg.size });
    return jpeg;
  };

  const handleHeicIfNeeded = async (f: File | null) => {
    console.log("📁 [IdeasCard] handleHeicIfNeeded file:", f?.name, f?.type, f?.size);
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
      console.log("🖼️ [IdeasCard] preview set", { url });
    } catch (err) {
      console.error("❌ [IdeasCard] HEIC conversion failed, using original file", err);
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  };

  const uploadIfNeeded = async (): Promise<string | null> => {
    if (!file) {
      console.log("ℹ️ [IdeasCard] no new file, keep preview:", preview);
      return preview || null; // keep existing when editing
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `ideas/${user?.id || "anon"}/${Date.now()}.${ext}`;
    console.log("⬆️ [IdeasCard] upload start:", { bucket: "langeland", path, type: file.type, size: file.size });

    const { data, error } = await supabase.storage.from("langeland").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || (ext === "jpg" ? "image/jpeg" : undefined),
    });

    if (error) {
      console.error("❌ [IdeasCard] upload error", {
        message: (error as any)?.message,
        name: (error as any)?.name,
        statusCode: (error as any)?.statusCode,
        __raw: error,
      });
      return preview || null;
    }
    console.log("✅ [IdeasCard] upload ok", data);

    const { data: pub } = supabase.storage.from("langeland").getPublicUrl(path);
    console.log("🔗 [IdeasCard] public url", pub?.publicUrl);
    return pub?.publicUrl || null;
  };

  const handleSave = async () => {
    console.log("💾 [IdeasCard] handleSave", { editId, form, hasFile: !!file });
    if (!form.title.trim()) {
      console.warn("⚠️ [IdeasCard] empty title – abort");
      return;
    }

    console.time("[IdeasCard] upload+save");
    const imageUrl = await uploadIfNeeded();

    if (editId) {
      const payload: any = {
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim() || null,
      };
      if (imageUrl !== null) payload.image_url = imageUrl; // keep or replace
      console.log("📝 [IdeasCard] update payload", payload);
      const { error } = await supabase.from("langeland_ideas").update(payload).eq("id", editId);
      if (error) {
        console.error("❌ [IdeasCard] update error", error);
        console.timeEnd("[IdeasCard] upload+save");
        return;
      }
      console.log("✅ [IdeasCard] idea updated", editId);
    } else {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim() || null,
        image_url: imageUrl,
      };
      console.log("➕ [IdeasCard] insert payload", payload);
      const { error } = await supabase.from("langeland_ideas").insert(payload);
      if (error) {
        console.error("❌ [IdeasCard] insert error", error);
        console.timeEnd("[IdeasCard] upload+save");
        return;
      }
      console.log("✅ [IdeasCard] idea inserted");
    }

    console.timeEnd("[IdeasCard] upload+save");

    setModalOpen(false);
    setForm(emptyForm);
    setEditId(null);
    setFile(null);
    setPreview(null);
    fetchIdeas();
  };

  const typeBadge = (t: string) => {
    const map: Record<string, string> = {
      idea: "bg-indigo-100 text-indigo-700",
      note: "bg-slate-100 text-slate-700",
      task: "bg-emerald-100 text-emerald-700",
      fix: "bg-rose-100 text-rose-700",
    };
    const cls = map[t] || "bg-slate-100 text-slate-700";
    const label = t === "idea" ? "Idé" : t === "note" ? "Note" : t === "fix" ? "Fix" : t;
    return <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${cls}`}>{label}</span>;
  };

  return (
    <Card className="rounded-2xl p-5 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold flex items-center gap-2">🧠 Idéer & noter</h2>
          <p className="text-sm text-muted-foreground">Gem tanker og forbedringer til huset.</p>
        </div>
        <Button onClick={openCreate} variant="primary" className="gap-2 rounded-full">
          <Plus className="h-4 w-4" /> Ny idé/note
        </Button>
      </div>

      {/* List */}
      {loading && <div className="py-6 text-sm text-muted-foreground">Indlæser…</div>}
      {!loading && list.length === 0 && (
        <div className="py-6 text-sm text-muted-foreground">Ingen idéer/noter endnu.</div>
      )}

      <ul className="space-y-2">
        {!loading && list.map((i) => (
          <li key={i.id} className="group rounded-xl border bg-background/50 hover:bg-muted/50 transition-colors">
            <div className="p-3 md:p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{i.title}</p>
                    {typeBadge(i.type)}
                  </div>
                  {i.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{i.description}</p>
                  )}
                  {i.image_url && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={i.image_url} alt="Vedhæftet billede" className="rounded-lg border max-h-48 object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Opdateret: {new Date(i.updated_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(i)} aria-label="Rediger" className="hover:bg-muted">
                    <PencilLine className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      console.log("🗑️ [IdeasCard] delete", i.id);
                      const { error } = await supabase.from("langeland_ideas").delete().eq("id", i.id);
                      if (error) return console.error("❌ [IdeasCard] delete error", error);
                      setItems((prev) => prev.filter((x) => x.id !== i.id));
                    }}
                    aria-label="Slet"
                    className="hover:bg-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Rediger idé/note" : "Ny idé/note"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Fx Ny grillplads ved terrassen"
              />
            </div>

            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v: string) => setForm((s) => ({ ...s, type: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Vælg type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idé</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="fix">Fix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc">Beskrivelse</Label>
              <Textarea
                id="desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Detaljer og tanker…"
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
                  console.log("📥 [IdeasCard] file input change:", f?.name, f?.type, f?.size);
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
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditId(null); setFile(null); setPreview(null); }}>Annullér</Button>
            <Button variant="primary" onClick={handleSave}>{editId ? "Gem" : "Opret"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
