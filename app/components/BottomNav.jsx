"use client";
import { Video, FileText, Download, Star, Calendar } from "lucide-react";

const TABS = [
  { id: "videos", label: "VIDEOS", icon: Video },
  { id: "posts", label: "POSTS", icon: FileText },
  { id: "disk", label: "DISK", icon: Download },
  { id: "premium", label: "PREMIUM", icon: Star },
  { id: "calendar", label: "CALENDAR", icon: Calendar },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1a1a1a] z-50">
      <div className="flex items-center">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-2 relative"
              style={{ borderTop: isActive ? "2px solid #E53E3E" : "2px solid transparent" }}
            >
              <Icon
                size={22}
                className={isActive ? "text-accent" : "text-gray-500"}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] uppercase font-bold mt-0.5 ${
                  isActive ? "text-accent" : "text-gray-500"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
