// app/api/stream/route.js — Proxy Telegram file stream with Range support
// BUG 2 FIX: Always get fresh file path (Telegram URLs expire), proper Range forwarding
import { getFilePath, buildFileUrl } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("file_id");

  if (!fileId) {
    return new Response("Missing file_id", { status: 400 });
  }

  try {
    // Step 1: ALWAYS get FRESH file path (Telegram URLs expire!)
    const getFileRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const getFileData = await getFileRes.json();

    if (!getFileData.ok) {
      console.error("[stream] getFile failed:", getFileData.description);
      return new Response("File not found on Telegram", { status: 404 });
    }

    const filePath = getFileData.result.file_path;
    const telegramUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;

    // Step 2: Forward Range header for video seeking
    const rangeHeader = request.headers.get("range");
    const fetchHeaders = {};
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    // Step 3: Fetch from Telegram
    const telegramRes = await fetch(telegramUrl, { headers: fetchHeaders });

    if (!telegramRes.ok && telegramRes.status !== 206) {
      console.error("[stream] Telegram fetch failed:", telegramRes.status);
      return new Response("Failed to fetch from Telegram", { status: 502 });
    }

    // Step 4: Build response headers
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", telegramRes.headers.get("Content-Type") || "video/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "no-store");

    const contentLength = telegramRes.headers.get("Content-Length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    const contentRange = telegramRes.headers.get("Content-Range");
    if (contentRange) responseHeaders.set("Content-Range", contentRange);

    // Step 5: Stream back to client
    return new Response(telegramRes.body, {
      status: rangeHeader ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[stream] error:", err.message);
    return new Response("Stream error: " + err.message, { status: 500 });
  }
}
