"use client";

import { useState } from "react";
import GlobalModal from "@/components/ui/GlobalModal";

const CategoryBadge = ({ label }: { label: string }) => (
  <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold mr-2 mb-1">
    {label}
  </span>
);

export default function TestPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-purple-50 to-orange-50 p-6">
      <button
        onClick={() => setModalOpen(true)}
        className="px-6 py-3 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 transition mb-6"
      >
        Åbn modal
      </button>

      <GlobalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Test af Global Modal"
        imageUrl="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
        categories={["Inspiration", "Sommer", "Motivation"]}
        footer={
          <div className="flex gap-4">
            <button
              onClick={() => alert("Rediger klikket")}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Rediger
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Gem
            </button>
          </div>
        }
      >
        {/* Indholdet som children */}
        <p className="mb-3 text-gray-700">
          Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

          The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.
          Brug <code>children</code> til alt dit indhold!
        </p>
      </GlobalModal>
    </main>
  );
}
