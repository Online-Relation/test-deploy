// app/dashboard/images/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { Button } from "@/components/ui/button";

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-]+|[-]+$/g, "");
}

export default function ImageUploadPage() {
  const { user } = useUserContext();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log("🖼️ File selected:", e.target.files[0]);
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!user || !file) return;
    setUploading(true);
    setError(null);

    const fileExt = file.name.split(".").pop();
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const safeName = sanitizeFileName(baseName);
    const filePath = `original_${user.id}_dashboard_${Date.now()}.${fileExt}`;

    console.log("📂 Uploading file to: dashboard/", filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("dashboard")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    console.log("📦 Upload response:", { uploadData, uploadError });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      setError("Fejl under upload. Prøv igen.");
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("dashboard")
      .getPublicUrl(filePath);

    console.log("🌐 Public URL response:", publicUrlData);

    const imageUrl = publicUrlData?.publicUrl;

    if (!imageUrl) {
      console.error("❌ No public URL found");
      setError("Kunne ikke hente billede-URL.");
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("dashboard_images").insert({
      user_id: user.id,
      image_url: imageUrl,
    });

    console.log("📝 Insert to DB result:", insertError);

    if (insertError) {
      setError("Kunne ikke gemme i databasen.");
      setUploading(false);
      return;
    }

    router.push("/memories?uploaded=true");

  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-xl font-bold mb-4">Upload et minde</h1>
      <label className="cursor-pointer inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm">
        Vælg billede
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      {file && <p className="mt-2 text-sm text-gray-600">Valgt fil: {file.name}</p>}
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      <Button onClick={handleUpload} disabled={uploading || !file} className="mt-4">
        {uploading ? "Uploader..." : "Upload billede"}
      </Button>
    </div>
  );
}
