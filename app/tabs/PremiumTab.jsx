"use client";
import { Lock, Play, CreditCard, Star } from "lucide-react";

export default function PremiumTab({ user, onLogin }) {
  const plans = [
    { id: "monthly", name: "Monthly", price: "₹39", period: "/mo", features: ["Daily uploads", "No ads", "Direct downloads"] },
    { id: "quarterly", name: "Quarterly", price: "₹99", period: "/3mo", features: ["All monthly features", "Early access", "Priority requests"] },
    { id: "yearly", name: "Yearly", price: "₹199", period: "/yr", features: ["All features", "Best value", "Lifetime support"] },
  ];

  return (
    <div className="tab-fade min-h-screen bg-gradient-to-b from-[#1A1200] to-[#0D0D0D]">
      <div className="p-4">
        {/* Login card */}
        {!user && (
          <div className="border border-border rounded-xl p-4 mb-6 text-center">
            <Lock size={28} className="mx-auto mb-2 text-gray-500" />
            <p className="text-white text-[13px] font-bold mb-1">LOGIN TO VIEW YOUR PLAN</p>
            <p className="text-gray-400 text-[11px] mb-3">Already a member? Login to check your status & expiry</p>
            <button
              onClick={onLogin}
              className="bg-tgblue text-white text-[12px] font-bold rounded-full px-5 py-2"
            >
              🔵 LOGIN
            </button>
          </div>
        )}

        {/* Exclusive */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-gray-400 text-[11px] uppercase font-bold">EXCLUSIVE ACCESS</span>
        </div>

        {/* Unlock heading */}
        <h2 className="text-white text-[28px] font-bold leading-tight mb-3">
          UNLOCK<br />
          <span className="text-accent">PREMIUM</span><br />
          CONTENT
        </h2>

        <p className="text-gray-400 text-[13px] mb-4 leading-relaxed">
          Daily exclusive uploads, early access, zero ads, and direct downloads.
          No limits. Instant activation after payment.
        </p>

        {/* Buttons */}
        <div className="flex gap-2 mb-6">
          <button className="flex items-center gap-1.5 border border-border text-white text-[12px] font-bold rounded-lg px-4 py-2.5">
            <Play size={14} /> WATCH DEMO
          </button>
          <button className="flex items-center gap-1.5 bg-gradient-to-r from-premium to-[#C05621] text-white text-[12px] font-bold rounded-lg px-4 py-2.5">
            <CreditCard size={14} /> BUY NOW — FROM ₹39
          </button>
        </div>

        {/* Plans */}
        <p className="text-white text-[13px] font-bold mb-2">CHOOSE YOUR PLAN</p>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4">
          {plans.map(plan => (
            <div
              key={plan.id}
              className="flex-shrink-0 w-44 bg-surface rounded-xl p-4 border border-border"
            >
              <div className="flex items-center gap-1 mb-2">
                <Star size={14} className="text-premium" />
                <span className="text-white text-[12px] font-bold">{plan.name}</span>
              </div>
              <div className="mb-3">
                <span className="text-white text-[24px] font-bold">{plan.price}</span>
                <span className="text-gray-400 text-[12px]">{plan.period}</span>
              </div>
              <ul className="space-y-1 mb 3">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-gray-400 text-[10px] flex items-start gap-1">
                    <span className="text-premium">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className="w-full bg-premium text-white text-[11px] font-bold rounded-lg py-2 mt-3">
                SELECT
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
