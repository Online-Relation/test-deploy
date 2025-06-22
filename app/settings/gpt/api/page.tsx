// /app/settings/gpt/api/page.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GptLog {
  id: string;
  user_id: string | null;
  widget: string;
  prompt: string;
  response: string;
  model: string;
  total_tokens: number;
  created_at: string;
}


export default function GptApiLogPage() {
  const [logs, setLogs] = useState<GptLog[]>([]);
  const [selected, setSelected] = useState<GptLog | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gpt_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) setLogs(data);
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">📤 GPT API kald</h1>

      {loading ? (
        <p>Indlæser...</p>
      ) : (
        logs.map((log) => (
          <Card
            key={log.id}
            className="p-4 cursor-pointer hover:bg-muted/50"
            onClick={() => setSelected(log)}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </p>
                <p className="font-semibold line-clamp-2">{log.prompt}</p>
              </div>
              <div className="text-sm text-right w-28 shrink-0">
    <p className="text-muted-foreground">
  {log.model} · {log.total_tokens} tokens
</p>


                <p className="text-muted-foreground">{log.widget}</p>
              </div>
            </div>
          </Card>
        ))
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>📋 GPT-kald detaljer</DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-4">
            <div>
              <p className="font-semibold text-muted-foreground">Prompt:</p>
              <pre className="whitespace-pre-wrap">{selected?.prompt}</pre>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Response:</p>
              <pre className="whitespace-pre-wrap text-green-200">{selected?.response}</pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
