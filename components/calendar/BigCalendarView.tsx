'use client';
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { da } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarEvent } from "./SharedCalendar";
import { useRef } from "react";

const locales = { da };
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay, locales,
});

interface Props {
  events: CalendarEvent[];
  setEvents: (e: CalendarEvent[]) => void;
}

export function BigCalendarView({ events, setEvents }: Props) {
  const modalRef = useRef<HTMLDialogElement>(null);

  // For demo: klik på dato for at tilføje event (enkeltklik)
  function handleSelectSlot(slotInfo: any) {
    const title = prompt("Titel på event:");
    if (!title) return;
    setEvents([
      ...events,
      {
        id: Math.random().toString(36).substring(2, 10),
        title,
        start: slotInfo.start,
        end: slotInfo.end,
        allDay: slotInfo.action === "select" && slotInfo.end.getHours() === 0,
      },
    ]);
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        selectable
        onSelectSlot={handleSelectSlot}
        messages={{
          next: "Næste",
          previous: "Forrige",
          today: "I dag",
          month: "Måned",
          week: "Uge",
          day: "Dag",
          showMore: (total: number) => `+ ${total} mere`,
        }}
        eventPropGetter={(_event: CalendarEvent) => ({
          style: {
            background: "#6366f1",
            borderRadius: 6,
            color: "#fff",
            border: "none",
            paddingLeft: 6,
            fontWeight: 500,
          },
        })}
        popup
      />
    </div>
  );
}
