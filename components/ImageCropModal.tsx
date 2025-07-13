// /components/widgets/ImageCropModal.tsx

import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string;
  aspect?: number;
  onCancel: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  open,
  imageSrc,
  aspect = 3 / 1,
  onCancel,
  onCropComplete
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropAreaComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (err) {
      alert('Kunne ikke beskære billedet');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-4 max-w-lg w-full relative">
        <h2 className="font-bold text-lg mb-2">Beskær billede</h2>
        <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="rect"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropAreaComplete}
          />
        </div>
        <div className="flex justify-between items-center mt-4">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Annullér</button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-32 mx-4"
          />
          <button
            onClick={handleCrop}
            className="px-4 py-2 bg-purple-600 text-white rounded shadow"
            disabled={loading}
          >
            {loading ? 'Gemmer…' : 'Gem'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
