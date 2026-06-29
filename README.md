# Study Material Bot — Telegram Mini App

A Telegram Mini App for sharing study lectures and materials. Admin uploads files to a Telegram bot, students browse/stream/download from the Mini App.

## Features
- 📹 Video streaming from Telegram CDN (with Range/seek support)
- 📄 Document/file downloads
- 🔍 Real-time search (debounced)
- 👑 Premium content system (₹39/₹99/₹199)
- 📅 Calendar tab showing upload dates
- 🟢 Online counter (updates every 30s)
- 📱 Mobile-first, black theme, red accents
- 🔐 Telegram initData auth

## Tech Stack
- Next.js 14 (App Router, JavaScript)
- Tailwind CSS
- Telegraf.js (bot library)
- Telegram native file storage (zero cost, unlimited)

## Setup

### 1. Install
```bash
npm install
```

### 2. Environment
`.env.local` already configured with your bot token + admin ID.

### 3. Run locally
```bash
npm run dev
```

### 4. Deploy to Vercel
1. Push to GitHub
2. Import in Vercel
3. Set env variables (already in .env.local)
4. Deploy

### 5. Register webhook
```bash
curl -X POST "https://api.telegram.org/bot8840030204:AAF57FwI8v-k4-vMf-gKE2xo6tyKDkcKFkM/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://YOUR_VERCEL_URL/api/webhook"}'
```

### 6. Set Mini App URL in BotFather
```
/newapp → select bot → set URL to your Vercel deployment
```

## Bot Commands (admin only)
- Upload video: send video with caption `Title | Subject`
- Upload doc: send file with caption `Title | Subject`
- `/list` — show all materials
- `/delete <id>` — delete a material
- `/premium <id> <on|off>` — toggle premium
- `/stats` — show view counts
