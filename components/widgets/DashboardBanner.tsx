// /components/widgets/DashboardBanner.tsx

import React, { useRef, useState, useEffect } from 'react';
import { uploadImageToSupabase } from '@/lib/uploadImageToSupabase';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';
import ImageCropModal from '../ImageCropModal';

const DashboardBanner = () => {
  const { user } = useUserContext();
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Hent billede fra DB ved første load
  useEffect(() => {
    const fetchBanner = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('dashboard_images')
        .select('image_url')
        .eq('user_id', user.id)
        .eq('widget_location', 'dashboard_banner')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data?.image_url) setImageUrl(data.image_url);
    };
    fetchBanner();
  }, [user]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Åbn crop-modal
    setRawImage(URL.createObjectURL(file));
    setPendingFile(file);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user?.id) return;
    setUploading(true);
    setCropModalOpen(false);

    // Konverter blob til File for upload
    const croppedFile = new File([croppedBlob], pendingFile?.name || 'cropped.jpg', { type: 'image/jpeg' });

    try {
      const url = await uploadImageToSupabase(croppedFile, user.id);
      setImageUrl(url);
      // Gem i DB
      await supabase.from('dashboard_images').insert([
        {
          user_id: user.id,
          image_url: url,
          widget_location: 'dashboard_banner'
        }
      ]);
    } catch (error) {
      alert('Upload fejlede');
    } finally {
      setUploading(false);
      setRawImage(null);
      setPendingFile(null);
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setRawImage(null);
    setPendingFile(null);
  };

  return (
   <div className="w-full rounded-2xl shadow-md overflow-hidden mb-6 relative aspect-[3/1] bg-gradient-to-tr from-purple-100 to-orange-100 flex items-center justify-center">

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Forsidebillede"
          className="w-full h-full object-cover"
        />
      ) : (
        <button
          className="flex flex-col items-center justify-center w-full h-full bg-white bg-opacity-40 hover:bg-opacity-60 transition rounded-2xl"
          onClick={handleUploadClick}
          disabled={uploading}
        >
          <span className="text-5xl mb-2">+</span>
          <span className="font-medium text-gray-500">{uploading ? 'Uploader...' : 'Upload billede'}</span>
        </button>
      )}
      {imageUrl && (
        <button
          className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow"
          onClick={handleUploadClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6 6M9 11l-6 6m6-6v8.5a2.5 2.5 0 002.5 2.5h5a2.5 2.5 0 002.5-2.5v-5a2.5 2.5 0 00-2.5-2.5H11" />
          </svg>
        </button>
      )}
      <ImageCropModal
        open={cropModalOpen}
        imageSrc={rawImage || ''}
        onCancel={handleCropCancel}
        onCropComplete={handleCropComplete}
        aspect={3 / 1}
      />
    </div>
  );
};

export default DashboardBanner;
