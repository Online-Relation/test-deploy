// components/naughty/GallerySection.tsx

import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import GlobalModal from "@/components/ui/globalmodal/GlobalModal";
import FullscreenImageViewer from "@/components/ui/globalmodal/FullscreenImageViewer";

interface Props {
  galleryUrls: string[];
}

export default function GallerySection({ galleryUrls }: Props) {
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) setMyProfileId(session.user.id);
    };
    fetchSession();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myProfileId) return;

    const timestamp = Date.now();
    const filePath = `fantasy-profile/stine/gallery/${timestamp}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("naughty-profile")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Galleri upload fejl:", uploadError.message);
      return;
    }

    window.location.reload();
  };

  const handleImageClick = (url: string) => {
    setSelectedImageUrl(url);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Galleri</h2>

      <div className="grid grid-cols-3 gap-4">
        {galleryUrls.map((url, i) => (
          <Image
            key={i}
            src={url}
            alt={`Galleri ${i + 1}`}
            width={300}
            height={300}
            className="rounded-md object-cover cursor-pointer hover:opacity-80 transition"
            onClick={() => handleImageClick(url)}
          />
        ))}
      </div>

      {myProfileId === "5687c342-1a13-441c-86ca-f7e87e1edbd5" && (
        <div className="pt-4">
          <label className="inline-block px-4 py-2 bg-pink-500 text-white font-semibold rounded hover:bg-pink-600 cursor-pointer transition">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            Upload nyt billede
          </label>
        </div>
      )}

      {showModal && selectedImageUrl && (
        <GlobalModal
          open={true}
          onClose={() => setShowModal(false)}
        >
          <FullscreenImageViewer
  images={[selectedImageUrl]}
  currentIndex={0}
  onClose={() => setShowModal(false)}
  onPrev={() => {}}
  onNext={() => {}}
  alt="Billedevisning"
/>

        </GlobalModal>
      )}
    </div>
  );
}
