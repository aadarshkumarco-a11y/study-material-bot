"use client";

export default function CreditFooter() {
  const handleClick = () => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink("https://t.me/aadi4uuu");
    } else {
      window.open("https://t.me/aadi4uuu", "_blank");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="w-full py-4 text-center border-t border-[#1a1a1a] bg-[#0a0a0a] cursor-pointer mt-4"
      style={{ marginBottom: "64px" }}
    >
      <span className="text-[13px] text-gray-500 hover:text-gray-300 transition-colors">
        🦇 @aadi4uuu
      </span>
    </div>
  );
}
