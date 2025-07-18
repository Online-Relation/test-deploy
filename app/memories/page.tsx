// /app/memories/page.tsx

"use client";

import React, { useState } from "react";
import MemoriesGallery from "@/components/memories/MemoriesGallery";
import GlobalModal from "@/components/ui/globalmodal/GlobalModal";
import UserAvatarName from "@/components/ui/globalmodal/UserAvatarName";
import { updateDashboardImage } from "@/lib/dashboardImages";

export default function MemoriesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<any>(null);

  // Åben modal når billede klikkes
  const handleMemoryClick = (memory: any) => {
    setSelectedMemory(memory);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMemory(null);
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
      // TODO: evt. genindlæs billeder hvis du ønsker at listen opdateres
    } else {
      alert("Kunne ikke opdatere minde!");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-tr from-purple-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Minde-galleri</h1>
        <MemoriesGallery onMemoryClick={handleMemoryClick} />

        

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
    <img
      src={selectedMemory?.original_image_url || selectedMemory?.image_url}
      alt={selectedMemory?.title || ""}
      className="max-h-72 rounded-xl mb-4 w-full object-contain"
    />
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
      </div>
    </main>
  );
}
