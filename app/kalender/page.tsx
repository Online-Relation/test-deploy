'use client';
import { SharedCalendar } from "@/components/calendar/SharedCalendar";


export default function KalenderPage() {
  return (
    <div className="max-w-5xl mx-auto pt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Fælles kalender</h2>
      <SharedCalendar />
    </div>
  );
}
