// /components/ui/CategoryBadge.tsx

import React from "react";

interface CategoryBadgeProps {
  children: React.ReactNode;
  color?: "orange" | "purple" | "green" | "blue";
}

const colorMap = {
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
};

export default function CategoryBadge({
  children,
  color = "orange",
}: CategoryBadgeProps) {
  return (
    <span
      className={`px-4 py-1 rounded-xl text-base font-bold uppercase tracking-wide shadow-sm ${colorMap[color]}`}
    >
      {children}
    </span>
  );
}
