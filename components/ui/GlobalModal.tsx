// /components/ui/GlobalModal.tsx
"use client";
import { ReactNode } from "react";
import { X } from "lucide-react";
import Badge from "@/components/ui/CategoryBadge";

type GlobalModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  imageUrl?: string;
  children: ReactNode;    // <-- skal være children, ikke content
  categories?: string[];
  footer?: ReactNode;
};

export default function GlobalModal({
  open,
  onClose,
  title,
  imageUrl,
  children,
  categories,
  footer,
}: GlobalModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden relative flex flex-col"
        style={{ maxHeight: '90vh' }} // Max højde, så modal ikke fylder hele skærmen
      >
        {/* Luk modal */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 z-20"
          aria-label="Luk"
          type="button"
          style={{ background: 'white', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <X size={28} />
        </button>

        {/* Indhold som scrollable område inkl. billede */}
        <div
          className="px-8 pt-6 pb-4 flex flex-col text-left overflow-y-auto"
          style={{ flexGrow: 1, minHeight: 0 }}
        >
          {/* Billede */}
          {imageUrl && (
            <div className="mb-4">
              <img
                src={imageUrl}
                alt="Modal billede"
                className="w-full h-56 object-cover rounded-2xl"
              />
            </div>
          )}

          {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}

          {/* Her indsættes din tekst/children */}
          {children}

          {/* Streg */}
          <div className="border-b border-gray-300 w-full my-4" />

          {/* Kategorier */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <Badge key={cat}>{cat}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t px-8 py-5 flex justify-end flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
