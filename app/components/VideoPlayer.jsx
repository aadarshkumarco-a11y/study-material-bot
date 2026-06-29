"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, Settings, Download, Send, ThumbsUp, ThumbsDown, Eye, Clock } from "lucide-react";
import { formatDuration, formatViews, timeAgo } from "@/lib/utils";
import RelatedVideos from "@/app/components/RelatedVideos";

export default function VideoPlayer({ material, allMaterials, onClose, onVideoClick }) {
  const [currentVideo, setCurrentVideo] = useState(material);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showControls, setShowControls] = useState(true);
  const [resumePos, setResumePos] = useState(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(currentVideo.likes || Math.floor((currentVideo.views || 0) * 0.06));
  const [dislikeCount, setDislikeCount] = useState(currentVideo.dislikes || Math.floor((currentVideo.views || 0) * 0.005));
  const controlsTimeout = useRef(null);
  const posSaveInterval = useRef(null);

  // STABLE stream URL — only changes when file_id changes (NOT on every render!)
  const streamUrl = useMemo(() => `/api/stream?file_id=${currentVideo.file_id}`, [currentVideo.file_id]);
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "semxybhabhi_bot";

  // Related videos (same subject or random)
  const related = (allMaterials || [])
    .filter((m) => m.id !== currentVideo.id && (m.subject === currentVideo.subject || m.type === "video"))
    .slice(0, 8);
  const fallbackRelated = (allMaterials || []).filter((m) => m.id !== currentVideo.id).slice(0, 8);
  const moreVideos = related.length > 0 ? related : fallbackRelated;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Check resume position
    const saved = localStorage.getItem(`resume_${currentVideo.file_id}`);
    if (saved && parseFloat(saved) > 5) {
      setResumePos(parseFloat(saved));
    }

    // Load like/dislike state
    const likeState = localStorage.getItem(`liked_${currentVideo.id}`);
    if (likeState === "1") setLiked(true);
    if (likeState === "-1") setDisliked(true);

    const onLoaded = () => {
      setDuration(v.duration || 0);
      setLoading(false);
      if (resumePos && v) {
        v.currentTime = resumePos;
      }
    };
    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => { setError("Unable to play this video."); setLoading(false); };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("error", onError);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);

    // Save position every 5 seconds
    posSaveInterval.current = setInterval(() => {
      if (v && !v.paused && v.currentTime > 0) {
        localStorage.setItem(`resume_${currentVideo.file_id}`, String(v.currentTime));
      }
    }, 5000);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("error", onError);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      clearInterval(posSaveInterval.current);
      if (v.currentTime > 0) {
        localStorage.setItem(`resume_${currentVideo.file_id}`, String(v.currentTime));
      }
    };
  }, [currentVideo.file_id, currentVideo.id, resumePos]);

  // Controls auto-hide
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
    resetControlsTimer();
  };

  const seek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * duration;
    setCurrentTime(v.currentTime);
  };

  const skip = (secs) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + secs));
  };

  const changeVolume = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = parseFloat(e.target.value);
    v.volume = vol;
    setVolume(vol);
  };

  const resumeWatch = () => {
    const v = videoRef.current;
    if (v && resumePos) {
      v.currentTime = resumePos;
      v.play();
      setResumePos(null);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/file?file_id=${currentVideo.file_id}`);
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } catch {
      window.open(streamUrl, "_blank");
    }
  };

  const handleTelegram = () => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/${botUsername}`);
    } else {
      window.open(`https://t.me/${botUsername}`, "_blank");
    }
  };

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      localStorage.removeItem(`liked_${currentVideo.id}`);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      if (disliked) { setDisliked(false); setDislikeCount((c) => c - 1); }
      localStorage.setItem(`liked_${currentVideo.id}`, "1");
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
      setDislikeCount((c) => c - 1);
      localStorage.removeItem(`liked_${currentVideo.id}`);
    } else {
      setDisliked(true);
      setDislikeCount((c) => c + 1);
      if (liked) { setLiked(false); setLikeCount((c) => c - 1); }
      localStorage.setItem(`liked_${currentVideo.id}`, "-1");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-y-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 sticky top-0 bg-black z-10">
        <button onClick={onClose} className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] rounded-full px-3 py-1.5 text-white text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <span className="bg-[#333] text-white text-xs font-bold px-2 py-1 rounded">HD</span>
      </div>

      {/* Video */}
      <div className="relative bg-black flex items-center justify-center" onClick={resetControlsTimer}>
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-[3px] border-gray-600 border-t-accent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div className="text-center px-8 py-12">
            <p className="text-accent text-sm mb-3">{error}</p>
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold"
              >
                Retry
              </button>
              <button onClick={handleDownload} className="text-tgblue text-xs underline">Download instead</button>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          src={streamUrl}
          className="max-w-full max-h-[40vh]"
          playsInline
          preload="auto"
          onClick={togglePlay}
        />
        {/* Center play button */}
        {!playing && !loading && !error && (
          <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur">
              <Play size={28} className="text-white ml-1" fill="white" />
            </div>
          </button>
        )}
      </div>

      {/* Controls bar */}
      <div className="bg-[#111] px-3 py-2 flex items-center gap-2" onClick={resetControlsTimer}>
        <button onClick={() => skip(-10)} className="text-white"><SkipBack size={18} /></button>
        <button onClick={togglePlay} className="text-white">
          {playing ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
        </button>
        <button onClick={() => skip(10)} className="text-white"><SkipForward size={18} /></button>
        <span className="text-gray-400 text-[11px] tabular-nums w-10">{formatDuration(Math.floor(currentTime))}</span>
        <div className="flex-1 h-1.5 bg-gray-700 rounded-full cursor-pointer relative" onClick={seek}>
          <div className="h-full bg-accent rounded-full" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full" style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
        </div>
        <Volume2 size={16} className="text-gray-400" />
        <input type="range" min="0" max="1" step="0.05" value={volume} onChange={changeVolume} className="w-12 h-1 accent-accent" />
        <Settings size={16} className="text-gray-400" />
      </div>

      {/* Resume banner */}
      {resumePos && (
        <div className="mx-3 my-2 bg-[#2D1F00] border border-[#4A3000] rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-orange-500" />
            <div>
              <p className="text-orange-500 text-[13px] font-bold">Resume watching</p>
              <p className="text-gray-400 text-[11px]">Left off at {formatDuration(Math.floor(resumePos))}</p>
            </div>
          </div>
          <button onClick={resumeWatch} className="border border-orange-500 text-orange-500 text-[11px] font-bold rounded-full px-3 py-1">Resume</button>
        </div>
      )}

      {/* Title + meta */}
      <div className="px-4 pt-2">
        <h2 className="text-white text-lg font-bold mb-1">{currentVideo.title}</h2>
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <span>📅 {timeAgo(currentVideo.uploadedAt)}</span>
          {currentVideo.duration && <span>⏱ {formatDuration(currentVideo.duration)}</span>}
          <span>👁 {formatViews(currentVideo.views)} views</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-4 py-3">
        <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-1.5 bg-[#1a1a1a] border border-[#333] text-white text-sm rounded-lg py-2.5">
          <Download size={16} /> Download
        </button>
        <button onClick={handleTelegram} className="flex-1 flex items-center justify-center gap-1.5 bg-[#1a1a1a] border border-[#333] text-white text-sm rounded-lg py-2.5">
          <Send size={16} className="text-tgblue" /> Telegram
        </button>
      </div>

      {/* Engagement row */}
      <div className="flex items-center gap-3 px-4 py-2 text-xs">
        <button onClick={handleLike} className={`flex items-center gap-1 ${liked ? "text-accent" : "text-white"}`}>
          <ThumbsUp size={14} fill={liked ? "currentColor" : "none"} /> {formatViews(likeCount)}
        </button>
        <button onClick={handleDislike} className={`flex items-center gap-1 ${disliked ? "text-accent" : "text-white"}`}>
          <ThumbsDown size={14} fill={disliked ? "currentColor" : "none"} /> {formatViews(dislikeCount)}
        </button>
        <span className="text-gray-600">|</span>
        <span className="flex items-center gap-1 text-white"><Eye size={12} /> {formatViews(currentVideo.views)}</span>
        <span className="flex items-center gap-1 text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-online" /> CDN1 · HD</span>
      </div>

      {/* MORE VIDEOS — RelatedVideos component with tap-to-swap */}
      <RelatedVideos
        currentId={currentVideo.id}
        subject={currentVideo.subject}
        allVideos={allMaterials}
        onSelect={(v) => {
          setCurrentVideo(v);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Credit footer */}
      <div
        onClick={() => {
          if (window.Telegram?.WebApp) window.Telegram.WebApp.openTelegramLink("https://t.me/aadi4uuu");
          else window.open("https://t.me/aadi4uuu", "_blank");
        }}
        className="w-full py-4 text-center border-t border-[#1a1a1a] bg-[#0a0a0a] cursor-pointer mt-4"
      >
        <span className="text-[13px] text-gray-500 hover:text-gray-300 transition-colors">🦇 @aadi4uuu</span>
      </div>
    </div>
  );
}
