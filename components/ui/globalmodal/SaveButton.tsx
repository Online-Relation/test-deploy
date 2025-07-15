// /components/ui/SaveButton.tsx
"use client";

import { ButtonHTMLAttributes } from "react";

type SaveButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export default function SaveButton({ loading, children, ...props }: SaveButtonProps) {
  return (
    <button
      type="submit"
      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
      ) : null}
      {children || "Gem"}
    </button>
  );
}
