// lib/storage.js — Vercel KV storage with in-memory fallback
// Uses @vercel/kv for persistent cross-instance storage.
// Falls back to globalThis in-memory if KV is not configured.

let kv = null;
try {
  // Dynamically import KV only if env vars are set
  if (process.env.KV_REST_API_URL) {
    const { kv: kvClient } = require("@vercel/kv");
    kv = kvClient;
  }
} catch (e) {
  console.log("[storage] KV not available, using in-memory fallback");
}

// In-memory fallback
globalThis._materialsStore = globalThis._materialsStore || { materials: [] };
const memStore = globalThis._materialsStore;

const KV_KEY = "materials";

// ---- Read ----
async function readMaterials() {
  if (kv) {
    try {
      const data = await kv.get(KV_KEY);
      if (data && Array.isArray(data)) return data;
      return [];
    } catch (e) {
      console.error("[storage] KV read error:", e.message);
      return memStore.materials;
    }
  }
  return memStore.materials;
}

// ---- Write ----
async function writeMaterials(materials) {
  // Always write to in-memory too (instant local access)
  memStore.materials = materials;

  if (kv) {
    try {
      await kv.set(KV_KEY, materials);
      console.log("[storage] KV write OK:", materials.length, "materials");
    } catch (e) {
      console.error("[storage] KV write error:", e.message);
    }
  }
}

// ---- Public API ----

export async function getAllMaterials(filters = {}) {
  let materials = await readMaterials();

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
  const materials = await readMaterials();
  return materials.find((m) => m.id === id);
}

export async function updateMaterial(fileId, updates) {
  const materials = await readMaterials();
  const idx = materials.findIndex((m) => m.file_id === fileId);
  if (idx === -1) return false;
  materials[idx] = { ...materials[idx], ...updates, updatedAt: new Date().toISOString() };
  await writeMaterials(materials);
  return true;
}

export async function saveMaterial(material) {
  const materials = await readMaterials();
  materials.unshift(material);
  await writeMaterials(materials);
  console.log("[storage] saved:", material.id, "total:", materials.length);
  return material;
}

export async function deleteMaterial(id) {
  const materials = await readMaterials();
  const filtered = materials.filter((m) => m.id !== id);
  await writeMaterials(filtered);
}

export async function incrementViews(id) {
  const materials = await readMaterials();
  const m = materials.find((x) => x.id === id);
  if (m) {
    m.views = (m.views || 0) + 1;
    await writeMaterials(materials);
  }
}

export async function togglePremium(id, isPremium) {
  const materials = await readMaterials();
  const m = materials.find((x) => x.id === id);
  if (m) {
    m.isPremium = isPremium;
    await writeMaterials(materials);
  }
}

export async function getStats() {
  const materials = await readMaterials();
  const today = new Date().toISOString().slice(0, 10);
  const todayUploads = materials.filter((m) => m.uploadedAt?.slice(0, 10) === today).length;
  const uniqueDays = new Set(materials.map((m) => m.uploadedAt?.slice(0, 10))).size;
  return { totalMaterials: materials.length, todayUploads, uniqueDays };
}
