// /components/ui/SaveButton.tsx
"use client";

import { ButtonHTMLAttributes } from "react";

type SaveButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export default function SaveButton({ loading, children, ...props }: SaveButtonProps) {
  return (
    <button
      type={props.type || "submit"}
      className={`btn btn-primary flex items-center gap-2 disabled:opacity-50${props.className ? " " + props.className : ""}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span
          className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
          style={{ display: "inline-block" }}
        />
      )}
      <span>{children || "Gem"}</span>
    </button>
  );
}
