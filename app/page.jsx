"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "@/app/components/Header";
import BottomNav from "@/app/components/BottomNav";
import FloatingButton from "@/app/components/FloatingButton";
import VideoPlayer from "@/app/components/VideoPlayer";
import VideosTab from "@/app/tabs/VideosTab";
import PostsTab from "@/app/tabs/PostsTab";
import DiskTab from "@/app/tabs/DiskTab";
import PremiumTab from "@/app/tabs/PremiumTab";
import CalendarTab from "@/app/tabs/CalendarTab";
import { getOnlineCount } from "@/lib/utils";

export default function Home() {
  const [activeTab, setActiveTab] = useState("videos");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineCount, setOnlineCount] = useState(17829);
  const [user, setUser] = useState(null);
  const [playingMaterial, setPlayingMaterial] = useState(null);

  // Init Telegram WebApp
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#000000");
      tg.setBackgroundColor("#000000");

      // Try to get user from initData
      const initData = tg.initData;
      if (initData) {
        fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.ok) {
              setUser(data.user);
              localStorage.setItem("tg_user", JSON.stringify(data.user));
            }
          })
          .catch(() => {});
      } else {
        // Try cached user
        const cached = localStorage.getItem("tg_user");
        if (cached) setUser(JSON.parse(cached));
      }
    } else {
      const cached = localStorage.getItem("tg_user");
      if (cached) setUser(JSON.parse(cached));
    }
  }, []);

  // Online counter — update every 30s
  useEffect(() => {
    setOnlineCount(getOnlineCount());
    const interval = setInterval(() => {
      setOnlineCount(getOnlineCount());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch stats
  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => {
        if (data.onlineUsers) setOnlineCount(data.onlineUsers);
      })
      .catch(() => {});
  }, []);

  const handleLogin = useCallback(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const initData = tg.initData;
      if (initData) {
        fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.ok) {
              setUser(data.user);
              localStorage.setItem("tg_user", JSON.stringify(data.user));
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const handleSearch = useCallback((q) => setSearchQuery(q), []);

  const handleVideoClick = useCallback((material) => {
    setPlayingMaterial(material);
    // Increment views
    fetch(`/api/materials`, { method: "PATCH", body: JSON.stringify({ id: material.id, action: "view" }) }).catch(() => {});
  }, []);

  const handleRequestVideo = useCallback(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || "your_study_bot";
      window.Telegram.WebApp.openTelegramLink(`https://t.me/${botUsername}?start=request`);
    }
  }, []);

  const handleDownload = useCallback(async (material) => {
    try {
      const res = await fetch(`/api/file?file_id=${material.file_id}`);
      const data = await res.json();
      if (data.url && typeof window !== "undefined") {
        window.open(data.url, "_blank");
      }
    } catch {
      // Fallback: open stream URL directly
      window.open(`/api/stream?file_id=${material.file_id}`, "_blank");
    }
  }, []);

  return (
    <div className="min-h-screen bg-bg pb-16">
      <Header
        onSearch={handleSearch}
        onlineCount={onlineCount}
        user={user}
        onLogin={handleLogin}
      />

      <main>
        {activeTab === "videos" && (
          <VideosTab searchQuery={searchQuery} onVideoClick={handleVideoClick} />
        )}
        {activeTab === "posts" && (
          <PostsTab searchQuery={searchQuery} onPostClick={handleVideoClick} />
        )}
        {activeTab === "disk" && (
          <DiskTab onDiskClick={handleDownload} />
        )}
        {activeTab === "premium" && (
          <PremiumTab user={user} onLogin={handleLogin} />
        )}
        {activeTab === "calendar" && (
          <CalendarTab />
        )}
      </main>

      <FloatingButton onClick={handleRequestVideo} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Video player overlay */}
      {playingMaterial && (
        <VideoPlayer
          material={playingMaterial}
          onClose={() => setPlayingMaterial(null)}
        />
      )}
    </div>
  );
}
