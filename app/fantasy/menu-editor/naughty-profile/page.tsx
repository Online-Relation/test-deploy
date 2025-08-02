// app/fantasy/menu-editor/naughty-profile/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';
import ProfileHeader from '@/components/naughty/ProfileHeader';
import NaughtyServices from '@/components/naughty/NaughtyServices';
import GallerySection from '@/components/naughty/GallerySection';
import NoGoList from '@/components/naughty/NoGoList';
import Link from 'next/link';

interface Service {
  id: string;
  text: string;
  extra_price?: number | null;
  is_addon?: boolean;
}

export default function NaughtyProfilePage() {
  const [hasMounted, setHasMounted] = useState(false);
  const { user } = useUserContext();
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [pageProfileId, setPageProfileId] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const fetchGalleryUrls = useCallback(async (profileId: string) => {
    const { data: list, error } = await supabase.storage
      .from('naughty-profile')
      .list('fantasy-profile/stine/gallery', { limit: 50 });

    if (list && !error) {
      const urls = list.map((item) =>
        supabase.storage
          .from('naughty-profile')
          .getPublicUrl(`fantasy-profile/stine/gallery/${item.name}`).data.publicUrl
      );
      setGalleryUrls(urls);
    }
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
        .from('profiles')
        .select('id, username')
        .eq('username', 'Stine')
        .single();

      if (profileError || !stineProfile) {
        console.error('Fejl ved hentning af Stine profil:', profileError);
        return;
      }

      setPageProfileId(stineProfile.id);

      const { data: meta, error: metaError } = await supabase
        .from('fantasy_menu_meta')
        .select('profile_image_url')
        .eq('user_id', stineProfile.id)
        .single();

      if (!metaError && meta?.profile_image_url) {
        setProfileImageUrl(meta.profile_image_url);
      }

      await fetchGalleryUrls(stineProfile.id);

      const { data: items, error: itemError } = await supabase
        .from('fantasy_menu_items')
        .select(`id, extra_price, text, user_id`)
        .eq('user_id', stineProfile.id);

      if (!itemError && Array.isArray(items)) {
        const texts = items.map((item: any) => item.text);

        const { data: options, error: optionError } = await supabase
          .from('fantasy_menu_options')
          .select('text, is_addon')
          .in('text', texts);

        if (optionError) {
          console.error('Fejl ved hentning af options:', optionError);
          return;
        }

        const mapped = items.map((item: any) => {
          const option = options.find((o) => o.text === item.text);
          return {
            id: item.id,
            text: item.text,
            extra_price: item.extra_price,
            is_addon: option?.is_addon ?? false,
          };
        });

        
        setServices(mapped);
      }
    };

    fetchData();
  }, [hasMounted, fetchGalleryUrls]);

  if (!hasMounted) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <ProfileHeader
  myProfileId={myProfileId}
  profileImageUrl={profileImageUrl}
  setProfileImageUrl={setProfileImageUrl}
  setUploading={setUploading}
  uploading={uploading}
/>




      <NaughtyServices
        myProfileId={myProfileId}
        pageProfileId={pageProfileId}
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

      <GallerySection galleryUrls={galleryUrls} refetchGallery={() => pageProfileId && fetchGalleryUrls(pageProfileId)} />
    </div>
  );
}
