// lib/auth.js — Telegram initData validation
import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Validate Telegram Mini App initData using HMAC-SHA256
 * Returns the parsed user object if valid, null otherwise.
 */
export function validateInitData(initData) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    urlParams.delete("hash");

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(BOT_TOKEN)
      .digest();

    const expectedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (hash !== expectedHash) return null;

    // Extract user data
    const userParam = urlParams.get("user");
    if (userParam) {
      return JSON.parse(userParam);
    }
    return null;
  } catch (e) {
    console.error("[auth] validation error:", e.message);
    return null;
  }
}
