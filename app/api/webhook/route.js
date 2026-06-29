// app/api/webhook/route.js — Telegram bot webhook (manual, no Telegraf)
import { saveMaterial, deleteMaterial, togglePremium, getAllMaterials } from "@/lib/storage";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = parseInt(process.env.ADMIN_CHAT_ID);

async function reply(chatId, text) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function POST(request) {
  try {
    const update = await request.json();
    console.log("[webhook] received update:", JSON.stringify(update).slice(0, 200));

    const msg = update.message || update.edited_message;
    if (!msg) return new Response("OK", { status: 200 });

    const fromId = msg.from?.id;
    const chatId = msg.chat?.id;
    const isAdmin = fromId === ADMIN_CHAT_ID;

    // ---- Admin: Video upload ----
    if (msg.video && isAdmin) {
      const video = msg.video;
      const caption = msg.caption || "";
      const [title, subject] = caption.split("|").map((s) => s.trim());

      const material = {
        id: Date.now().toString(),
        file_id: video.file_id,
        type: "video",
        title: title || "Untitled Video",
        subject: subject || "General",
        duration: video.duration,
        size: video.file_size,
        views: 0,
        isPremium: false,
        uploadedAt: new Date().toISOString(),
        thumbnail_file_id: video.thumbnail?.file_id || null,
      };
      await saveMaterial(material);
      await reply(chatId, `✅ Video saved!\n📚 ${material.title}\n📂 ${material.subject}\n⏱ ${Math.floor(video.duration / 60)} mins`);
      return new Response("OK", { status: 200 });
    }

    // ---- Admin: Document upload ----
    if (msg.document && isAdmin) {
      const doc = msg.document;
      const caption = msg.caption || "";
      const [title, subject] = caption.split("|").map((s) => s.trim());

      const material = {
        id: Date.now().toString(),
        file_id: doc.file_id,
        type: "document",
        title: title || doc.file_name || "Untitled Document",
        subject: subject || "General",
        size: doc.file_size,
        views: 0,
        isPremium: false,
        uploadedAt: new Date().toISOString(),
        thumbnail_file_id: null,
      };
      await saveMaterial(material);
      await reply(chatId, `✅ Document saved!\n📄 ${material.title}\n📂 ${material.subject}`);
      return new Response("OK", { status: 200 });
    }

    // ---- Admin: Commands ----
    if (msg.text && msg.text.startsWith("/")) {
      const parts = msg.text.split(" ");
      const cmd = parts[0].toLowerCase();

      if (cmd === "/start") {
        await reply(chatId, "👋 Welcome to Study Material Bot!\n\nAdmin: Send a video/document with caption 'Title | Subject' to upload.\nCommands: /list, /delete, /premium, /stats");
        return new Response("OK", { status: 200 });
      }

      if (!isAdmin) {
        await reply(chatId, "⛔ Only admin can use commands.");
        return new Response("OK", { status: 200 });
      }

      if (cmd === "/list") {
        const { materials } = await getAllMaterials();
        if (materials.length === 0) {
          await reply(chatId, "📭 No materials uploaded yet.");
        } else {
          const list = materials.slice(0, 20).map((m, i) => `${i + 1}. ${m.title} (${m.type})`).join("\n");
          await reply(chatId, `📋 Materials (${materials.length} total):\n\n${list}`);
        }
        return new Response("OK", { status: 200 });
      }

      if (cmd === "/delete") {
        const id = parts[1];
        if (!id) { await reply(chatId, "Usage: /delete <id>"); return new Response("OK", { status: 200 }); }
        await deleteMaterial(id);
        await reply(chatId, `🗑 Deleted: ${id}`);
        return new Response("OK", { status: 200 });
      }

      if (cmd === "/premium") {
        const id = parts[1];
        const status = parts[2];
        if (!id || !status) { await reply(chatId, "Usage: /premium <id> <on|off>"); return new Response("OK", { status: 200 }); }
        await togglePremium(id, status === "on");
        await reply(chatId, `👑 Premium ${status} for: ${id}`);
        return new Response("OK", { status: 200 });
      }

      if (cmd === "/stats") {
        const { materials } = await getAllMaterials();
        const totalViews = materials.reduce((s, m) => s + (m.views || 0), 0);
        await reply(chatId, `📊 Stats:\n📚 Total: ${materials.length}\n👁 Views: ${totalViews}`);
        return new Response("OK", { status: 200 });
      }
    }

    // ---- Non-admin: forward to admin ----
    if (!isAdmin && msg.text) {
      const adminId = ADMIN_CHAT_ID;
      const userName = msg.from?.first_name || "Unknown";
      await reply(adminId, `📝 <b>New Material Request</b>\n\n👤 ${userName} (${fromId})\n💬 ${msg.text}`);
      await reply(chatId, "✅ Your request has been sent to admin!");
      return new Response("OK", { status: 200 });
    }

    // ---- Non-admin: video/doc upload attempt ----
    if (!isAdmin && (msg.video || msg.document)) {
      await reply(chatId, "⛔ Only admin can upload materials.");
      return new Response("OK", { status: 200 });
    }

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("[webhook] error:", e.message, e.stack);
    return new Response("Error: " + e.message, { status: 200 }); // Always 200 so Telegram doesn't retry infinitely
  }
}

// GET handler for webhook verification
export async function GET() {
  return new Response("Webhook active", { status: 200 });
}
