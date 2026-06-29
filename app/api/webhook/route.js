// app/api/webhook/route.js — Telegram bot webhook (manual, no Telegraf)
import { saveMaterial, deleteMaterial, togglePremium, getAllMaterials, updateMaterial } from "@/lib/storage";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = parseInt(process.env.ADMIN_CHAT_ID);

async function reply(chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json();
    console.log("[webhook] reply sent:", data.ok, "to", chatId);
    return data;
  } catch (e) {
    console.error("[webhook] reply failed:", e.message);
  }
}

export async function POST(request) {
  let update;
  try {
    update = await request.json();
    console.log("[webhook] received:", JSON.stringify(update).slice(0, 300));
  } catch (e) {
    console.error("[webhook] JSON parse error:", e.message);
    return new Response("OK", { status: 200 });
  }

  try {
    const msg = update.message || update.edited_message;
    if (!msg) {
      console.log("[webhook] no message in update");
      return new Response("OK", { status: 200 });
    }

    const fromId = msg.from?.id;
    const chatId = msg.chat?.id;
    const isAdmin = fromId === ADMIN_CHAT_ID;

    console.log("[webhook] from:", fromId, "admin:", isAdmin, "isAdminCheck:", ADMIN_CHAT_ID);

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
      const sizeMB = (video.file_size / 1048576).toFixed(1);
      await reply(chatId,
        `✅ Video Saved!\n\n` +
        `📋 File ID: <code>${video.file_id}</code>\n` +
        `🎬 Type: Video\n` +
        `📦 Size: ${sizeMB} MB\n` +
        `⏱ Duration: ${Math.floor(video.duration / 60)} min ${video.duration % 60} sec\n` +
        `📅 Saved: ${new Date().toLocaleString("en-IN")}\n\n` +
        (title ? `📚 Title: ${title}\n📂 Subject: ${subject || "General"}\n` : `⚠️ No title set yet!\nUse this command to add title:\n\n/edit ${video.file_id} | Your Title Here | Subject Name`)
      );
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

    // ---- Admin: Photo upload ----
    if (msg.photo && isAdmin) {
      const photo = msg.photo[msg.photo.length - 1];
      const caption = msg.caption || "";
      const [title, subject] = caption.split("|").map((s) => s.trim());

      const material = {
        id: Date.now().toString(),
        file_id: photo.file_id,
        type: "photo",
        title: title || "Untitled Image",
        subject: subject || "General",
        size: photo.file_size,
        views: 0,
        isPremium: false,
        uploadedAt: new Date().toISOString(),
        thumbnail_file_id: null,
      };
      await saveMaterial(material);
      await reply(chatId, `✅ Photo saved!\n🖼 ${material.title}\n📂 ${material.subject}`);
      return new Response("OK", { status: 200 });
    }

    // ---- Admin: Commands ----
    if (msg.text && msg.text.startsWith("/")) {
      const parts = msg.text.split(" ");
      const cmd = parts[0].toLowerCase().split("@")[0];

      if (cmd === "/start") {
        await reply(chatId, "👋 Welcome to Study Material Bot!\n\n📋 How to upload:\n• Send a VIDEO with caption: Title | Subject\n• Send a DOCUMENT/PDF with caption: Title | Subject\n• Send a PHOTO with caption: Title | Subject\n\n🔧 Commands:\n/list — show all materials\n/delete <id> — delete a material\n/premium <id> <on|off> — toggle premium\n/stats — show stats");
        return new Response("OK", { status: 200 });
      }

      if (cmd === "/help") {
        await reply(chatId, "📋 How to upload:\n• Send VIDEO with caption: Title | Subject\n• Send DOCUMENT with caption: Title | Subject\n• Send PHOTO with caption: Title | Subject\n\n🔧 Commands:\n/list, /delete <id>, /premium <id> <on|off>, /stats");
        return new Response("OK", { status: 200 });
      }

      if (!isAdmin) {
        await reply(chatId, "⛔ Only admin can use commands.");
        return new Response("OK", { status: 200 });
      }

      if (cmd === "/list") {
        const { materials } = await getAllMaterials();
        if (materials.length === 0) {
          await reply(chatId, "📭 No materials uploaded yet.\n\nSend a video/document with caption:\nTitle | Subject");
        } else {
          const list = materials.slice(0, 20).map((m, i) =>
            `${i + 1}. ${m.title} (${m.type})\n   🆔 <code>${(m.file_id || "").substring(0, 30)}...</code>`
          ).join("\n");
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

      if (cmd === "/edit") {
        const text = msg.text.replace("/edit", "").trim();
        const parts = text.split("|").map((s) => s.trim());
        if (parts.length < 2) {
          await reply(chatId, "❌ Wrong format!\n\nUse:\n/edit <file_id> | <title> | <subject>\n\nExample:\n/edit BQACAgIA... | DSA Lecture 1 | DSA");
          return new Response("OK", { status: 200 });
        }
        const [fileId, editTitle, editSubject] = parts;
        const updated = await updateMaterial(fileId, { title: editTitle, subject: editSubject || "General" });
        if (!updated) {
          await reply(chatId, "❌ File ID not found. Upload the video first, then use /edit.");
          return new Response("OK", { status: 200 });
        }
        await reply(chatId,
          `✅ Updated Successfully!\n\n` +
          `📚 Title: ${editTitle}\n` +
          `📂 Subject: ${editSubject || "General"}\n` +
          `🆔 File ID: <code>${fileId.substring(0, 30)}...</code>\n\n` +
          `Students can now see this in the app! 🎉`
        );
        return new Response("OK", { status: 200 });
      }
    }

    // ---- Admin: any other message (fallback) ----
    if (isAdmin && !msg.text?.startsWith("/")) {
      await reply(chatId, "📤 To upload material, send:\n• Video with caption: Title | Subject\n• Document with caption: Title | Subject\n• Photo with caption: Title | Subject\n\nOr use /help for commands");
      return new Response("OK", { status: 200 });
    }

    // ---- Non-admin: forward to admin ----
    if (!isAdmin) {
      const userName = msg.from?.first_name || "Unknown";
      const text = msg.text || msg.caption || (msg.video ? "[video]" : msg.document ? "[document]" : msg.photo ? "[photo]" : "[message]");
      await reply(ADMIN_CHAT_ID, `📝 <b>New Material Request</b>\n\n👤 ${userName} (${fromId})\n💬 ${text}`);
      await reply(chatId, "✅ Your request has been sent to admin!");
      return new Response("OK", { status: 200 });
    }

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("[webhook] FATAL error:", e.message, e.stack);
    // Try to send error to admin
    try {
      await reply(ADMIN_CHAT_ID, `❌ Webhook error: ${e.message}`);
    } catch {}
    return new Response("OK", { status: 200 });
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    status: "active",
    bot: "study-material-bot",
    adminId: ADMIN_CHAT_ID,
    timestamp: new Date().toISOString(),
  }), { headers: { "Content-Type": "application/json" } });
}
