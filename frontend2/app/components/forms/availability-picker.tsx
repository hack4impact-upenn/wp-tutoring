"use client"

import { DAYS, TIME_SLOTS } from "@/lib/constants"
import type { AvailabilitySlot } from "@/lib/types"

interface AvailabilityPickerProps {
  value: AvailabilitySlot[]
  onChange: (slots: AvailabilitySlot[]) => void
}

export function AvailabilityPicker({
  value,
  onChange,
}: AvailabilityPickerProps) {
  const isSelected = (day: string, time: string) =>
    value.some((s) => s.day === day && s.time === time)

  const toggle = (day: string, time: string) => {
    if (isSelected(day, time)) {
      onChange(value.filter((s) => !(s.day === day && s.time === time)))
    } else {
      onChange([
        ...value,
        { day, time } as AvailabilitySlot,
      ])
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Header row */}
        <div className="mb-1 grid grid-cols-8 gap-1">
          <div className="p-2 text-xs font-medium text-muted-foreground" />
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-semibold text-foreground"
            >
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Time rows */}
        <div className="flex flex-col gap-1">
          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-1">
              <div className="flex items-center p-1 text-xs text-muted-foreground">
                {time}
              </div>
              {DAYS.map((day) => {
                const selected = isSelected(day, time)
                return (
                  <button
                    key={`${day}-${time}`}
                    type="button"
                    onClick={() => toggle(day, time)}
                    className={`rounded-md border p-2 text-xs transition-colors ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                    aria-label={`${day} at ${time}${selected ? " - selected" : ""}`}
                    aria-pressed={selected}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Click cells to toggle your available time slots. Selected:{" "}
        <span className="font-medium text-foreground">{value.length}</span>{" "}
        slot(s).
      </p>
    </div>
  )
}
