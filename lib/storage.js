// lib/storage.js — In-memory material storage (Vercel serverless compatible)
// Uses a global variable to persist across invocations within the same instance.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Global in-memory store (survives across requests in same serverless instance)
globalThis._materialsStore = globalThis._materialsStore || { materials: [] };
const store = globalThis._materialsStore;

// ---- Public API ----

export async function getAllMaterials(filters = {}) {
  let materials = [...store.materials];

  if (filters.type) materials = materials.filter((m) => m.type === filters.type);
  if (filters.subject) materials = materials.filter((m) => m.subject === filters.subject);
  if (filters.premium === "true") materials = materials.filter((m) => m.isPremium);
  if (filters.sort === "trending") materials = materials.sort((a, b) => (b.views || 0) - (a.views || 0));
  if (filters.sort === "new") {
    const weekAgo = Date.now() - 7 * 86400000;
    materials = materials.filter((m) => new Date(m.uploadedAt).getTime() > weekAgo);
  }

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 50;
  const start = (page - 1) * limit;
  const paginated = materials.slice(start, start + limit);

  return { materials: paginated, total: materials.length, page };
}

export async function getMaterialById(id) {
  return store.materials.find((m) => m.id === id);
}

export async function saveMaterial(material) {
  store.materials.unshift(material);
  console.log("[storage] saved material:", material.id, "total:", store.materials.length);
  return material;
}

export async function deleteMaterial(id) {
  store.materials = store.materials.filter((m) => m.id !== id);
}

export async function incrementViews(id) {
  const m = store.materials.find((x) => x.id === id);
  if (m) m.views = (m.views || 0) + 1;
}

export async function togglePremium(id, isPremium) {
  const m = store.materials.find((x) => x.id === id);
  if (m) m.isPremium = isPremium;
}

export async function getStats() {
  const materials = store.materials;
  const today = new Date().toISOString().slice(0, 10);
  const todayUploads = materials.filter((m) => m.uploadedAt?.slice(0, 10) === today).length;
  const uniqueDays = new Set(materials.map((m) => m.uploadedAt?.slice(0, 10))).size;
  return {
    totalMaterials: materials.length,
    todayUploads,
    uniqueDays,
  };
}
