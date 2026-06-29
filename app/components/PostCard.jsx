"use client";
import { timeAgo } from "@/lib/utils";

export default function PostCard({ material, onClick }) {
  return (
    <div
      className="bg-surface rounded-xl overflow-hidden border border-border card-tap cursor-pointer"
      onClick={() => onClick(material)}
    >
      {/* Square thumbnail */}
      <div className="relative aspect-square bg-surface2">
        {material.thumbnail_file_id ? (
          <img
            src={`/api/stream?file_id=${material.thumbnail_file_id}`}
            alt={material.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : null}
        <span className="absolute top-1.5 left-1.5 bg-accent text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
          NEW
        </span>
      </div>
      {/* Info */}
      <div className="p-2">
        <p className="text-[12px] text-white font-bold leading-tight line-clamp-2 mb-0.5">
          {material.title}
        </p>
        <span className="text-[10px] text-gray-500">{timeAgo(material.uploadedAt)}</span>
      </div>
    </div>
  );
}
