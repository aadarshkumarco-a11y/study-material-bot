"use client";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, MoreVertical, Play, Pause } from "lucide-react";

export default function VideoPlayer({ material, onClose }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const streamUrl = `/api/stream?file_id=${material.file_id}`;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.src = streamUrl;
    v.load();

    const onCanPlay = () => { setLoading(false); };
    const onError = () => { setError("Unable to play this video."); setLoading(false); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onError);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    // Save position
    const savedPos = localStorage.getItem(`pos-${material.id}`);
    if (savedPos) v.currentTime = parseFloat(savedPos);

    return () => {
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("error", onError);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      // Save position on unmount
      if (v.currentTime > 0) {
        localStorage.setItem(`pos-${material.id}`, String(v.currentTime));
      }
    };
  }, [streamUrl, material.id]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3">
        <button onClick={onClose} className="flex items-center gap-1 text-white text-sm">
          <ArrowLeft size={20} /> Back
        </button>
        <button className="text-gray-400">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center relative">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-gray-600 border-t-accent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="text-center px-8">
            <p className="text-accent text-sm mb-2">{error}</p>
            <a
              href={streamUrl}
              download
              className="text-tgblue text-xs underline"
            >
              Tap to download instead
            </a>
          </div>
        )}
        <video
          ref={videoRef}
          className="max-w-full max-h-full"
          controls
          playsInline
          onClick={togglePlay}
        />
      </div>

      {/* Info */}
      <div className="p-4 bg-[#0a0a0a]">
        <h2 className="text-white text-base font-bold mb-1">{material.title}</h2>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          {material.subject && <span>Subject: {material.subject}</span>}
          {material.duration && <span>Duration: {Math.floor(material.duration / 60)}m</span>}
          <span>Views: {material.views || 0}</span>
        </div>
      </div>
    </div>
  );
}
