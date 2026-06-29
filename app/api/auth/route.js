// app/api/auth/route.js — Validate Telegram initData
import { validateInitData } from "@/lib/auth";

export async function POST(request) {
  try {
    const { initData } = await request.json();
    if (!initData) return Response.json({ ok: false, error: "initData required" }, { status: 400 });

    const user = validateInitData(initData);
    if (!user) {
      return Response.json({ ok: false, error: "Invalid initData" }, { status: 401 });
    }

    return Response.json({
      ok: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        photo_url: user.photo_url,
      },
    });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
