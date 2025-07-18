// /components/memories/MemoriesGallery.tsx

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";

const BUCKET_NAME = "global-images";

interface Category {
  id: string;
  label: string;
  color?: string;
  emoji?: string;
}

interface DashboardImage {
  id: string;
  image_url: string;
  original_image_url?: string;
  taken_at?: string;
  title?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  categories?: Category[];
}

type MemoriesGalleryProps = {
  onMemoryClick?: (img: DashboardImage, allImages: DashboardImage[]) => void;
};

function getImageUrl(img: DashboardImage) {
  if (!img.image_url) return "";
  if (img.image_url.startsWith("http")) return img.image_url;
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(img.image_url);
  return data.publicUrl;
}

const MemoriesGallery = ({ onMemoryClick }: MemoriesGalleryProps) => {
  const { user } = useUserContext();
  const [images, setImages] = useState<DashboardImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      if (!user?.id || !user?.partner_id) return;
      setLoading(true);
      // Select eksplicit, så original_image_url altid er med!
      const { data, error } = await supabase
        .from("dashboard_images")
        .select("id, image_url, original_image_url, taken_at, title, latitude, longitude, created_at, categories")
        .in("user_id", [user.id, user.partner_id])
        .order("taken_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fejl ved hentning af billeder:", error);
        setImages([]);
        setLoading(false);
        return;
      }

      setImages(data || []);
      setLoading(false);
    };
    fetchImages();
  }, [user]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">Minde-galleri</h2>
      {loading && <div className="text-gray-400">Henter billeder…</div>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((img) => {
          const url = getImageUrl(img);
          return (
            <div
              key={img.id}
              className="relative aspect-square overflow-hidden cursor-pointer"
              onClick={() => {
                onMemoryClick?.(img, images);
              }}
            >
              <img
                src={url}
                alt={img.title || "Minde"}
                className="w-full h-full object-cover"
                onError={() => console.log("Billedet kunne ikke loades:", url)}
              />
              {/* Under billedet vises titel og dato */}
              <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-80 text-xs px-2 py-1">
                <div className="font-medium truncate">
                  {img.categories && img.categories[0]?.emoji && (
                    <span className="mr-1">{img.categories[0].emoji}</span>
                  )}
                  {img.title}
                </div>
                <div>
                  {(() => {
                    const dateStr = img.taken_at || img.created_at;
                    return dateStr
                      ? new Date(dateStr).toLocaleDateString("da-DK", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : null;
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemoriesGallery;
