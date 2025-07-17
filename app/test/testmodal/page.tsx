// /app/modal-test/page.tsx
"use client";
import { useState, useEffect } from "react";
import { createModalObject, fetchAllModalObjects, ModalObject } from "@/lib/modalObjects";
import { useUserContext } from "@/context/UserContext";
import ModalCard from "@/components/ui/globalmodal/ModalCard";

export default function ModalTestPage() {
  const { user } = useUserContext();
  const [modals, setModals] = useState<ModalObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await fetchAllModalObjects();
        setModals(result);
      } catch (e: any) {
        setError(e?.message || "Kunne ikke hente modaler.");
      }
      setLoading(false);
    }
    load();
  }, []);

  function handleUpdateModal(updatedModal: ModalObject) {
    setModals((prev) =>
      prev.map((modal) => modal.id === updatedModal.id ? updatedModal : modal)
    );
  }

  async function handleCreateModal() {
    if (!user) {
      setError("Du skal være logget ind.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newModal = await createModalObject({
        type: "test",
        title: "Ny test modal",
        created_by: user.id,
      });

      if (!newModal) {
        setError("Kunne ikke oprette modal.");
      } else {
        setModals((prev) => [newModal, ...prev]);
      }
    } catch (e: any) {
      setError(e?.message || "Fejl ved oprettelse af modal.");
    }
    setLoading(false);
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Modal test</h1>

      <button
        className="btn btn-primary mb-8"
        onClick={handleCreateModal}
        disabled={loading || !user}
      >
        {loading ? "Opretter..." : "Opret ny modal"}
      </button>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {modals.map((modal) => (
          <ModalCard key={modal.id} modal={modal} onUpdateModal={handleUpdateModal} />
        ))}
      </div>
    </main>
  );
}
