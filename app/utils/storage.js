// /app/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORTS_KEY = 'reports';

// ✅ NEW: kufizim i listës (mbron AsyncStorage nga rritja pa fund)
const MAX_REPORTS = 200;

// ✅ NEW: normalizon report-in (siguri kundër field-eve që mungojnë)
function normalizeReport(report) {
  const safe = report || {};
  return {
    id: safe.id || (Date.now().toString() + Math.random().toString(36).slice(2)),
    title: (safe.title || '').toString(),
    description: (safe.description || '').toString(),
    image: safe.image || null,
    location: safe.location || null,
    category: safe.category || 'other',
    priority: safe.priority || 'normal',
    status: safe.status || 'pending',
    timestamp: safe.timestamp || new Date().toISOString(),
  };
}

// ✅ NEW: dedupe sipas id (nëse vjen i njëjti raport, mos e dyfisho)
function dedupeById(reports) {
  const map = new Map();
  (reports || []).forEach((r) => {
    if (r?.id) map.set(r.id, r);
  });
  // ruaj renditjen: më i riu i pari (nga timestamp)
  const arr = Array.from(map.values());
  arr.sort((a, b) => {
    const ta = new Date(a.timestamp || 0).getTime();
    const tb = new Date(b.timestamp || 0).getTime();
    return tb - ta;
  });
  return arr;
}

export async function getReports() {
  try {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    // ✅ NEW: sanitize + dedupe (nuk prishet asgjë, vetëm e bën më clean)
    const normalized = (Array.isArray(parsed) ? parsed : []).map(normalizeReport);
    return dedupeById(normalized);
  } catch (e) {
    console.error('getReports error:', e);
    return [];
  }
}

export async function saveReport(report) {
  try {
    const existing = await getReports();
    const normalized = normalizeReport(report);

    // ✅ NEW: replace nëse ekziston i njëjti id, përndryshe shto në fillim
    const exists = existing.find((r) => r.id === normalized.id);
    const updated = exists
      ? existing.map((r) => (r.id === normalized.id ? { ...r, ...normalized } : r))
      : [normalized, ...existing];

    const finalList = dedupeById(updated).slice(0, MAX_REPORTS);

    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(finalList));

    // Debug: verifiko menjëherë që u ruajt
    const check = await AsyncStorage.getItem(REPORTS_KEY);
    console.log('✅ SAVED REPORTS:', check);

    return true;
  } catch (e) {
    console.error('saveReport error:', e);
    throw e;
  }
}

export async function clearReports() {
  try {
    await AsyncStorage.removeItem(REPORTS_KEY);
    return true;
  } catch (e) {
    console.error('clearReports error:', e);
    return false;
  }
}

// =========================
// ✅ NEW OPTIONAL FEATURES (nuk ta prishin app-in edhe nëse s’i përdor)
// =========================

// 1) Update status (p.sh. nga pending -> resolved)
export async function updateReportStatus(reportId, status) {
  try {
    const existing = await getReports();
    const updated = existing.map((r) =>
      r.id === reportId ? { ...r, status: status || r.status } : r
    );
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('updateReportStatus error:', e);
    return false;
  }
}

// 2) Delete report
export async function deleteReport(reportId) {
  try {
    const existing = await getReports();
    const updated = existing.filter((r) => r.id !== reportId);
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('deleteReport error:', e);
    return false;
  }
}

// 3) Replace all reports (import/export ose sync)
export async function setReports(reportsArray) {
  try {
    const normalized = (Array.isArray(reportsArray) ? reportsArray : []).map(normalizeReport);
    const finalList = dedupeById(normalized).slice(0, MAX_REPORTS);
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(finalList));
    return true;
  } catch (e) {
    console.error('setReports error:', e);
    return false;
  }
}

// 4) Get report by id
export async function getReportById(reportId) {
  try {
    const existing = await getReports();
    return existing.find((r) => r.id === reportId) || null;
  } catch (e) {
    console.error('getReportById error:', e);
    return null;
  }
}
