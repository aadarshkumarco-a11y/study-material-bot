// lib/storage.js — Material metadata storage (JSON file based, Vercel KV compatible)
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "materials.json");

// ---- JSON file storage (works locally + on Vercel with /tmp) ----

function readJson() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { materials: [] };
  }
}

function writeJson(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("[storage] write failed:", e.message);
  }
}

// ---- Public API ----

export async function getAllMaterials(filters = {}) {
  const data = readJson();
  let materials = data.materials || [];

  // Apply filters
  if (filters.type) materials = materials.filter((m) => m.type === filters.type);
  if (filters.subject) materials = materials.filter((m) => m.subject === filters.subject);
  if (filters.premium === "true") materials = materials.filter((m) => m.isPremium);
  if (filters.sort === "trending") materials = materials.sort((a, b) => (b.views || 0) - (a.views || 0));
  if (filters.sort === "new") {
    const weekAgo = Date.now() - 7 * 86400000;
    materials = materials.filter((m) => new Date(m.uploadedAt).getTime() > weekAgo);
  }

  // Pagination
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const start = (page - 1) * limit;
  const paginated = materials.slice(start, start + limit);

  return { materials: paginated, total: materials.length, page };
}

export async function getMaterialById(id) {
  const data = readJson();
  return (data.materials || []).find((m) => m.id === id);
}

export async function saveMaterial(material) {
  const data = readJson();
  data.materials = data.materials || [];
  data.materials.unshift(material);
  writeJson(data);
  return material;
}

export async function deleteMaterial(id) {
  const data = readJson();
  data.materials = (data.materials || []).filter((m) => m.id !== id);
  writeJson(data);
}

export async function incrementViews(id) {
  const data = readJson();
  const m = (data.materials || []).find((x) => x.id === id);
  if (m) {
    m.views = (m.views || 0) + 1;
    writeJson(data);
  }
}

export async function togglePremium(id, isPremium) {
  const data = readJson();
  const m = (data.materials || []).find((x) => x.id === id);
  if (m) {
    m.isPremium = isPremium;
    writeJson(data);
  }
}

export async function getStats() {
  const data = readJson();
  const materials = data.materials || [];
  const today = new Date().toISOString().slice(0, 10);
  const todayUploads = materials.filter((m) => m.uploadedAt?.slice(0, 10) === today).length;
  const uniqueDays = new Set(materials.map((m) => m.uploadedAt?.slice(0, 10))).size;
  return {
    totalMaterials: materials.length,
    todayUploads,
    uniqueDays,
  };
}
