// app/api/stream/route.js — Stream proxy with URL caching + retry
// For small files: uses cached file_url or getFile
// For large files: tries getFile (may fail for >20MB), falls back to error

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const urlCache = new Map();
const CACHE_TTL = 55 * 60 * 1000;

async function getFileUrl(fileId) {
  const cached = urlCache.get(fileId);
  if (cached && Date.now() < cached.expires) return cached.url;

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "getFile failed");

  const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`;
  urlCache.set(fileId, { url, expires: Date.now() + CACHE_TTL });
  return url;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("file_id");
  if (!fileId) return new Response("Missing file_id", { status: 400 });

  const rangeHeader = request.headers.get("range");

  try {
    let fileUrl;
    try {
      fileUrl = await getFileUrl(fileId);
    } catch (e) {
      console.error("[stream] getFile error:", e.message);
      return new Response(JSON.stringify({ error: "Cannot get file URL. File may be too large (>20MB)." }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }

    const headers = {};
    if (rangeHeader) headers["Range"] = rangeHeader;

    let fileRes = await fetch(fileUrl, { headers });

    // If URL expired (404/400), refresh and retry
    if (fileRes.status === 404 || fileRes.status === 400) {
      urlCache.delete(fileId);
      try {
        fileUrl = await getFileUrl(fileId);
        fileRes = await fetch(fileUrl, { headers });
      } catch (e) {
        return new Response("File URL expired and refresh failed", { status: 502 });
      }
    }

    if (!fileRes.ok && fileRes.status !== 206) {
      console.error("[stream] fetch failed:", fileRes.status);
      return new Response("Failed to fetch file", { status: 502 });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", fileRes.headers.get("Content-Type") || "video/mp4");
    responseHeaders.set("Accept-Ranges", "bytes");
    const cl = fileRes.headers.get("Content-Length");
    if (cl) responseHeaders.set("Content-Length", cl);
    const cr = fileRes.headers.get("Content-Range");
    if (cr) responseHeaders.set("Content-Range", cr);

    return new Response(fileRes.body, { status: fileRes.status, headers: responseHeaders });
  } catch (err) {
    console.error("[stream] error:", err.message);
    return new Response("Stream error: " + err.message, { status: 500 });
  }
}
