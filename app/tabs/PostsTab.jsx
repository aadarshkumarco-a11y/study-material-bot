"use client";
import { useState, useEffect } from "react";
import PostCard from "@/app/components/PostCard";

const FILTERS = [
  { id: "all", label: "ALL" },
  { id: "new", label: "NEW" },
  { id: "trending", label: "TRENDING" },
  { id: "premium", label: "PREMIUM" },
];

export default function PostsTab({ searchQuery, onPostClick }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (activeFilter === "new") params.set("sort", "new");
      if (activeFilter === "trending") params.set("sort", "trending");
      if (activeFilter === "premium") params.set("premium", "true");
      const res = await fetch(`/api/materials?${params}`);
      const data = await res.json();
      let filtered = data.materials || [];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(m => m.title?.toLowerCase().includes(q));
      }
      setMaterials(filtered);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeFilter, searchQuery]);

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = materials.filter(m => m.uploadedAt?.slice(0, 10) === today).length;
  const uniqueDays = new Set(materials.map(m => m.uploadedAt?.slice(0, 10))).size;

  if (loading) {
    return <div className="p-3"><div className="h-32 skeleton rounded-xl" /></div>;
  }

  return (
    <div className="p-3 tab-fade">
      {/* Filter pills */}
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${
              activeFilter === f.id
                ? "bg-accent text-white"
                : "bg-surface2 text-gray-400"
            }`}
          >
            {f.label} {f.id === "all" ? `[${materials.length}]` : ""}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 mb-4 bg-surface rounded-xl p-3">
        <div className="text-center">
          <p className="text-[20px] font-bold text-accent tabular-nums">{materials.length}</p>
          <p className="text-[9px] text-gray-500 uppercase">POSTS</p>
        </div>
        <div className="text-center">
          <p className="text-[20px] font-bold text-premium tabular-nums">{todayCount}</p>
          <p className="text-[9px] text-gray-500 uppercase">TODAY</p>
        </div>
        <div className="text-center">
          <p className="text-[20px] font-bold text-diskBlue tabular-nums">{uniqueDays}</p>
          <p className="text-[9px] text-gray-500 uppercase">DAYS</p>
        </div>
      </div>

      <p className="text-white text-[13px] font-bold mb-2">LATEST POSTS</p>

      {materials.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">No posts available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {materials.map(m => (
            <PostCard key={m.id} material={m} onClick={onPostClick} />
          ))}
        </div>
      )}
    </div>
  );
}
