// components/ui/globalmodal/CategoryBadge.tsx
import { ReactNode } from "react";

type Props = {
  color?: "purple" | "blue" | "green" | "orange" | "gray";
  children: ReactNode;
};

const colorClasses = {
  purple: "bg-purple-100 text-purple-800",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
  gray: "bg-gray-200 text-gray-800",
};

export default function CategoryBadge({ color = "gray", children }: Props) {
  return (
    <span
      className={`px-2 py-1 text-xs rounded-md ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
}
