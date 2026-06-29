// app/api/request/route.js — Material request → forward to admin
import { forwardToAdmin } from "@/lib/telegram";

export async function POST(request) {
  try {
    const { userId, userName, requestText } = await request.json();
    if (!requestText) return Response.json({ ok: false, error: "requestText required" }, { status: 400 });

    await forwardToAdmin(userId || "unknown", userName || "Anonymous", requestText);
    return Response.json({ ok: true, message: "Request sent to admin" });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
