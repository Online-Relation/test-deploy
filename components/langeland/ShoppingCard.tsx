// components/langeland/ShoppingCard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, PencilLine, CheckCircle2, Circle } from "lucide-react";
// ⚠️ heic2any må IKKE importeres på top-level (SSR fejler). Vi lazy-loader i browser.

type Category = "consumables" | "tools";
interface ShoppingItem {
  id: string;
  name: string;
  qty: string | null;
  category: Category;
  purchased: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

type FormState = { name: string; qty: string; category: Category };
const emptyForm: FormState = { name: "", qty: "", category: "consumables" };

export default function ShoppingCard() {
  const { user } = useUserContext();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    console.log("🛒 [ShoppingCard] mounted", user);
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    console.log("⏳ [ShoppingCard] fetchItems()");
    setLoading(true);
    const { data, error } = await supabase
      .from("langeland_shopping")
      .select("id, name, qty, category, purchased, created_by, created_at, updated_at, image_url")
      .order("purchased", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [ShoppingCard] fetchItems error:", { message: (error as any)?.message, code: (error as any)?.code, details: (error as any)?.details });
      setLoading(false);
      return;
    }
    console.log("✅ [ShoppingCard] fetchItems count:", data?.length || 0);
    setItems((data as ShoppingItem[]) || []);
    setLoading(false);
  };

