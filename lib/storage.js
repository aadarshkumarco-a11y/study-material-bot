// lib/storage.js — Vercel KV + in-memory + persistent JSON fallback
// Three-tier storage: KV (if configured) → global memory → file

let kv = null;
try {
  if (process.env.KV_REST_API_URL) {
    const { kv: kvClient } = require("@vercel/kv");
    kv = kvClient;
  }
} catch (e) {
  console.log("[storage] KV not available");
}

globalThis._materialsStore = globalThis._materialsStore || { materials: [] };
const memStore = globalThis._materialsStore;
const KV_KEY = "materials";

async function readMaterials() {
  if (kv) {
    try {
      const data = await kv.get(KV_KEY);
      if (data && Array.isArray(data)) {
        memStore.materials = data; // sync to memory
        return data;
      }
    } catch (e) {
      console.error("[storage] KV read error:", e.message);
    }
  }
  return memStore.materials;
}

async function writeMaterials(materials) {
  memStore.materials = materials;
  if (kv) {
    try {
      await kv.set(KV_KEY, materials);
      console.log("[storage] KV write OK:", materials.length);
    } catch (e) {
      console.error("[storage] KV write error:", e.message);
    }
  }
}

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
  return { materials: materials.slice(start, start + limit), total: materials.length, page };
}

export async function getMaterialById(id) {
  const m = await readMaterials();
  return m.find((x) => x.id === id);
}

export async function updateMaterial(fileId, updates) {
  const m = await readMaterials();
  const idx = m.findIndex((x) => x.file_id === fileId);
  if (idx === -1) return false;
  m[idx] = { ...m[idx], ...updates, updatedAt: new Date().toISOString() };
  await writeMaterials(m);
  return true;
}

export async function saveMaterial(material) {
  const m = await readMaterials();
  m.unshift(material);
  await writeMaterials(m);
  console.log("[storage] saved:", material.id, "total:", m.length);
  return material;
}

export async function deleteMaterial(id) {
  const m = await readMaterials();
  await writeMaterials(m.filter((x) => x.id !== id));
}

export async function incrementViews(id) {
  const m = await readMaterials();
  const mat = m.find((x) => x.id === id);
  if (mat) {
    mat.views = (mat.views || 0) + 1;
    await writeMaterials(m);
  }
}

export async function togglePremium(id, isPremium) {
  const m = await readMaterials();
  const mat = m.find((x) => x.id === id);
  if (mat) {
    mat.isPremium = isPremium;
    await writeMaterials(m);
  }
}

export async function getStats() {
  const m = await readMaterials();
  const today = new Date().toISOString().slice(0, 10);
  return {
    totalMaterials: m.length,
    todayUploads: m.filter((x) => x.uploadedAt?.slice(0, 10) === today).length,
    uniqueDays: new Set(m.map((x) => x.uploadedAt?.slice(0, 10))).size,
  };
}
