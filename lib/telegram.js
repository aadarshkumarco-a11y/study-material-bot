// lib/telegram.js — Telegram Bot API helpers

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Get file path from Telegram using file_id
 */
export async function getFilePath(fileId) {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
  );
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "getFile failed");
  return data.result.file_path;
}

/**
 * Build the direct download URL for a Telegram file
 */
export function buildFileUrl(filePath) {
  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
}

/**
 * Get file URL from file_id (convenience: calls getFilePath then buildFileUrl)
 */
export async function getFileUrl(fileId) {
  const filePath = await getFilePath(fileId);
  return buildFileUrl(filePath);
}

/**
 * Send a message to a chat
 */
export async function sendMessage(chatId, text, keyboard) {
  const body = { chat_id: chatId, text, parse_mode: "HTML" };
  if (keyboard) body.reply_markup = keyboard;
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return res.json();
}

/**
 * Forward a request message to admin
 */
export async function forwardToAdmin(userId, userName, requestText) {
  const adminId = process.env.ADMIN_CHAT_ID;
  const text = `📝 <b>New Material Request</b>\n\n👤 User: ${userName} (${userId})\n💬 Request: ${requestText}`;
  return sendMessage(adminId, text);
}

export { BOT_TOKEN };
