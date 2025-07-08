import { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

type Memory = {
  id: number;
  imageUrl: string;
  description: string;
  location: string;
  date: string;
  lat: number;
  lng: number;
};

const memories: Memory[] = [
  {
    id: 1,
    imageUrl: "/demo/1.jpg",
    description: "Vores første kys på stranden 🌊",
    location: "Blåvand",
    date: "2024-07-01",
    lat: 55.5615,
    lng: 8.1104,
  },
  {
    id: 2,
    imageUrl: "/demo/2.jpg",
    description: "Sikke et eventyr! 🚲",
    location: "Berlin",
    date: "2024-06-15",
    lat: 52.5200,
    lng: 13.4050,
  },
  {
    id: 3,
    imageUrl: "/demo/3.jpg",
    description: "Kaffe og croissanter i Paris ☕🥐",
    location: "Paris",
    date: "2024-04-03",
    lat: 48.8566,
    lng: 2.3522,
  },
  {
    id: 4,
    imageUrl: "/demo/4.jpg",
    description: "Sommerhustur med brætspil 🎲",
    location: "Rømø",
    date: "2023-08-19",
    lat: 55.1304,
    lng: 8.5586,
  },
  {
    id: 5,
    imageUrl: "/demo/5.jpg",
    description: "Din fødselsdag med familien 🎂",
    location: "Odense",
    date: "2023-05-21",
    lat: 55.4038,
    lng: 10.4024,
  },
  {
    id: 6,
    imageUrl: "/demo/6.jpg",
    description: "Første date i Tivoli 🎡",
    location: "København",
    date: "2022-12-12",
    lat: 55.6761,
    lng: 12.5683,
  },
  {
    id: 7,
    imageUrl: "/demo/7.jpg",
    description: "Grillaften på altanen 🍔",
    location: "Vejle",
    date: "2022-07-04",
    lat: 55.7113,
    lng: 9.5364,
  },
  {
    id: 8,
    imageUrl: "/demo/8.jpg",
    description: "Solnedgang ved havnen 🌅",
    location: "Svendborg",
    date: "2021-08-30",
    lat: 55.0598,
    lng: 10.6068,
  },
  {
    id: 9,
    imageUrl: "/demo/9.jpg",
    description: "Overnatning i shelter 🌲",
    location: "Mols Bjerge",
    date: "2021-05-15",
    lat: 56.2286,
    lng: 10.5639,
  },
];

// Sæt din Google Maps API key her eller brug .env
const GOOGLE_MAPS_KEY = "DIN_GOOGLE_MAPS_API_KEY"; // <-- Sæt din egen API-nøgle

export default function MinderGrid() {
  const [selected, setSelected] = useState<Memory | null>(null);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Vores Minder</h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {memories.map((mem) => (
          <button
            key={mem.id}
            onClick={() => setSelected(mem)}
            className="relative group focus:outline-none"
            type="button"
          >
            <img
              src={mem.imageUrl}
              alt={mem.description}
              className="w-full h-32 sm:h-40 object-cover rounded-md shadow group-hover:opacity-90 transition"
            />
            <div className="absolute bottom-1 left-1 right-1 bg-white bg-opacity-75 text-xs rounded px-2 py-1 text-gray-700 opacity-0 group-hover:opacity-100 transition truncate">
              {mem.description}
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full relative p-4">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setSelected(null)}
              type="button"
            >
              ×
            </button>
            <img
              src={selected.imageUrl}
              alt={selected.description}
              className="w-full h-60 object-cover rounded-lg mb-4"
            />
            <div className="mb-2 text-sm text-gray-700">{selected.description}</div>
            <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
              <span>{selected.location}</span>
              <span>{selected.date}</span>
            </div>
            <GoogleMemoryMap lat={selected.lat} lng={selected.lng} />
          </div>
        </div>
      )}
    </div>
  );
}

type MapProps = { lat: number; lng: number };

function GoogleMemoryMap({ lat, lng }: MapProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  });

  if (!isLoaded) return <div className="text-center py-6 text-sm text-gray-400">Indlæser kort…</div>;

  return (
    <div className="w-full h-44 rounded-lg overflow-hidden shadow">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={{ lat, lng }}
        zoom={13}
        options={{ disableDefaultUI: true }}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </div>
  );
}
