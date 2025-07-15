"use client";

import { useState } from "react";
import GlobalModal from "@/components/ui/globalmodal/GlobalModal";
import Badge from "@/components/ui/CategoryBadge";
import UserAvatarName from "@/components/ui/globalmodal/UserAvatarName";
import RichTextEditor from "@/components/ui/RichTextEditor"; // IMPORT

type GalleryImage = {
  id: string;
  url: string;
  alt?: string;
};

export default function TestPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80");
  const [title, setTitle] = useState("Test af Global Modal");
  const [categories, setCategories] = useState(["Inspiration", "Sommer", "Motivation"]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([
    {
      id: "1",
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
      alt: "Billede 1",
    },
    {
      id: "2",
      url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=400&q=80",
      alt: "Billede 2",
    },
  ]);
  // --- NYT: description state
  const [description, setDescription] = useState("<p>Dette er en <b>beskrivelse</b> skrevet i richtext editoren.</p>");

  // Test-dato – i praksis fra Supabase
  const createdAt = new Date("2024-07-01T14:12:00");

  function handleSave(updatedData: {
    title?: string;
    imageUrl?: string;
    galleryImages?: Array<{ id: string; url: string; alt?: string }>;
    categories?: string[];
    description?: string; // NYT
  }) {
    if (updatedData.imageUrl) setImageUrl(updatedData.imageUrl);
    if (updatedData.title) setTitle(updatedData.title);
    if (updatedData.categories) setCategories(updatedData.categories);
    if (updatedData.galleryImages) setGalleryImages(updatedData.galleryImages);
    if (updatedData.description !== undefined) setDescription(updatedData.description); // NYT
    setModalOpen(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-purple-50 to-orange-50 p-6">
      {/* CARD */}
      <div
        className="bg-white shadow-xl rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 max-w-xs w-full"
        onClick={() => setModalOpen(true)}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Banner"
            className="w-full h-40 object-cover"
          />
        )}
        <div className="p-5 flex flex-col gap-2">
          <UserAvatarName createdAt={createdAt} />
          <h2 className="font-bold text-lg text-gray-800">{title}</h2>
          <div className="flex gap-2 flex-wrap mb-2">
            {categories.map((cat) => (
              <Badge key={cat}>{cat}</Badge>
            ))}
          </div>
          {/* --- VIS RICHTEXT BESKRIVELSE --- */}
          <div className="prose prose-sm text-gray-700 mb-2" dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      </div>

      {/* MODAL */}
      <GlobalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={title}
        imageUrl={imageUrl}
        categories={categories}
        galleryImages={galleryImages}
        canUploadGallery={true}
        onUploadGalleryClick={(newImages) => setGalleryImages(newImages)}
        onSave={handleSave}
        description={description} // NYT - send description ned
        setDescription={setDescription} // NYT - send setter ned hvis editor skal bruges her!
      >
        <div className="mb-3 text-gray-700 prose prose-sm" dangerouslySetInnerHTML={{ __html: description }} />
        {/* Avatar og brugerinfo UNDER teksten */}
        <UserAvatarName createdAt={createdAt} className="mt-4" />
      </GlobalModal>
    </main>
  );
}
