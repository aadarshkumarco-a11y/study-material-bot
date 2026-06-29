// app/api/webhook/route.js — Telegram bot webhook handler
import { Telegraf } from "telegraf";
import { saveMaterial, deleteMaterial, togglePremium, getAllMaterials } from "@/lib/storage";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = parseInt(process.env.ADMIN_CHAT_ID);

export async function POST(request) {
  try {
    const update = await request.json();
    const bot = new Telegraf(BOT_TOKEN);

    // ---- Admin: Video upload ----
    bot.on("video", async (ctx) => {
      if (ctx.from.id !== ADMIN_CHAT_ID) {
        return ctx.reply("⛔ Only admin can upload materials.");
      }
      const video = ctx.message.video;
      const caption = ctx.message.caption || "";
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
      ctx.reply(`✅ Video saved!\n📚 ${material.title}\n📂 ${material.subject}\n⏱ ${Math.floor(video.duration / 60)} mins`);
    });

    // ---- Admin: Document upload ----
    bot.on("document", async (ctx) => {
      if (ctx.from.id !== ADMIN_CHAT_ID) {
        return ctx.reply("⛔ Only admin can upload materials.");
      }
      const doc = ctx.message.document;
      const caption = ctx.message.caption || "";
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
      ctx.reply(`✅ Document saved!\n📄 ${material.title}\n📂 ${material.subject}\n💾 ${material.size}`);
    });

    // ---- Admin: Commands ----
    bot.command("list", async (ctx) => {
      if (ctx.from.id !== ADMIN_CHAT_ID) return;
      const { materials } = await getAllMaterials();
      if (materials.length === 0) return ctx.reply("📭 No materials uploaded yet.");
      const list = materials.slice(0, 20).map((m, i) => `${i + 1}. ${m.title} (${m.type})`).join("\n");
      ctx.reply(`📋 Materials (${materials.length} total):\n\n${list}`);
    });

    bot.command("delete", async (ctx) => {
      if (ctx.from.id !== ADMIN_CHAT_ID) return;
      const id = ctx.message.text.split(" ")[1];
      if (!id) return ctx.reply("Usage: /delete <id>");
      await deleteMaterial(id);
      ctx.reply(`🗑 Deleted material: ${id}`);
    });

    bot.command("premium", async (ctx) => {
      if (ctx.from.id !== ADMIN_CHAT_ID) return;
      const parts = ctx.message.text.split(" ");
      const id = parts[1];
      const status = parts[2];
      if (!id || !status) return ctx.reply("Usage: /premium <id> <on|off>");
      await togglePremium(id, status === "on");
      ctx.reply(`👑 Premium ${status === "on" ? "enabled" : "disabled"} for: ${id}`);
    });

    bot.command("stats", async (ctx) => {
      if (ctx.from.id !== ADMIN_CHAT_ID) return;
      const { materials } = await getAllMaterials();
      const totalViews = materials.reduce((s, m) => s + (m.views || 0), 0);
      ctx.reply(`📊 Stats:\n📚 Total: ${materials.length}\n👁 Views: ${totalViews}`);
    });

    await bot.handleUpdate(update);
    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("[webhook] error:", e.message);
    return new Response("Error", { status: 500 });
  }
}
