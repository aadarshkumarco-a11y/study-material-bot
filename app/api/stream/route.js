// app/api/stream/route.js — Simple stream proxy (no Range complexity)
// Gets file URL from Telegram, proxies the response directly.
import { getFilePath, buildFileUrl } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("file_id");

  if (!fileId) {
    return new Response("Missing file_id", { status: 400 });
  }

  try {
    // Step 1: Get file path from Telegram
    const getFileRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const getFileData = await getFileRes.json();

    if (!getFileData.ok) {
      console.error("[stream] getFile failed:", getFileData.description);
      return new Response("File not found", { status: 404 });
    }

    const filePath = getFileData.result.file_path;
    const telegramUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;

    // Step 2: Forward Range header if present (for seeking)
    const rangeHeader = request.headers.get("range");
    const headers = {};
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    // Step 3: Fetch file from Telegram
    const fileRes = await fetch(telegramUrl, { headers });

    if (!fileRes.ok && fileRes.status !== 206) {
      console.error("[stream] fetch failed:", fileRes.status);
      return new Response("Failed to fetch file", { status: 502 });
    }

    // Step 4: Return with proper headers
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", fileRes.headers.get("Content-Type") || "video/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");

    const cl = fileRes.headers.get("Content-Length");
    if (cl) responseHeaders.set("Content-Length", cl);

    const cr = fileRes.headers.get("Content-Range");
    if (cr) responseHeaders.set("Content-Range", cr);

    return new Response(fileRes.body, {
      status: fileRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[stream] error:", err.message);
    return new Response("Stream error", { status: 500 });
  }
}
