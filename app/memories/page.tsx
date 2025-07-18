// /app/memories/page.tsx

"use client";

import React, { useState } from "react";
import MemoriesGallery from "@/components/memories/MemoriesGallery";
import GlobalModal from "@/components/ui/globalmodal/GlobalModal";
import UserAvatarName from "@/components/ui/globalmodal/UserAvatarName";
import { updateDashboardImage } from "@/lib/dashboardImages";
import FullscreenImageViewer from "@/components/ui/globalmodal/FullscreenImageViewer"; // <-- NY

export default function MemoriesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<any>(null);

  // GALLERI TIL FULLSCREEN
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Når du klikker på et billede i galleriet:
  const handleMemoryClick = (memory: any, allImages?: any[]) => {
    setSelectedMemory(memory);
    setModalOpen(true);

    // For at muliggøre galleri-navigation i fullscreen:
    // Husk at give alle billeder med fra MemoriesGallery (nyt!)
    if (allImages && allImages.length > 0) {
      setGalleryImages(allImages);
      const idx = allImages.findIndex(img => img.id === memory.id);
      setFullscreenIndex(idx >= 0 ? idx : 0);
    } else {
      setGalleryImages([memory]);
      setFullscreenIndex(0);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMemory(null);
    setShowFullscreen(false);
  };

  const handleSaveMemory = async (data: any) => {
    if (!selectedMemory?.id) return;
    const updated = await updateDashboardImage(selectedMemory.id, {
      title: data.title,
      description: data.description,
      type: data.type,
      categories: data.categories,
    });
    if (updated) {
      setSelectedMemory(updated);
      setModalOpen(false);
    } else {
      alert("Kunne ikke opdatere minde!");
    }
  };

  // Det viste billede i modal og fullscreen
  const imageUrl = selectedMemory?.original_image_url || selectedMemory?.image_url;

  // Udtræk alle billed-urls til galleri (brug kun original_image_url hvis tilgængelig)
  const galleryImageUrls = galleryImages.map(
    img => img?.original_image_url || img?.image_url
  );

  return (
    <main className="min-h-screen bg-gradient-to-tr from-purple-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Minde-galleri</h1>
        {/* 
          Tilføj: 
          - send også alle billeder til MemoriesGallery, så du kan sende allImages med på klik
        */}
        <MemoriesGallery
          onMemoryClick={(memory, allImages) => handleMemoryClick(memory, allImages)}
        />

        <GlobalModal
          open={modalOpen}
          onClose={handleCloseModal}
          title={selectedMemory?.title || ""}
          description={selectedMemory?.description || ""}
          onSave={handleSaveMemory}
          typeId={selectedMemory?.type || "memory"}
          categories={selectedMemory?.categories || []}
        >
          <div className="flex flex-col items-center w-full">
            {/* Klikbart billede */}
            <div className="flex justify-center items-center w-full" style={{ minHeight: 360 }}>
              <img
                src={imageUrl}
                alt={selectedMemory?.title || ""}
                className="max-w-full max-h-[70vh] w-auto h-auto rounded-xl mb-4 shadow cursor-zoom-in"
                style={{
                  display: "block",
                  objectFit: "contain",
                  margin: "0 auto",
                  background: "#eee",
                  maxHeight: "70vh"
                }}
                onClick={() => setShowFullscreen(true)}
                draggable={false}
              />
            </div>
            <div className="flex items-center w-full mb-2">
              <UserAvatarName
                userId={selectedMemory?.user_id}
                createdAt={selectedMemory?.created_at}
                className="ml-0"
              />
            </div>
            {selectedMemory?.title && (
              <div className="font-bold text-lg mb-2 w-full text-left">
                {selectedMemory.title}
              </div>
            )}
            {selectedMemory?.description && (
              <div className="mb-2 text-left w-full">
                {selectedMemory.description}
              </div>
            )}
            <div className="text-xs text-gray-500 mb-1 w-full text-left">
              Uploadet d.{" "}
              {selectedMemory?.taken_at
                ? new Date(selectedMemory.taken_at).toLocaleDateString("da-DK")
                : selectedMemory?.created_at
                ? new Date(selectedMemory.created_at).toLocaleDateString("da-DK")
                : "ukendt"}
            </div>
            {selectedMemory?.latitude && selectedMemory?.longitude && (
              <div className="text-xs text-blue-600 mb-2 w-full text-left">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedMemory.latitude},${selectedMemory.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Åbn i Google Maps
                </a>
              </div>
            )}
          </div>
        </GlobalModal>

        {/* FULLSCREEN BILLEDE MED GALLERI OG PILE */}
        {showFullscreen && galleryImageUrls.length > 0 && (
          <FullscreenImageViewer
            images={galleryImageUrls}
            currentIndex={fullscreenIndex}
            onClose={() => setShowFullscreen(false)}
            onPrev={() =>
              setFullscreenIndex(i => (i === 0 ? galleryImageUrls.length - 1 : i - 1))
            }
            onNext={() =>
              setFullscreenIndex(i => (i === galleryImageUrls.length - 1 ? 0 : i + 1))
            }
            alt={selectedMemory?.title}
          />
        )}
      </div>
    </main>
  );
}