  const list = useMemo(() => {
    const arr = [...items].sort((a, b) => {
      if (a.purchased !== b.purchased) return a.purchased ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return arr;
  }, [items]);

  const openCreate = () => {
    console.log("🆕 [ShoppingCard] openCreate");
    setEditId(null);
    setForm(emptyForm);
    setFile(null);
    setPreview(null);
    setModalOpen(true);
  };

  const openEdit = (i: ShoppingItem) => {
    console.log("✏️ [ShoppingCard] openEdit", i.id);
    setEditId(i.id);
    setForm({ name: i.name, qty: i.qty || "", category: i.category });
    setFile(null);
    setPreview(i.image_url || null);
    setModalOpen(true);
  };

  // Dynamisk HEIC -> JPEG (kun i browser)
  const convertHeicToJpeg = async (f: File): Promise<File> => {
    console.log("📦 [ShoppingCard] loading heic2any …");
    const mod: any = await import("heic2any");
    const heic2any = mod?.default || mod;
    const converted = (await heic2any({ blob: f, toType: "image/jpeg", quality: 0.86 })) as Blob;
    const jpeg = new File([converted], f.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
    console.log("✅ [ShoppingCard] Converted to JPEG", { name: jpeg.name, type: jpeg.type, size: jpeg.size });
    return jpeg;
  };

  const handleHeicIfNeeded = async (f: File | null) => {
    console.log("📁 [ShoppingCard] handleHeicIfNeeded file:", f?.name, f?.type, f?.size);
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
      console.log("🖼️ [ShoppingCard] preview set", { url });
    } catch (err) {
      console.error("❌ [ShoppingCard] HEIC conversion failed, using original file", err);
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  };

  const uploadIfNeeded = async (): Promise<string | null> => {
    if (!file) {
      console.log("ℹ️ [ShoppingCard] no new file, keep preview:", preview);
      return preview || null; // keep existing when editing
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `shopping/${user?.id || "anon"}/${Date.now()}.${ext}`;
    console.log("⬆️ [ShoppingCard] upload start:", { path, type: file.type, size: file.size });
    const { data, error } = await supabase.storage.from("langeland").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || (ext === "jpg" ? "image/jpeg" : undefined),
    });
    if (error) {
      console.error("❌ [ShoppingCard] upload error", {
        message: (error as any)?.message,
        name: (error as any)?.name,
        statusCode: (error as any)?.statusCode,
        __raw: error,
      });
      return preview || null;
    }
    console.log("✅ [ShoppingCard] upload ok", data);

    const { data: pub } = supabase.storage.from("langeland").getPublicUrl(path);
    console.log("🔗 [ShoppingCard] public url", pub?.publicUrl);
    return pub?.publicUrl || null;
  };

  const handleSave = async () => {
    console.log("💾 [ShoppingCard] save item", { editId, form, hasFile: !!file });
    if (!form.name.trim()) return;

    const imageUrl = await uploadIfNeeded();

    if (editId) {
      const payload: any = {
        name: form.name.trim(),
        qty: form.qty.trim() || null,
        category: form.category,
      };
      if (imageUrl !== null) payload.image_url = imageUrl; // keep or replace existing
      console.log("📝 [ShoppingCard] update payload", payload);
      const { error } = await supabase.from("langeland_shopping").update(payload).eq("id", editId);
      if (error) return console.error("❌ [ShoppingCard] update error", error);
    } else {
      const payload = {
        name: form.name.trim(),
        qty: form.qty.trim() || null,
        category: form.category,
        image_url: imageUrl,
      };
      console.log("➕ [ShoppingCard] insert payload", payload);
      const { error } = await supabase.from("langeland_shopping").insert(payload);
      if (error) return console.error("❌ [ShoppingCard] insert error", error);
    }

    setModalOpen(false);
    setForm(emptyForm);
    setEditId(null);
    setFile(null);
    setPreview(null);
    fetchItems();
  };

  const togglePurchased = async (item: ShoppingItem) => {
    console.log("🔁 [ShoppingCard] togglePurchased", item.id, !item.purchased);
    const { error } = await supabase
      .from("langeland_shopping")
      .update({ purchased: !item.purchased })
      .eq("id", item.id);
    if (error) return console.error("❌ [ShoppingCard] togglePurchased error", error);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, purchased: !i.purchased } : i)));
  };

  const handleDelete = async (id: string) => {
    console.log("🗑️ [ShoppingCard] delete", id);
    const { error } = await supabase.from("langeland_shopping").delete().eq("id", id);
    if (error) return console.error("❌ [ShoppingCard] delete error", error);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const catBadge = (c: Category) => (
    <span className={`text-xs px-2 py-0.5 rounded-full ${c === "consumables" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"}`}>
      {c === "consumables" ? "Forbrug" : "Værktøj & diverse"}
    </span>
  );

  return (
    <Card className="rounded-2xl p-5 md:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold flex items-center gap-2">🛒 Indkøbsliste</h2>
          <p className="text-sm text-muted-foreground">Ting der skal købes til huset.</p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button onClick={openCreate} variant="primary" className="gap-2 rounded-full">
            <Plus className="h-4 w-4" /> Ny vare
          </Button>
        </div>
      </div>

      {/* List */}
      {loading && <div className="py-6 text-sm text-muted-foreground">Indlæser…</div>}
      {!loading && list.length === 0 && <div className="py-6 text-sm text-muted-foreground">Ingen varer endnu.</div>}

      <ul className="space-y-2">
        {!loading && list.map((i) => (
          <li key={i.id} className="group rounded-xl border bg-background/50 hover:bg-muted/50 transition-colors">
            <div className="p-3 md:p-4 flex items-start gap-3">
              <button
                onClick={() => togglePurchased(i)}
                className="mt-0.5 shrink-0 rounded-full border w-5 h-5 grid place-items-center"
                aria-label={i.purchased ? "Markér som ukøbt" : "Markér som købt"}
              >
                {i.purchased ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className={`font-medium ${i.purchased ? "line-through text-slate-400" : ""}`}>
                    {i.name}
                    {i.qty ? <span className="ml-2 text-xs rounded-full bg-slate-100 px-2 py-0.5">{i.qty}</span> : null}
                  </p>
                  {catBadge(i.category)}
                </div>
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
                <Button variant="ghost" size="icon" onClick={() => handleDelete(i.id)} aria-label="Slet" className="hover:bg-muted">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Rediger vare" : "Ny vare"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Navn</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Fx Opvasketabs (Finish)" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="qty">Antal / specifikation</Label>
              <Input id="qty" value={form.qty} onChange={(e) => setForm((s) => ({ ...s, qty: e.target.value }))} placeholder='Fx "x2", "4,0×50", "2 par"' />
            </div>

            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v: Category) => setForm((s) => ({ ...s, category: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Vælg kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumables">Forbrug</SelectItem>
                  <SelectItem value="tools">Værktøj & diverse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Billede (valgfrit)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*,.heic,.heif"
                onChange={async (e) => {
                  const f = e.target.files?.[0] || null;
                  console.log("📥 [ShoppingCard] file input change:", f?.name, f?.type, f?.size);
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
