'use client';

import { useState, useRef } from 'react';

type Manifestation = {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
};

export default function ManifestationBoard() {
  const [cards, setCards] = useState<Manifestation[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState('');
  const [selectedCard, setSelectedCard] = useState<Manifestation | null>(null);
  const [editingCard, setEditingCard] = useState<Manifestation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addCard = () => {
    if (!newTitle.trim()) return;
    const newCard: Manifestation = {
      id: Date.now(),
      title: newTitle,
      description: newDescription,
      imageUrl: newImage,
    };
    setCards([...cards, newCard]);
    setNewTitle('');
    setNewDescription('');
    setNewImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteCard = (id: number) => {
    setCards(cards.filter((card) => card.id !== id));
  };

  const updateCard = () => {
    if (!editingCard) return;
    setCards(cards.map((card) => (card.id === editingCard.id ? editingCard : card)));
    setEditingCard(null);
  };

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">🧭 Manifestation Board</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-white shadow rounded p-4 border relative"
            onClick={() => setSelectedCard(card)}
          >
            {card.imageUrl && (
              <img
                src={card.imageUrl}
                alt={card.title}
                className="w-full h-40 object-cover rounded mb-2"
              />
            )}
            <h2 className="font-semibold text-lg mb-1">{card.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-3">{card.description}</p>
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCard(card);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Redigér
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCard(card.id);
                }}
                className="text-sm text-red-600 hover:underline"
              >
                Slet
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-100 p-4 rounded shadow">
        <h2 className="font-semibold mb-2">➕ Tilføj nyt kort</h2>
        <input
          type="text"
          placeholder="Titel"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full mb-2 px-3 py-2 border rounded"
        />
        <textarea
          placeholder="Beskrivelse"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="w-full mb-2 px-3 py-2 border rounded"
        />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="w-full mb-2"
        />
        <button
          onClick={addCard}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Tilføj
        </button>
      </div>

      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full relative">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>
            {selectedCard.imageUrl && (
              <img
                src={selectedCard.imageUrl}
                alt={selectedCard.title}
                className="w-full h-48 object-cover rounded mb-4"
              />
            )}
            <h2 className="text-xl font-bold mb-2">{selectedCard.title}</h2>
            <p className="text-gray-700">{selectedCard.description}</p>
          </div>
        </div>
      )}

      {editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full relative">
            <button
              onClick={() => setEditingCard(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">Redigér kort</h2>
            <input
              type="text"
              value={editingCard.title}
              onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
              className="w-full mb-2 px-3 py-2 border rounded"
            />
            <textarea
              value={editingCard.description}
              onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
              className="w-full mb-2 px-3 py-2 border rounded"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => {
                  setEditingCard({ ...editingCard, imageUrl: reader.result as string });
                };
                reader.readAsDataURL(file);
              }}
              className="w-full mb-2"
            />
            <button
              onClick={updateCard}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Gem ændringer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
