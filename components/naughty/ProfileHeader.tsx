// components/naughty/ProfileHeader.tsx

"use client";

import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  myProfileId: string | null;
  profileImageUrl: string | null;
  setProfileImageUrl: (url: string | null) => void;
  uploading: boolean;
  setUploading: (value: boolean) => void;
}

export default function ProfileHeader({
  myProfileId,
  profileImageUrl,
  setProfileImageUrl,
  uploading,
  setUploading,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalServices, setTotalServices] = useState<number>(0);
  const [acceptedCount, setAcceptedCount] = useState<number>(0);

  useEffect(() => {
    const fetchServiceData = async () => {
      const [{ count: total, error: totalError }, { count: accepted, error: acceptedError }] = await Promise.all([
        supabase.from("fantasy_menu_options").select("id", { count: "exact", head: true }),
        supabase
          .from("fantasy_menu_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", myProfileId || "")
          .eq("choice", "yes"),
      ]);

      if (totalError) {
        console.error("Fejl ved hentning af total services:", totalError.message);
      } else {
        setTotalServices(total ?? 0);
      }

      if (acceptedError) {
        console.error("Fejl ved hentning af accepterede services:", acceptedError.message);
      } else {
        setAcceptedCount(accepted ?? 0);
      }
    };

    if (myProfileId) fetchServiceData();
  }, [myProfileId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file || !myProfileId) return;

    setUploading(true);

    if (file.type === "image/heic" || file.name.endsWith(".HEIC")) {
      try {
        const heic2any = (await import("heic2any")).default;
        const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg" });
        file = new File([convertedBlob as BlobPart], file.name.replace(/\.heic$/i, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (err) {
        console.error("Kunne ikke konvertere HEIC:", err);
        setUploading(false);
        return;
      }
    }

    const filePath = `fantasy-profile/stine/profile_${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("naughty-profile")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Fejl ved upload af billede:", uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("naughty-profile").getPublicUrl(filePath);
    const newUrl = data.publicUrl;
    setProfileImageUrl(newUrl);

    const { error: upsertError } = await supabase
      .from("fantasy_menu_meta")
      .upsert(
        { user_id: myProfileId, profile_image_url: newUrl },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Fejl ved upsert:", upsertError.message);
    }

    setUploading(false);
  };

  const frækhedsProcent = totalServices > 0 ? Math.round((acceptedCount / totalServices) * 100) : 0;
  const niveau =
    frækhedsProcent < 20
      ? "😇 God pige"
      : frækhedsProcent < 50
      ? "😏 Slem pige"
      : frækhedsProcent < 80
      ? "🔥 Fræk flirt"
      : "👑 Vild og uimodståelig";

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28 md:w-32 md:h-32">
              {profileImageUrl ? (
                <>
                  <Image
                    src={profileImageUrl}
                    alt="Profilbillede"
                    fill
                    sizes="128px"
                    className="rounded-full object-cover border-4 border-pink-200 shadow-sm"
                  />
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-full" />
              )}
            </div>
            {myProfileId === "5687c342-1a13-441c-86ca-f7e87e1edbd5" && (
              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  className="px-5 py-2 bg-pink-500 text-white text-sm rounded-xl hover:bg-pink-600 transition shadow-md"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploader..." : "Upload nyt profilbillede"}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1 text-pink-800">
            <h2 className="text-2xl font-bold">Stine</h2>
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm" />
              Online nu
            </p>
            <p className="text-sm text-pink-600 font-medium">Åben for bestilling</p>
            <p className="text-sm">Alder: 38 år</p>
            <p className="text-sm">BH-størrelse: 75B</p>
            <p className="text-sm">Favoritleg: Når jeg er i centrum</p>
            <p className="text-sm">Elsker at blive rost og overrasket</p>
          </div>
        </div>
      </div>

      
    </>
  );
}
