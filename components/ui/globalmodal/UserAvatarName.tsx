// /components/ui/UserAvatarName.tsx
"use client";
import { useUserContext } from "@/context/UserContext";

type UserAvatarNameProps = {
  createdAt?: Date | string;
  className?: string;
};

export default function UserAvatarName({ createdAt, className = "" }: UserAvatarNameProps) {
  const { user } = useUserContext();

  if (!user) return null;

  // Dato-format
  let formattedDate = "";
  if (createdAt) {
    const dateObj = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
    formattedDate = dateObj.toLocaleDateString("da-DK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={user.avatar_url || "/avatar-fallback.png"}
        alt={user.display_name || "Bruger"}
        className="w-10 h-10 rounded-full border"
      />
      <div className="flex flex-col">
        <span className="font-semibold text-gray-700">{user.display_name}</span>
        {createdAt && (
          <span className="text-xs text-gray-500">
            Oprettet {formattedDate}
          </span>
        )}
      </div>
    </div>
  );
}
