// app/api/stream/route.js — Proxy Telegram file stream with Range support
import { getFilePath, buildFileUrl } from "@/lib/telegram";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("file_id");
    if (!fileId) return new Response("file_id required", { status: 400 });

    // Step 1: Get file path from Telegram
    const filePath = await getFilePath(fileId);
    const telegramFileUrl = buildFileUrl(filePath);

    // Step 2: Get range header for video seeking
    const range = request.headers.get("range");

    // Step 3: Proxy the request to Telegram with range support
    const telegramResponse = await fetch(telegramFileUrl, {
      headers: range ? { Range: range } : {},
    });

    // Step 4: Return response with same headers
    const headers = {
      "Content-Type": telegramResponse.headers.get("Content-Type") || "application/octet-stream",
      "Accept-Ranges": "bytes",
    };

    const contentLength = telegramResponse.headers.get("Content-Length");
    const contentRange = telegramResponse.headers.get("Content-Range");
    if (contentLength) headers["Content-Length"] = contentLength;
    if (contentRange) headers["Content-Range"] = contentRange;

    return new Response(telegramResponse.body, {
      status: telegramResponse.status,
      headers,
    });
  } catch (e) {
    console.error("[stream] error:", e.message);
    return new Response("Stream error: " + e.message, { status: 500 });
  }
}
