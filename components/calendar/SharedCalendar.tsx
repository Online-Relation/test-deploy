'use client';
import { useEffect, useState } from "react";
import { BigCalendarView } from "./BigCalendarView";
import { MobileCalendarView } from "./MobileCalendarView";


// Dummy demo events — flyt til Supabase senere
const demoEvents = [
  {
    id: 1,
    title: "Din tur til date!",
    start: new Date("2024-07-08T18:00:00"),
    end: new Date("2024-07-08T21:00:00"),
    allDay: false,
  },
  {
    id: 2,
    title: "Book hotel",
    start: new Date("2024-07-10T20:00:00"),
    end: new Date("2024-07-10T22:00:00"),
    allDay: false,
  },
  {
    id: 3,
    title: "Sydengland",
    start: new Date("2024-07-15"),
    end: new Date("2024-07-20"),
    allDay: true,
  },
];

export interface CalendarEvent {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

export function SharedCalendar() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640); // Mobile breakpoint
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Her kan du hente dine events fra Supabase
  const [events, setEvents] = useState<CalendarEvent[]>(demoEvents);

  return (
    <div>
      {isMobile ? (
        <MobileCalendarView events={events} setEvents={setEvents} />
      ) : (
        <BigCalendarView events={events} setEvents={setEvents} />
      )}
    </div>
  );
}
