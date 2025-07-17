// /components/ui/UserAvatarName.tsx
"use client";
import { useUserContext } from "@/context/UserContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserAvatarNameProps = {
  userId?: string;               // NYT: Valgfri, hvis du vil vise en anden bruger end den indloggede
  createdAt?: Date | string;
  className?: string;
};

export default function UserAvatarName({ userId, createdAt, className = "" }: UserAvatarNameProps) {
  const { user: currentUser } = useUserContext();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      // Hvis vi vil vise en anden bruger end den loggede ind
      if (userId && userId !== currentUser?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", userId)
          .single();
        setProfile(data);
      } else {
        setProfile(currentUser);
      }
    }
    fetchProfile();
    // eslint-disable-next-line
  }, [userId, currentUser]);

  if (!profile) return null;

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
        src={profile.avatar_url || "/avatar-fallback.png"}
        alt={profile.display_name || "Bruger"}
        className="w-10 h-10 rounded-full border"
      />
      <div className="flex flex-col">
        <span className="font-semibold text-gray-700">{profile.display_name || "Ukendt bruger"}</span>
        {createdAt && (
          <span className="text-xs text-gray-500">
            Oprettet {formattedDate}
          </span>
        )}
      </div>
    </div>
  );
}
