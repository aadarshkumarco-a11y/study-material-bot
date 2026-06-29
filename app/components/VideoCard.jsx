"use client";
import { Play, Lock, Plus, Eye } from "lucide-react";
import { formatDuration, formatViews, timeAgo } from "@/lib/utils";

export default function VideoCard({ material, onClick }) {
  return (
    <div
      className="bg-surface rounded-xl overflow-hidden border border-border card-tap cursor-pointer"
      onClick={() => onClick(material)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface2">
        {material.thumbnail_file_id ? (
          <img
            src={`/api/stream?file_id=${material.thumbnail_file_id}`}
            alt={material.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play size={28} className="text-gray-600" />
          </div>
        )}

        {/* VIDEO badge */}
        <span className="absolute top-1.5 left-1.5 bg-accent text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
          {material.type === "video" ? "VIDEO" : "DOC"}
        </span>

        {/* Members only overlay */}
        {material.isPremium && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-center gap-1 bg-[#D69E2E] text-black text-[9px] font-bold uppercase px-2 py-1 rounded">
              <Lock size={10} /> MEMBERS ONLY
            </div>
          </div>
        )}

        {/* Duration */}
        {material.duration && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
            {formatDuration(material.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-[13px] text-white font-bold leading-tight line-clamp-2 mb-1">
          {material.title}
        </p>
        {material.isPremium && (
          <div className="inline-flex items-center gap-1 bg-[#D69E2E]/20 text-[#D69E2E] text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mb-1">
            👑 PREMIUM ONLY
          </div>
        )}
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-0.5 text-accent">
            <Eye size={10} /> {formatViews(material.views)}
          </span>
          <span>{timeAgo(material.uploadedAt)}</span>
        </div>
      </div>
    </div>
  );
}
