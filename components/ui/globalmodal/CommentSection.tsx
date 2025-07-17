// /components/ui/globalmodal/CommentSection.tsx
"use client";

import { useEffect, useState } from "react";
import { Comment, fetchComments, addComment } from "@/lib/comments";
import { useUserContext } from "@/context/UserContext";

type Props = {
  modalId: string;
};

export default function CommentSection({ modalId }: Props) {
  const { user } = useUserContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments(modalId).then(setComments).catch(console.error);
  }, [modalId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setLoading(true);
    try {
      const comment = await addComment(modalId, text, user.id);
      setComments((prev) => [comment, ...prev]);
      setText("");
    } catch (err: any) {
      alert(
        err?.message ||
          (typeof err === "object" ? JSON.stringify(err) : String(err))
      );
      console.error("Kommentar-fejl:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border rounded-lg px-3 py-2 flex-1"
          placeholder="Skriv en kommentar…"
          disabled={loading || !user}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !text.trim() || !user}
        >
          Send
        </button>
      </form>
      <div className="mt-4 flex flex-col gap-3">
        {comments.map((c) => (
          <div
            key={c.id}
            className="bg-gray-50 rounded-lg px-3 py-2 shadow-sm"
          >
            <div className="font-semibold text-sm">{c.author}</div>
            <div className="text-gray-800 text-sm">{c.text}</div>
            <div className="text-xs text-gray-400">
              {new Date(c.created_at).toLocaleString("da-DK")}
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-gray-400 text-sm">
            Ingen kommentarer endnu…
          </div>
        )}
      </div>
    </div>
  );
}
