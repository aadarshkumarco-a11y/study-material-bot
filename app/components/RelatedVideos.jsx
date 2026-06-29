"use client";
import { Play } from "lucide-react";
import { formatDuration, formatViews, timeAgo } from "@/lib/utils";

export default function RelatedVideos({ currentId, subject, allVideos, onSelect }) {
  if (!allVideos || allVideos.length === 0) return null;

  // Same subject first, then fill with others. Never show current video. Max 6.
  const related = allVideos
    .filter((v) => v.id !== currentId)
    .sort((a, b) => {
      if (a.subject === subject && b.subject !== subject) return -1;
      if (b.subject === subject && a.subject !== subject) return 1;
      return 0;
    })
    .slice(0, 6);

  if (related.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 px-4 mb-3">
        <div className="flex-1 h-px bg-[#1a1a1a]" />
        <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">More Videos</span>
        <div className="flex-1 h-px bg-[#1a1a1a]" />
      </div>
      <div className="flex flex-col gap-px bg-[#1a1a1a]">
        {related.map((video) => (
          <div
            key={video.id}
            onClick={() => onSelect(video)}
            className="flex gap-3 bg-black p-3 cursor-pointer active:bg-[#111] card-tap"
          >
            {/* Thumbnail */}
            <div className="relative flex-shrink-0 w-28 h-16 bg-[#1a1a1a] rounded-lg overflow-hidden">
              {video.thumbnail_file_id ? (
                <img
                  src={`/api/stream?file_id=${video.thumbnail_file_id}`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <Play size={18} />
                </div>
              )}
              {video.isPremium && (
                <span className="absolute top-1 left-1 bg-[#D69E2E] text-black text-[9px] font-bold px-1 py-0.5 rounded">★ VIP</span>
              )}
              {video.duration && (
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 py-0.5">
              <p className="text-white text-[13px] font-semibold leading-tight line-clamp-2">{video.title}</p>
              <div className="flex items-center gap-2 mt-1 text-gray-500 text-[10px]">
                <span>{timeAgo(video.uploadedAt)}</span>
                <span>👁 {formatViews(video.views)}</span>
                {video.isPremium && (
                  <span className="text-[#D69E2E] font-bold">👑 VIP</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
