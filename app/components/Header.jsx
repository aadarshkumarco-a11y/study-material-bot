"use client";
import { Search, LogIn } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header({ onSearch, onlineCount, user, onLogin }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  return (
    <header className="sticky top-0 z-50 bg-bg border-b border-border">
      {/* Logo + Login + Online */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-[22px] font-bold tracking-tight">
          <span className="text-white">STUDY</span>
          <span className="text-accent">MATERIAL</span>
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface2 rounded-full px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-online animate-pulse" />
            <span className="text-[11px] text-gray-400 font-medium tabular-nums">
              {onlineCount?.toLocaleString() || "17,829"}
            </span>
            <span className="text-[10px] text-gray-500">online</span>
          </div>
          {user ? (
            <div className="flex items-center gap-1.5 bg-surface2 rounded-full px-2.5 py-1">
              {user.photo_url ? (
                <img src={user.photo_url} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold">
                  {(user.first_name || "U")[0]}
                </div>
              )}
              <span className="text-[11px] text-white font-medium max-w-[60px] truncate">
                {user.first_name || "User"}
              </span>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 bg-tgblue rounded-full px-3 py-1.5 text-white text-[11px] font-bold"
            >
              <LogIn size={13} />
              LOGIN
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos..."
            className="w-full bg-surface2 rounded-lg pl-9 pr-4 py-2 text-[13px] text-white placeholder-gray-500 outline-none border border-transparent focus:border-accent/30"
          />
        </div>
      </div>

      {/* Premium banner */}
      <div className="px-4 pb-3">
        <div className="relative bg-gradient-to-r from-accent to-accentDark rounded-lg overflow-hidden flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <div>
              <p className="text-white text-[12px] font-bold">Premium Telegram Access</p>
              <p className="text-white/70 text-[10px]">Unlock all content — No limits</p>
            </div>
          </div>
          <button className="bg-white text-accent text-[11px] font-bold rounded-md px-3 py-1.5">
            Join Now
          </button>
          <span className="absolute top-1 right-1 text-[8px] text-white/40">AD</span>
        </div>
      </div>
    </header>
  );
}
