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

      // Get current count for auto-naming
      const { materials: allMats } = await getAllMaterials();
      const videoCount = allMats.filter((m) => m.type === "video").length;
      const newCount = videoCount + 1;
      const autoTitle = `Video ${newCount}`;

      const fileSize = video.file_size || 0;
      const isLarge = fileSize > 20 * 1024 * 1024; // 20MB limit for getFile

      let fileUrl = null;
      let tgMessageLink = null;

      if (!isLarge) {
        // Small video: try getFile → catbox upload for direct CDN streaming
        await reply(chatId, `⏳ Processing "${autoTitle}"...`);

        try {
          // Step 1: Get file from Telegram
          const getFileRes = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${video.file_id}`
          );
          const getFileData = await getFileRes.json();

          if (getFileData.ok) {
            const telegramFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${getFileData.result.file_path}`;

            // Step 2: Download + re-upload to catbox.moe
            const fileResponse = await fetch(telegramFileUrl);
            if (fileResponse.ok) {
              const fileBlob = await fileResponse.blob();
              const formData = new FormData();
              formData.append("reqtype", "fileupload");
              formData.append("fileToUpload", fileBlob, `${autoTitle}.mp4`);

              const catboxRes = await fetch("https://catbox.moe/user/api.php", {
                method: "POST",
                body: formData,
              });

              if (catboxRes.ok) {
                const catboxUrl = (await catboxRes.text()).trim();
                if (catboxUrl.startsWith("https://")) {
                  fileUrl = catboxUrl;
                  console.log("[webhook] catbox upload OK:", fileUrl);
                }
              } else {
                console.log("[webhook] catbox failed:", catboxRes.status);
              }
            }
          }
        } catch (e) {
          console.log("[webhook] processing failed:", e.message);
        }

        // If catbox failed, fall back to Telegram file URL (stream proxy)
        if (!fileUrl) {
          try {
            const getFileRes2 = await fetch(
              `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${video.file_id}`
            );
            const getFileData2 = await getFileRes2.json();
            if (getFileData2.ok) {
              fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${getFileData2.result.file_path}`;
              console.log("[webhook] using Telegram file URL as fallback");
            }
          } catch (e) {
            console.log("[webhook] getFile fallback failed:", e.message);
          }
        }
      } else {
        // Large video: bot sends the video again using sendVideo (creates a bot message)
        // Then we can link to it using tg://msg?chat_id=X&message_id=Y
        await reply(chatId, `⏳ Processing large video "${autoTitle}"...`);

        try {
          // Bot sends the video again — this creates a NEW message FROM the bot
          const sendVideoRes = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                video: video.file_id,
                caption: `🎬 ${autoTitle}`,
                disable_notification: true,
              }),
            }
          );
          const sendVideoData = await sendVideoRes.json();
          if (sendVideoData.ok) {
            const newMsgId = sendVideoData.result.message_id;
            // Store chat_id + message_id for tg:// deep link
            tgMessageLink = `tg://msg?chat_id=${chatId}&message_id=${newMsgId}`;
            console.log("[webhook] sent video, link:", tgMessageLink);
          } else {
            console.log("[webhook] sendVideo failed:", sendVideoData.description);
          }
        } catch (e) {
          console.log("[webhook] sendVideo error:", e.message);
        }
      }

      const material = {
        id: Date.now().toString(),
        file_id: video.file_id,
        type: "video",
        title: autoTitle,
        subject: "General",
        duration: video.duration,
        size: video.file_size,
        views: 0,
        likes: 0,
        dislikes: 0,
        isPremium: false,
        uploadedAt: new Date().toISOString(),
        thumbnail_file_id: video.thumbnail?.file_id || null,
        file_url: fileUrl,
        tg_message_id: msg.message_id,
        tg_message_link: tgMessageLink,
        is_large: isLarge,
      };
      await saveMaterial(material);
      const sizeMB = (video.file_size / 1048576).toFixed(1);

      if (fileUrl) {
        const cdn = fileUrl.includes("catbox") ? "catbox.moe" : "Telegram";
        await reply(chatId,
          `✅ Saved as "${autoTitle}"\n\n` +
          `⏱ Duration: ${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}\n` +
          `📦 Size: ${sizeMB} MB\n` +
          `🔗 CDN: ${cdn}\n\n` +
          `▶️ Video will play in the app!`
        );
      } else if (tgMessageLink) {
        await reply(chatId,
          `✅ Saved as "${autoTitle}"\n\n` +
          `⏱ Duration: ${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}\n` +
          `📦 Size: ${sizeMB} MB\n` +
          `▶️ Video will open in Telegram player.\n\n` +
          `🔄 App will show it instantly!`
        );
      } else {
        await reply(chatId,
          `✅ Saved as "${autoTitle}"\n\n` +
          `⏱ Duration: ${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}\n` +
          `📦 Size: ${sizeMB} MB\n\n` +
          `🔄 App will show it!`
        );
      }
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
            `${i + 1}. ${m.title} (${m.type})`
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
