// components/ui/globalmodal/types.ts

export type Category = {
  id: string;
  label: string;
  color: "orange" | "blue" | "green" | "purple" | "gray";
  type: string; // <-- TILFØJ: fx "fantasy", "bucketlist", "global", osv.
};

export type GalleryImage = {
  id: string;
  url: string;
  alt?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  avatarUrl?: string;
};
