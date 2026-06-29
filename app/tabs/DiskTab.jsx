"use client";
import { useState, useEffect } from "react";
import CreditFooter from "@/app/components/CreditFooter";
import { RefreshCw, Search } from "lucide-react";
import DiskCard from "@/app/components/DiskCard";

export default function DiskTab({ onDiskClick }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/materials?type=document&limit=50`);
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = query
    ? materials.filter(m => m.title?.toLowerCase().includes(query.toLowerCase()))
    : materials;

  return (
    <div className="p-3 tab-fade">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white text-[14px] font-bold">DISK LINKS</span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search disk links..."
          className="w-full bg-surface2 rounded-lg pl-9 pr-4 py-2 text-[13px] text-white placeholder-gray-500 outline-none"
        />
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-diskBlue/20 to-transparent rounded-lg p-3 mb-3 flex items-center justify-between border border-diskBlue/20">
        <div className="flex items-center gap-2">
          <span className="text-lg">💾</span>
          <div>
            <p className="text-white text-[12px] font-bold">Google Drive / Mega Downloads</p>
            <p className="text-gray-400 text-[10px]">High-speed direct links — all files</p>
          </div>
        </div>
        <button className="bg-diskBlue text-white text-[11px] font-bold rounded-md px-3 py-1.5">
          Join TG
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-white text-[13px] font-bold">DISK LIBRARY [{filtered.length}]</span>
        <button onClick={load} className="text-gray-400 card-tap">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl overflow-hidden">
              <div className="aspect-video skeleton" />
              <div className="p-2 space-y-1"><div className="h-3 w-2/3 skeleton rounded" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">No disk links available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(m => (
            <DiskCard key={m.id} material={m} onClick={onDiskClick} />
          ))}
        </div>
      )}
      <CreditFooter />
    </div>
  );
}
