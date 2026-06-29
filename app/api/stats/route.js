// app/api/stats/route.js — App statistics (no cache)
import { getStats } from "@/lib/storage";
import { getOnlineCount } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const stats = await getStats();
    return Response.json(
      { ...stats, onlineUsers: getOnlineCount() },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
