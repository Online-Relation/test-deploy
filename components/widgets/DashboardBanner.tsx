// /components/widgets/DashboardBanner.tsx
"use client";
import React, { useRef, useState, useEffect } from "react";
import { uploadImageToSupabase } from "@/lib/uploadImageToSupabase";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import ImageCropModal from "../ImageCropModal";
import * as exifr from "exifr";

const DashboardBanner = () => {
  const { user } = useUserContext();
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Uploaderens navn
  const [uploaderName, setUploaderName] = useState<string>("");

  // Citater
  const [quotes, setQuotes] = useState<string[]>([]);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [activeQuote, setActiveQuote] = useState<string>("");

  // Cropping & metadata state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingMeta, setPendingMeta] = useState<{ taken_at?: Date; latitude?: number; longitude?: number }>({});

  // Hent seneste bannerbillede globalt med uploader id
  useEffect(() => {
    const fetchLatestBanner = async () => {
      const { data, error } = await supabase
        .from("dashboard_images")
        .select("image_url, user_id")
        .eq("widget_location", "dashboard_banner")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Fejl ved hentning af banner:", error);
        return;
      }
      if (data?.image_url) {
        setImageUrl(data.image_url);

        // Hent uploaderens display_name
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", data.user_id)
          .single();

        if (profileError) {
          console.error("Fejl ved hentning af uploaderens navn:", profileError);
          setUploaderName("");
        } else {
          setUploaderName(profileData?.display_name || "");
        }
      }
    };
    fetchLatestBanner();
  }, []);

  // Hent alle quotes fra Supabase
  useEffect(() => {
    const fetchQuotes = async () => {
      const { data, error } = await supabase
        .from("banner_image_quotes")
        .select("text")
        .order("id", { ascending: true });

      if (error) {
        console.error("Fejl ved hentning af citater:", error);
        return;
      }
      if (data) {
        const allQuotes = data.map((row: { text: string }) => row.text);
        setQuotes(allQuotes);
      }
    };
    fetchQuotes();
  }, []);

  // Opdater aktivt citat ud fra quoteIndex
  useEffect(() => {
    if (quotes.length === 0) {
      setActiveQuote("");
      return;
    }

    if (quoteIndex >= quotes.length) {
      setActiveQuote("Er der virkelig ikke mere inspirations citater til flere oplevelser?");
    } else {
      setActiveQuote(quotes[quoteIndex]);
    }
  }, [quoteIndex, quotes]);

  // Funktion til at skifte citat til næste index (med stop efter sidste)
  const advanceQuoteIndex = () => {
    setQuoteIndex((current) => {
      if (quotes.length === 0) return 0;
      if (current + 1 >= quotes.length) return quotes.length; // beyond last index => fallback text
      return current + 1;
    });
  };

  // Skift citat dagligt kl 01:00
  useEffect(() => {
    const now = new Date();
    const nextOneAM = new Date(now);
    nextOneAM.setHours(1, 0, 0, 0);
    if (now >= nextOneAM) {
      nextOneAM.setDate(nextOneAM.getDate() + 1);
    }
    const msUntilNextOneAM = nextOneAM.getTime() - now.getTime();

    const timerId = setTimeout(() => {
      advanceQuoteIndex();

      const intervalId = setInterval(() => {
        advanceQuoteIndex();
      }, 24 * 60 * 60 * 1000);

      return () => clearInterval(intervalId);
    }, msUntilNextOneAM);

    return () => clearTimeout(timerId);
  }, [quotes]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    // EXIF-læsning
    let meta: any = {};
    try {
      meta = await exifr.parse(file);
      console.log("EXIF meta:", meta);
    } catch (err) {
      meta = {};
      console.warn("Kunne ikke læse EXIF-data:", err);
    }

    let takenAt: Date | undefined = undefined;
    if (meta.DateTimeOriginal) {
      takenAt = new Date(meta.DateTimeOriginal);
    } else if (meta.CreateDate) {
      takenAt = new Date(meta.CreateDate);
    }

    setPendingMeta({
      taken_at: takenAt,
      latitude: meta.latitude,
      longitude: meta.longitude,
    });

    // Konverter HEIC til JPEG hvis nødvendigt
    if (
      file.type === "image/heic" ||
      file.name.endsWith(".heic") ||
      file.type === "image/heif"
    ) {
      try {
        const heic2any = (await import("heic2any")).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.95,
        });
        const realBlob = Array.isArray(convertedBlob)
          ? convertedBlob[0]
          : convertedBlob;
        file = new File([realBlob], file.name.replace(/\.heic$/i, ".jpg"), {
          type: "image/jpeg",
        });
      } catch (err) {
        alert(
          "Kunne ikke konvertere HEIC-billede. Prøv igen med JPG eller PNG."
        );
        return;
      }
    }

    setRawImage(URL.createObjectURL(file));
    setPendingFile(file);
    setCropModalOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user?.id) return;
    setUploading(true);
    setCropModalOpen(false);

    // Konverter blob til File for upload
    const croppedFile = new File(
      [croppedBlob],
      pendingFile?.name || "cropped.jpg",
      { type: "image/jpeg" }
    );

    try {
      const url = await uploadImageToSupabase(croppedFile, user.id);
      setImageUrl(url);
      // Gem i DB inkl. metadata
      await supabase.from("dashboard_images").insert([
        {
          user_id: user.id,
          image_url: url,
          widget_location: "dashboard_banner",
          taken_at: pendingMeta.taken_at
            ? pendingMeta.taken_at.toISOString()
            : null,
          latitude: pendingMeta.latitude,
          longitude: pendingMeta.longitude,
        },
      ]);
    } catch (error) {
      alert("Upload fejlede");
    } finally {
      setUploading(false);
      setRawImage(null);
      setPendingFile(null);
      setPendingMeta({});
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setRawImage(null);
    setPendingFile(null);
    setPendingMeta({});
  };

return (
  <>
    <div className="w-full rounded-2xl shadow-md overflow-hidden mb-6 relative bg-white bg-opacity-90 flex flex-col items-center p-4 space-y-4">
      {/* Overskrift med uploaderens navn */}
      {uploaderName && (
        <div className="w-full px-2 text-sm font-semibold text-gray-700 italic">
          Det her minde betød noget for <span className="font-bold">{uploaderName}</span>
        </div>
      )}

      {/* Bannerbillede container */}
      <div className="w-full relative aspect-[3/1.5] bg-gradient-to-tr from-purple-100 to-orange-100 rounded-xl overflow-hidden flex items-center justify-center">
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
            className="flex flex-col items-center justify-center w-full h-full bg-white bg-opacity-40 hover:bg-opacity-60 transition rounded-xl"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            <span className="text-5xl mb-2">+</span>
            <span className="font-medium text-gray-500">
              {uploading ? "Uploader..." : "Upload billede"}
            </span>
          </button>
        )}
        {imageUrl && (
          <button
            className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow"
            onClick={handleUploadClick}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536M9 11l6 6M9 11l-6 6m6-6v8.5a2.5 2.5 0 002.5 2.5h5a2.5 2.5 0 002.5-2.5v-5a2.5 2.5 0 00-2.5-2.5H11"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Citat */}
      <div className="w-full rounded-lg bg-white bg-opacity-80 p-4 text-center font-semibold italic text-gray-600 shadow">
        {activeQuote}
      </div>
    </div>

    <ImageCropModal
      open={cropModalOpen}
      imageSrc={rawImage || ""}
      onCancel={handleCropCancel}
      onCropComplete={handleCropComplete}
      aspect={3 / 1}
    />
  </>
);



};

export default DashboardBanner;
