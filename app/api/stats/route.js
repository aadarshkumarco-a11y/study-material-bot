// app/api/stats/route.js — App statistics
import { getStats } from "@/lib/storage";
import { getOnlineCount } from "@/lib/utils";

export async function GET() {
  try {
    const stats = await getStats();
    return Response.json({
      ...stats,
      onlineUsers: getOnlineCount(),
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
