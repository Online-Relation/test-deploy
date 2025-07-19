// /components/memories/MemoryTimelinePolaroids.tsx

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { useUserContext } from "@/context/UserContext";

type Memory = {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  taken_at: string;
  category?: string;
  badge?: string;
};

const polaroidAngles = [4, -5, 3, -7, 6, -2];

function MemoryTimelinePolaroids() {
  const { user } = useUserContext();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMemories = async () => {
      if (!user?.id || !user?.partner_id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("dashboard_images")
        .select("*")
        .in("user_id", [user.id, user.partner_id])
        .order("taken_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fejl ved hentning af billeder:", error);
        setMemories([]);
        setLoading(false);
        return;
      }

      const mapped = (data || []).map((img: any) => ({
        id: img.id,
        title: img.title || "Minde",
        description: img.description,
        image_url: img.image_url,
        taken_at: img.taken_at || img.created_at,
        category: img.categories?.[0]?.label,
        badge: img.categories?.[0]?.emoji || "",
      }));

      setMemories(mapped);
      setLoading(false);
    };
    fetchMemories();
  }, [user]);

  return (
    <div className="py-10 px-2 bg-gradient-to-tr from-purple-50 to-orange-50 min-h-[80vh]">
      <h2 className="text-3xl font-bold text-center mb-8">Vores historie</h2>
      {loading ? (
        <div className="text-center text-gray-400">Henter minder…</div>
      ) : (
        <div className="relative flex items-center w-full overflow-x-auto scrollbar-hide pb-12">
          {/* Timeline line */}
          <div
            className="absolute left-0 right-0 top-1/2 h-2 bg-gradient-to-r from-purple-300 to-orange-300 rounded-full opacity-30 z-0"
            style={{ transform: "translateY(-50%)" }}
          />
          <div className="flex gap-12 px-10 z-10">
            {memories.map((mem, idx) => (
              <motion.div
                key={mem.id}
                initial={{
                  y: 50,
                  opacity: 0,
                  rotate: polaroidAngles[idx % polaroidAngles.length],
                }}
                animate={{
                  y: 0,
                  opacity: 1,
                  rotate: polaroidAngles[idx % polaroidAngles.length],
                }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                className="relative group shadow-xl cursor-pointer"
                style={{ minWidth: 220, maxWidth: 250, zIndex: 1 + idx }}
              >
                {/* Polaroid ramme */}
                <div
                  className="bg-white rounded-2xl border border-gray-200 p-3 flex flex-col items-center shadow-2xl transition group-hover:scale-105 group-hover:z-20"
                  style={{
                    boxShadow: "0 8px 40px rgba(80,40,80,0.18)",
                  }}
                >
                  <img
                    src={mem.image_url}
                    alt={mem.title}
                    className="w-full h-40 object-cover rounded-xl mb-2"
                  />
                  <div className="w-full text-sm font-handwrite text-gray-700 text-left mb-1 flex items-center gap-2">
                    <span>{mem.badge}</span>
                    <span>{mem.title}</span>
                  </div>
                  <div
                    className="w-full text-xs text-gray-400 mb-2"
                    style={{ fontFamily: "monospace" }}
                  >
                    {mem.taken_at
                      ? new Date(mem.taken_at).toLocaleDateString("da-DK", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </div>
                  <div className="w-full text-xs text-gray-600 italic line-clamp-2">
                    {mem.description}
                  </div>
                </div>
                {/* Timeline prik */}
                <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 w-6 h-6 bg-white border-4 border-purple-300 rounded-full shadow-lg z-10" />
              </motion.div>
            ))}
          </div>
        </div>
      )}
      <style jsx global>{`
        .font-handwrite {
          font-family: 'Pacifico', 'Comic Sans MS', cursive, sans-serif;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default MemoryTimelinePolaroids;