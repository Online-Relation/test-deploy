// /app/dates/page.tsx
"use client";
import DateIdeasBoard from "@/components/dates/DateIdeasBoard";

export default function DatesPage() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Date Ideas Board</h1>
      <DateIdeasBoard />
    </div>
  );
}
