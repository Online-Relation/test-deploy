// /components/memories/MemoriesGallery.tsx

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";

interface Category {
  id: string;
  label: string;
  color?: string;
  [key: string]: any;
}

interface DashboardImage {
  id: string;
  image_url: string;
  taken_at?: string;
  title?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  categories?: Category[]; // <-- VIGTIGT!
}

type MemoriesGalleryProps = {
  onMemoryClick?: (img: DashboardImage) => void;
};

const MemoriesGallery = ({ onMemoryClick }: MemoriesGalleryProps) => {
  const { user } = useUserContext();
  const [images, setImages] = useState<DashboardImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      if (!user?.id || !user?.partner_id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("dashboard_images")
        .select("*")
        .in("user_id", [user.id, user.partner_id])
        .order("taken_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fejl ved hentning af billeder:", error);
      }

      setImages(data || []);
      setLoading(false);
    };
    fetchImages();
  }, [user]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Månedens minder</h2>
      {loading && <div className="text-gray-400">Henter billeder…</div>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="rounded-xl shadow bg-white cursor-pointer overflow-hidden group relative"
            onClick={() => onMemoryClick?.(img)}
          >
            <img
              src={img.image_url}
              alt={img.title || "Minde"}
              className="w-full h-32 object-cover group-hover:scale-105 transition"
            />
            <div className="p-2 text-xs text-gray-500">
              {/* Dato */}
              {img.taken_at ? (
                <span>
                  {new Date(img.taken_at).toLocaleDateString("da-DK", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ) : img.created_at ? (
                <span>
                  {new Date(img.created_at).toLocaleDateString("da-DK", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ) : null}
              {/* Titel */}
              {img.title && (
                <span className="block font-medium text-gray-700 truncate">
                  {img.title}
                </span>
              )}

              {/* Kategorier */}
              {img.categories && img.categories.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-1">
                  {img.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="inline-block rounded-full px-2 py-1 text-xs"
                      style={{
                        backgroundColor: cat.color || "#eee",
                        color: "#444",
                        fontWeight: 500,
                        border: "1px solid #ddd",
                      }}
                    >
                      {cat.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoriesGallery;
