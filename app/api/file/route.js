// app/api/file/route.js — Get Telegram file URL
import { getFileUrl } from "@/lib/telegram";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("file_id");
    if (!fileId) return Response.json({ error: "file_id required" }, { status: 400 });

    const url = await getFileUrl(fileId);
    return Response.json({ url });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
