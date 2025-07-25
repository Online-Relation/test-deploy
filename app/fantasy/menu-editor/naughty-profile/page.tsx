'use client';

import { useSession } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProfileHeader from "@/components/naughty/ProfileHeader";
import NaughtyServices from "@/components/naughty/NaughtyServices";
import GallerySection from "@/components/naughty/GallerySection";
import NoGoList from "@/components/naughty/NoGoList";
import Link from "next/link";

interface Service {
  id: string;
  text: string;
  extra_price?: number | null;
}

export default function NaughtyProfilePage() {
  const [hasMounted, setHasMounted] = useState(false);
  const session = useSession();
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [pageProfileId, setPageProfileId] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) return;
      const myProfileId = session.user.id;
      setMyProfileId(myProfileId);

      const { data: stineProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("username", "Stine")
        .single();

      if (profileError) {
        console.error("Fejl ved hentning af Stine profil:", profileError);
        return;
      }

      if (stineProfile) {
        setPageProfileId(stineProfile.id);

        if (!profileImageUrl) {
          const { data: meta, error: metaError } = await supabase
            .from("fantasy_menu_meta")
            .select("profile_image_url")
            .eq("user_id", stineProfile.id)
            .single();

          if (metaError) console.error("Fejl ved hentning af meta:", metaError);

          if (meta?.profile_image_url) {
            setProfileImageUrl(meta.profile_image_url);
          }
        }

        const { data: list, error } = await supabase.storage
          .from("naughty-profile")
          .list("fantasy-profile/stine/gallery", { limit: 10 });

        if (list && !error) {
          const urls = list.map((item) =>
            supabase.storage
              .from("naughty-profile")
              .getPublicUrl(`fantasy-profile/stine/gallery/${item.name}`).data.publicUrl
          );
          setGalleryUrls(urls);
        }

        const { data: items, error: itemError } = await supabase
          .from("fantasy_menu_items")
          .select("id, text, extra_price")
          .eq("user_id", stineProfile.id)
          .eq("is_selected", true);

        if (itemError) {
          console.error("Fejl ved hentning af valgte items:", itemError);
        } else {
          setServices(items ?? []);
        }
      }
    };

    fetchData();
  }, [hasMounted]);

  if (!hasMounted) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <ProfileHeader
        myProfileId={myProfileId}
        profileImageUrl={profileImageUrl}
        setProfileImageUrl={setProfileImageUrl}
        setUploading={setUploading}
        uploading={uploading}
        services={services}
      />

      <NaughtyServices
        myProfileId={pageProfileId ?? ""}
        services={Array.isArray(services) ? services : []}
      />

      <div className="pt-6 border-t mt-10">
        <h2 className="text-sm text-gray-500 mb-2">Vil du redigere eller tilføje flere ydelser?</h2>
        <Link
          href="/fantasy/menu-editor"
          className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-semibold px-5 py-2 rounded-full transition"
        >
          Gå til redigering af menukort
        </Link>
      </div>

      <div className="pt-6 border-t border-red-300 bg-red-50 rounded-lg p-4">
        <NoGoList myProfileId={myProfileId} pageProfileId={pageProfileId} />
      </div>

      <GallerySection galleryUrls={galleryUrls} />
    </div>
  );
}
