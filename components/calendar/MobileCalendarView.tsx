'use client';
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { CalendarEvent } from "./SharedCalendar";

interface Props {
  events: CalendarEvent[];
  setEvents: (e: CalendarEvent[]) => void;
}

export function MobileCalendarView({ events, setEvents }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Find events for valgt dato (dato uden klokkeslæt)
  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }
  const todaysEvents = events.filter(e => isSameDay(e.start, selectedDate));

  function handleDayClick(date: Date) {
    setSelectedDate(date);
    const title = prompt("Titel på event:");
    if (!title) return;
    setEvents([
      ...events,
      {
        id: Math.random().toString(36).substring(2, 10),
        title,
        start: date,
        end: date,
        allDay: true,
      },
    ]);
  }

  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-lg p-3">
      <Calendar
        value={selectedDate}
        onClickDay={handleDayClick}
        tileContent={({ date }) =>
          events.some(e => isSameDay(e.start, date)) ? (
            <span className="block w-1.5 h-1.5 bg-indigo-500 rounded-full mx-auto mt-0.5" />
          ) : null
        }
        className="mb-4"
        locale="da-DK"
      />
      <div className="mt-3">
        <div className="text-center font-semibold mb-2 text-lg">
          {selectedDate.toLocaleDateString("da-DK", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </div>
        {todaysEvents.length === 0 ? (
          <div className="text-gray-400 text-center py-8">Ingen begivenheder</div>
        ) : (
          <ul className="divide-y">
            {todaysEvents.map(e => (
              <li key={e.id} className="py-2 flex justify-between">
                <span>{e.title}</span>
                {/* Tilføj evt. tidspunkt hvis relevant */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
