"use client";
import { Download } from "lucide-react";
import { formatSize, timeAgo } from "@/lib/utils";

export default function DiskCard({ material, onClick }) {
  return (
    <div
      className="bg-surface rounded-xl overflow-hidden border border-border card-tap cursor-pointer"
      onClick={() => onClick(material)}
    >
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
            <Download size={24} className="text-gray-600" />
          </div>
        )}
        <span className="absolute top-1.5 left-1.5 bg-diskBlue text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
          DIRECT
        </span>
        {material.size && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
            {formatSize(material.size)}
          </span>
        )}
      </div>
      <div className="p-2">
        <p className="text-[13px] text-white font-bold leading-tight line-clamp-1 mb-0.5">
          {material.title}
        </p>
        <span className="text-[10px] text-gray-500">{timeAgo(material.uploadedAt)}</span>
      </div>
    </div>
  );
}
