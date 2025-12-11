// components/langeland/ShoppingCard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Plus,
  PencilLine,
  CheckCircle2,
  Circle,
  Image as ImageIcon,
  Link2,
} from "lucide-react";

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
  price: number | null;
  links: string[] | null;
}

type FormState = {
  name: string;
  qty: string;
  category: Category;
  price: string;
  links: string[];
};

const emptyForm: FormState = {
  name: "",
  qty: "",
  category: "consumables",
  price: "",
  links: [""],
};

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
    console.log("🛒 [ShoppingCard] mounted", user?.id);
    if (user) fetchItems();
  }, [user]);

  const fetchItems = async () => {
    console.log("⏳ [ShoppingCard] fetchItems()");
    setLoading(true);
    const { data, error } = await supabase
      .from("langeland_shopping")
      .select(
        "id, name, qty, category, purchased, created_by, created_at, updated_at, image_url, price, links"
      )
      .order("purchased", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [ShoppingCard] fetchItems error", error);
      setLoading(false);
      return;
    }

    console.log(
      "✅ [ShoppingCard] fetchItems count:",
      (data as ShoppingItem[])?.length || 0
    );
    setItems((data as ShoppingItem[]) || []);
    setLoading(false);
  };

  const list = useMemo(() => {
    const arr = [...items].sort((a, b) => {
      if (a.purchased !== b.purchased) return a.purchased ? 1 : -1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    return arr;
  }, [items]);

  // 🔢 Totaler: ikke købt / købt
  const { notPurchasedTotal, purchasedTotal } = useMemo(() => {
    let notPurchased = 0;
    let purchased = 0;

    for (const item of items) {
      if (item.price != null && !Number.isNaN(item.price)) {
        const val = Number(item.price);
        if (item.purchased) {
          purchased += val;
        } else {
          notPurchased += val;
        }
      }
    }

    return { notPurchasedTotal: notPurchased, purchasedTotal: purchased };
  }, [items]);

  const formattedNotPurchasedTotal = new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 2,
  }).format(notPurchasedTotal);

  const formattedPurchasedTotal = new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 2,
  }).format(purchasedTotal);

  const openCreate = () => {
    console.log("🆕 [ShoppingCard] openCreate");
    setEditId(null);
    setForm(emptyForm);
    setFile(null);
    setPreview(null);
    setModalOpen(true);
  };

  const openEdit = (item: ShoppingItem) => {
    console.log("✏️ [ShoppingCard] openEdit", item.id);
    setEditId(item.id);
    setForm({
      name: item.name,
      qty: item.qty || "",
      category: item.category,
      price:
        item.price != null && !Number.isNaN(item.price)
          ? String(item.price).replace(".", ",")
          : "",
      links:
        item.links && item.links.length > 0
          ? item.links
          : [""],
    });
    setFile(null);
    setPreview(item.image_url || null);
    setModalOpen(true);
  };

  const deleteItem = async (id: string) => {
    console.log("🗑️ [ShoppingCard] deleteItem", id);
    const { error } = await supabase
      .from("langeland_shopping")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("❌ [ShoppingCard] delete error", error);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const togglePurchased = async (item: ShoppingItem) => {
    console.log("✅ [ShoppingCard] togglePurchased", item.id, !item.purchased);
    const { error } = await supabase
      .from("langeland_shopping")
      .update({ purchased: !item.purchased })
      .eq("id", item.id);
    if (error) {
      console.error("❌ [ShoppingCard] togglePurchased error", error);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, purchased: !item.purchased } : i
      )
    );
  };

  const convertHeicToJpeg = async (f: File): Promise<File> => {
    console.log("📦 [ShoppingCard] loading heic2any …");
    const mod: any = await import("heic2any");
    const heic2any = mod?.default || mod;
    const converted = (await heic2any({
      blob: f,
      toType: "image/jpeg",
      quality: 0.86,
    })) as Blob;
    const jpeg = new File(
      [converted],
      f.name.replace(/\.(heic|heif)$/i, ".jpg"),
      {
        type: "image/jpeg",
      }
    );
    console.log("✅ [ShoppingCard] Converted to JPEG", {
      name: jpeg.name,
      type: jpeg.type,
      size: jpeg.size,
    });
    return jpeg;
  };

  const handleHeicIfNeeded = async (f: File | null) => {
    console.log(
      "📁 [ShoppingCard] handleHeicIfNeeded file:",
      f?.name,
      f?.type,
      f?.size
    );
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    const isHeic =
      /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name || "");
    try {
      const finalFile = isHeic ? await convertHeicToJpeg(f) : f;
      setFile(finalFile);
      const url = URL.createObjectURL(finalFile);
      setPreview(url);
      console.log("🖼️ [ShoppingCard] preview set", { url });
    } catch (err) {
      console.error(
        "❌ [ShoppingCard] HEIC conversion failed, using original file",
        err
      );
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  };

  const uploadIfNeeded = async (): Promise<string | null> => {
    if (!file) {
      console.log("ℹ️ [ShoppingCard] no new file, keep preview:", preview);
      return preview || null;
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `shopping/${user?.id || "anon"}/${Date.now()}.${ext}`;
    console.log("⬆️ [ShoppingCard] upload start:", {
      path,
      type: file.type,
      size: file.size,
    });

    const { data, error } = await supabase.storage
      .from("langeland")
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("❌ [ShoppingCard] upload error", error);
      return preview || null;
    }

    const publicUrl = supabase.storage
      .from("langeland")
      .getPublicUrl(data.path).data.publicUrl;

    console.log("✅ [ShoppingCard] upload done, url:", publicUrl);
    return publicUrl;
  };

  const parsePrice = (raw: string): number | null => {
    if (!raw.trim()) return null;
    const normalized = raw.replace(/\s+/g, "").replace(",", ".");
    const value = Number(normalized);
    if (Number.isNaN(value)) return null;
    return value;
  };

  const cleanLinks = (links: string[]): string[] => {
    const cleaned = links
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return cleaned;
  };

  const handleSave = async () => {
    console.log("💾 [ShoppingCard] save item", {
      editId,
      form,
      hasFile: !!file,
    });
    if (!form.name.trim()) return;

    const imageUrl = await uploadIfNeeded();
    const priceValue = parsePrice(form.price);
    const cleanedLinks = cleanLinks(form.links);

    if (editId) {
      const payload: any = {
        name: form.name.trim(),
        qty: form.qty.trim() || null,
        category: form.category,
        price: priceValue,
        links: cleanedLinks.length ? cleanedLinks : null,
      };
      if (imageUrl !== null) payload.image_url = imageUrl;
      console.log("📝 [ShoppingCard] update payload", payload);
      const { error } = await supabase
        .from("langeland_shopping")
        .update(payload)
        .eq("id", editId);
      if (error) {
        console.error("❌ [ShoppingCard] update error", error);
        return;
      }
    } else {
      const payload: any = {
        name: form.name.trim(),
        qty: form.qty.trim() || null,
        category: form.category,
        image_url: imageUrl,
        price: priceValue,
        links: cleanedLinks.length ? cleanedLinks : null,
      };
      console.log("➕ [ShoppingCard] insert payload", payload);
      const { error } = await supabase
        .from("langeland_shopping")
        .insert(payload);
      if (error) {
        console.error("❌ [ShoppingCard] insert error", error);
        return;
      }
    }

    setModalOpen(false);
    setForm(emptyForm);
    setEditId(null);
    setFile(null);
    setPreview(null);
    fetchItems();
  };

  const addLinkField = () => {
    setForm((prev) => ({
      ...prev,
      links: [...prev.links, ""],
    }));
  };

  const updateLinkField = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.map((l, i) => (i === index ? value : l)),
    }));
  };

  const removeLinkField = (index: number) => {
    setForm((prev) => {
      const next = prev.links.filter((_, i) => i !== index);
      return {
        ...prev,
        links: next.length > 0 ? next : [""],
      };
    });
  };

  return (
    <Card className="rounded-3xl border border-slate-100 bg-gradient-to-br from-sky-50/40 via-white to-emerald-50/40 shadow-sm">
      <div className="flex flex-col gap-3 p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">
              Indkøbsliste
            </h2>
            <p className="text-xs text-slate-600">
              Ting I skal huske at købe til sommerhuset – både praktiske og
              hyggelige.
            </p>

            {/* Nye total-chips */}
            <div className="mt-2 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-800 border border-emerald-100 shadow-inner">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                Samlet beløb:{" "}
                <span className="ml-1 font-bold">
                  {formattedNotPurchasedTotal}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">
                  (ikke markeret som købt)
                </span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-800 border border-sky-100 shadow-inner">
                <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
                I alt købt for:{" "}
                <span className="ml-1 font-bold">
                  {formattedPurchasedTotal}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">
                  (markeret som købt)
                </span>
              </div>
            </div>
          </div>

          <div className="md:ml-auto">
            <Button
              onClick={openCreate}
              variant="primary"
              className="gap-2 rounded-full w-full md:w-auto"
            >
              <Plus className="h-4 w-4" /> Ny vare
            </Button>
          </div>

        </div>

        {loading && (
          <div className="py-6 text-sm text-muted-foreground">Indlæser…</div>
        )}
        {!loading && list.length === 0 && (
          <div className="py-6 text-sm text-muted-foreground">
            Ingen varer endnu.
          </div>
        )}

        <ul className="space-y-2">
          {!loading &&
            list.map((item) => (
              <li
                key={item.id}
                className="group rounded-xl border bg-background/50 hover:bg-muted/50 transition-colors"
              >
                <div className="p-3 md:p-4 flex items-start gap-3">
                  <button
                    onClick={() => togglePurchased(item)}
                    className="mt-0.5 shrink-0 rounded-full border w-5 h-5 grid place-items-center"
                    aria-label={
                      item.purchased ? "Markér som ukøbt" : "Markér som købt"
                    }
                  >
                    {item.purchased ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={`font-medium ${
                          item.purchased
                            ? "line-through text-slate-400"
                            : "text-slate-900"
                        }`}
                      >
                        {item.name}
                        {item.qty ? (
                          <span className="ml-2 text-[11px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                            {item.qty}
                          </span>
                        ) : null}
                      </p>
                      {item.price != null && !Number.isNaN(item.price) && (
                        <span className="shrink-0 text-xs font-semibold text-slate-800">
                          {new Intl.NumberFormat("da-DK", {
                            style: "currency",
                            currency: "DKK",
                            minimumFractionDigits: 2,
                          }).format(item.price)}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 border border-slate-100">
                        {item.category === "consumables"
                          ? "Forbrug"
                          : "Værktøj / udstyr"}
                      </span>

                      {item.image_url && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 border border-slate-100">
                          <ImageIcon className="h-3 w-3" />
                          billede
                        </span>
                      )}

                      {item.links && item.links.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 border border-slate-100">
                          <Link2 className="h-3 w-3" />
                          {item.links.length === 1
                            ? "1 link"
                            : `${item.links.length} links`}
                        </span>
                      )}
                    </div>

                    {item.links && item.links.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {item.links.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 border border-slate-100 hover:bg-slate-100"
                          >
                            <Link2 className="h-3 w-3" />
                            Link {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-500 hover:text-slate-900"
                      onClick={() => openEdit(item)}
                    >
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-rose-500 hover:text-rose-700"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setForm(emptyForm);
            setEditId(null);
            setFile(null);
            setPreview(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Redigér vare" : "Ny vare"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Navn</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Fx Opvasketabs (Finish)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="qty">Antal / specifikation</Label>
              <Input
                id="qty"
                value={form.qty}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, qty: e.target.value }))
                }
                placeholder={'Fx "x2", "4,0×50", "2 par"'}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Pris (DKK)</Label>
              <Input
                id="price"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                placeholder='Fx "39,95" eller "120"'
                inputMode="decimal"
              />
              <p className="text-[11px] text-slate-500">
                Brug punktum eller komma – beløbet lægges automatisk sammen med
                de andre varer.
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Select
                value={form.category}
                onValueChange={(val: Category) =>
                  setForm((prev) => ({ ...prev, category: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumables">Forbrug</SelectItem>
                  <SelectItem value="tools">Værktøj / udstyr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Links til varen (valgfrit)</Label>
              <div className="space-y-2">
                {form.links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={link}
                      onChange={(e) =>
                        updateLinkField(index, e.target.value)
                      }
                      placeholder="Indsæt URL – fx https://…"
                    />
                    {form.links.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => removeLinkField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="inline-flex items-center gap-1 text-xs"
                  onClick={addLinkField}
                >
                  <Plus className="h-3 w-3" />
                  Tilføj link
                </Button>
                <p className="text-[11px] text-slate-500">
                  Brug fx til forskellige muligheder på Elgiganten, Imerco,
                  IKEA osv.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Billede (valgfrit)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*,.heic,.heif"
                onChange={(e) =>
                  handleHeicIfNeeded(e.target.files?.[0] || null)
                }
              />
              {preview && (
                <div className="mt-2">
                  <img
                    src={preview}
                    alt="Forhåndsvisning"
                    className="h-24 w-24 rounded-lg object-cover border"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setForm(emptyForm);
                setEditId(null);
                setFile(null);
                setPreview(null);
              }}
            >
              Annullér
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editId ? "Gem" : "Opret"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
