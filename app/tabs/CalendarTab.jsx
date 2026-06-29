"use client";
import { useState, useEffect } from "react";
import CreditFooter from "@/app/components/CreditFooter";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["S","M","T","W","T","F","S"];

export default function CalendarTab() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetch("/api/materials?limit=100")
      .then(r => r.json())
      .then(data => {
        setMaterials(data.materials || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build set of dates with uploads
  const uploadDates = new Set();
  materials.forEach(m => {
    if (m.uploadedAt) {
      const d = new Date(m.uploadedAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        uploadDates.add(d.getDate());
      }
    }
  });

  const selectedMaterials = selectedDate
    ? materials.filter(m => {
        if (!m.uploadedAt) return false;
        const d = new Date(m.uploadedAt);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDate;
      })
    : [];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="p-4 tab-fade">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-gray-400 p-1">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-white text-[15px] font-bold">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={nextMonth} className="text-gray-400 p-1">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-gray-500 font-bold py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const hasUpload = uploadDates.has(day);
          const isSelected = selectedDate === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : day)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[12px] ${
                isSelected
                  ? "bg-accent text-white"
                  : hasUpload
                  ? "bg-surface text-white border border-accent/30"
                  : "bg-surface2 text-gray-500"
              }`}
            >
              {day}
              {hasUpload && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-accent mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date materials */}
      {selectedDate && (
        <div className="fade-in">
          <p className="text-white text-[13px] font-bold mb-2">
            {MONTHS[month]} {selectedDate}, {year} — {selectedMaterials.length} uploads
          </p>
          {selectedMaterials.length === 0 ? (
            <p className="text-gray-500 text-[12px]">No uploads on this date.</p>
          ) : (
            <div className="space-y-2">
              {selectedMaterials.map(m => (
                <div key={m.id} className="bg-surface rounded-lg p-2 flex items-center gap-2">
                  <div className="w-10 h-10 bg-surface2 rounded flex items-center justify-center">
                    <span className="text-[9px] text-accent font-bold uppercase">{m.type?.slice(0,4)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[12px] font-bold truncate">{m.title}</p>
                    <p className="text-gray-500 text-[10px]">{m.subject || "General"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <CreditFooter />
    </div>
  );
}
