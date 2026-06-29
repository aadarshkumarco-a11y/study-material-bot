"use client";
import { Plus } from "lucide-react";

export default function FloatingButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 flex items-center gap-1.5 bg-accent text-white text-[11px] font-bold rounded-full px-4 py-2.5 shadow-lg shadow-accent/30 card-tap"
    >
      <Plus size={16} /> REQUEST VIDEO
    </button>
  );
}
