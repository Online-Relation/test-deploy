// /components/GptStatus.tsx

"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function GptStatus() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      // Hent brugerrolle
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const userId = session?.user?.id
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

      if (profile?.role === "mads") {
        setIsAdmin(true)

        // Lav test-kald til GPT API-route
        const res = await fetch("/api/overall-recommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testMode: true }),
        })

        if (res.ok) {
          setStatus("ok")
        } else {
          setStatus("error")
        }
      }
    }

    checkStatus()
  }, [])

  if (!isAdmin) return null

  return (
    <div className="text-sm text-gray-600 mt-4">
      {status === "loading" && "Tjekker GPT-forbindelse..."}
      {status === "ok" && <span className="text-green-600">✅ GPT er forbundet og klar</span>}
      {status === "error" && <span className="text-red-600">❌ GPT-forbindelse fejlede – tjek API eller Supabase-data</span>}
    </div>
  )
}
