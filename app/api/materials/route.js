// app/api/materials/route.js — Get all materials + increment views
// BUG 1 FIX: Never cache — always return fresh data
import { getAllMaterials, incrementViews } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      type: searchParams.get("type"),
      subject: searchParams.get("subject"),
      premium: searchParams.get("premium"),
      sort: searchParams.get("sort"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    };
    const result = await getAllMaterials(filters);
    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, action } = await request.json();
    if (action === "view") {
      await incrementViews(id);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
