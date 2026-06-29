"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import CreditFooter from "@/app/components/CreditFooter";
import { RefreshCw } from "lucide-react";
import VideoCard from "@/app/components/VideoCard";

export default function VideosTab({ searchQuery, onVideoClick }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/materials?type=video&limit=50&t=${Date.now()}`);
      const data = await res.json();
      let filtered = data.materials || [];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (m) => m.title?.toLowerCase().includes(q) || m.subject?.toLowerCase().includes(q)
        );
      }
      setMaterials(filtered);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  // Fetch on mount + when search changes
  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Auto-poll every 5 seconds (so new uploads appear without manual refresh)
  useEffect(() => {
    pollRef.current = setInterval(() => {
      load();
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  // Re-fetch when app comes to foreground
  useEffect(() => {
    const onFocus = () => load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-[14px] font-bold">VIDEO LIBRARY [...]</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl overflow-hidden">
              <div className="aspect-video skeleton" />
              <div className="p-2 space-y-1.5">
                <div className="h-3 w-3/4 skeleton rounded" />
                <div className="h-2.5 w-1/2 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 tab-fade">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white text-[14px] font-bold">
          VIDEO LIBRARY [{materials.length}]
        </span>
        <button onClick={refresh} className="text-gray-400 card-tap">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">No videos available yet.</p>
          <p className="text-gray-600 text-xs mt-1">Admin can upload via Telegram bot.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {materials.map((m) => (
            <VideoCard key={m.id} material={m} onClick={onVideoClick} />
          ))}
        </div>
      )}
      <CreditFooter />
    </div>
  );
}
