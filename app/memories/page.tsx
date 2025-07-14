"use client";

import React, { useState } from "react";
import MemoriesGallery from "@/components/memories/MemoriesGallery";
import GlobalModal from "@/components/ui/GlobalModal";

export default function MemoriesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<any>(null);

  const handleMemoryClick = (memory: any) => {
    console.log("VALGT BILLEDE (side):", memory);
    setSelectedMemory(memory);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedMemory(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-tr from-purple-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Minde-galleri</h1>
        <MemoriesGallery onMemoryClick={handleMemoryClick} />

        <button
          onClick={() => {
            console.log("Test: Åbner modal manuelt");
            setModalOpen(true);
          }}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded"
        >
          Test: Åben modal manuelt
        </button>

        <GlobalModal
          open={modalOpen}
          onClose={handleCloseModal}
          title={selectedMemory?.title || "Detaljer"}
        >
          {selectedMemory && (
            <div className="flex flex-col items-center">
              <img
                src={selectedMemory.image_url}
                alt={selectedMemory.title || ""}
                className="max-h-72 rounded-xl mb-4"
              />
              {selectedMemory.description && (
                <div className="mb-2 text-center">{selectedMemory.description}</div>
              )}
              {selectedMemory.taken_at && (
                <div className="text-xs text-gray-500 mb-2">
                  Dato: {new Date(selectedMemory.taken_at).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </GlobalModal>
      </div>
    </main>
  );
}
