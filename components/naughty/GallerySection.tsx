// components/naughty/GallerySection.tsx

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import GlobalModal from "@/components/ui/globalmodal/GlobalModal";
import FullscreenImageViewer from "@/components/ui/globalmodal/FullscreenImageViewer";

interface Props {
  galleryUrls: string[];
  refetchGallery: () => void;
}

export default function GallerySection({ galleryUrls, refetchGallery }: Props) {
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    let file = e.target.files?.[0];
    if (!file || !myProfileId) return;

    setUploading(true);
    setSuccessMessage("");

    if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
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

    const timestamp = Date.now();
    const filePath = `fantasy-profile/stine/gallery/${timestamp}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("naughty-profile")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Galleri upload fejl:", uploadError.message);
      setUploading(false);
      return;
    }

    setSuccessMessage("Billedet er uploadet!");
    setUploading(false);
    refetchGallery();
  };

  const handleImageClick = (url: string) => {
    setSelectedImageUrl(url);
    setShowModal(true);
  };

  const handleDelete = async (url: string) => {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    const path = `fantasy-profile/stine/gallery/${filename}`;

    const { error } = await supabase.storage
      .from("naughty-profile")
      .remove([path]);

    if (error) {
      console.error("Fejl ved sletning:", error.message);
    } else {
      setSuccessMessage("Billedet er slettet!");
      refetchGallery();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Galleri</h2>
        {myProfileId === "5687c342-1a13-441c-86ca-f7e87e1edbd5" && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-pink-500 text-white text-sm font-semibold rounded hover:bg-pink-600 transition"
            disabled={uploading}
          >
            {uploading ? "Uploader..." : "Upload billede"}
          </button>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          ref={fileInputRef}
        />
      </div>

      {successMessage && (
        <p className="text-green-600 text-sm font-medium">{successMessage}</p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {galleryUrls.map((url, i) => (
          <div key={i} className="relative group">
            <Image
              src={url}
              alt={`Galleri ${i + 1}`}
              width={300}
              height={300}
              className="rounded-md object-cover cursor-pointer hover:opacity-80 transition"
              onClick={() => handleImageClick(url)}
            />
            {myProfileId === "5687c342-1a13-441c-86ca-f7e87e1edbd5" && (
              <button
                onClick={() => handleDelete(url)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition"
              >
                Slet
              </button>
            )}
          </div>
        ))}
      </div>

      {showModal && selectedImageUrl && (
        <GlobalModal open={true} onClose={() => setShowModal(false)}>
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
