// components/hverdag/CheckinDatePicker.tsx

import React from "react";
import { DayPicker } from "react-day-picker";
import { da } from "react-day-picker/locale";
import "react-day-picker/dist/style.css";

interface CheckinDatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  registeredDates: Date[];
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const CheckinDatePicker: React.FC<CheckinDatePickerProps> = ({
  date,
  onSelect,
  registeredDates,
}) => {
  function matcher(day: Date) {
    return registeredDates.some((reg) => isSameDay(day, reg));
  }

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">Dato</label>
      <DayPicker
        mode="single"
        selected={date}
        onSelect={onSelect}
        modifiers={{
          registered: matcher,
        }}
        modifiersClassNames={{
          registered: "rdp-day_registered",
        }}
        showOutsideDays
        locale={da}
        weekStartsOn={1}
      />
    </div>
  );
};

export default CheckinDatePicker;
