/**
 * Offline-First IndexedDB Appraisal Queue for Rural Artisans
 * 
 * Allows artisans to photograph and describe crafts with zero signal.
 * Crafts are stored safely in browser IndexedDB, and automatically uploaded/synced
 * as soon as 3G/4G connectivity returns.
 */

const DB_NAME = "CraftLensOfflineDB";
const DB_VERSION = 1;
const STORE_NAME = "appraisal_queue";

/**
 * Open or upgrade the IndexedDB instance
 */
export function openOfflineDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported on this platform"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an appraisal to the offline queue
 */
export async function queueAppraisalLocally({
  craftFile,
  craftPreview,
  voiceDescription = "",
  audioBlob = null,
  weightGrams = 350,
  laborHours = 4.0,
  isHollow = false,
  scaleReference = "None",
  language = "en",
  selectedState = "Telangana",
  removeBg = false,
  title = "Handcrafted Artisan Item",
}) {
  const db = await openOfflineDB();
  const id = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Convert craftFile to blob if needed
  const photoBlob = craftFile instanceof Blob ? craftFile : new Blob([craftFile]);

  const draft = {
    id,
    title,
    createdAt: Date.now(),
    status: "pending", // pending, syncing, synced, failed
    syncAttempts: 0,
    photoBlob,
    photoPreview: craftPreview || "",
    audioBlob: audioBlob ? (audioBlob instanceof Blob ? audioBlob : new Blob([audioBlob])) : null,
    voiceDescription,
    weightGrams: Number(weightGrams) || 350,
    laborHours: Number(laborHours) || 4.0,
    isHollow: Boolean(isHollow),
    scaleReference: scaleReference || "None",
    language: language || "en",
    selectedState: selectedState || "Telangana",
    removeBg: Boolean(removeBg),
    result: null,
    errorMessage: null,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(draft);

    req.onsuccess = () => resolve(draft);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Fetch all queued items (both pending and synced)
 */
export async function getAllQueuedAppraisals() {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const items = req.result || [];
      // Sort newest first
      items.sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Fetch pending items waiting for sync
 */
export async function getPendingAppraisals() {
  const all = await getAllQueuedAppraisals();
  return all.filter((item) => item.status === "pending" || item.status === "failed");
}

/**
 * Delete a draft from the offline queue
 */
export async function deleteQueuedAppraisal(id) {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Update an existing draft record
 */
export async function updateQueuedDraft(id, updates) {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      if (!getReq.result) {
        return reject(new Error(`Draft with id ${id} not found`));
      }
      const updated = { ...getReq.result, ...updates, updatedAt: Date.now() };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Attempt to sync a single queued appraisal with FastAPI /api/analyze
 */
export async function syncSingleAppraisal(draft, apiBaseUrl = "http://localhost:8000") {
  await updateQueuedDraft(draft.id, {
    status: "syncing",
    syncAttempts: (draft.syncAttempts || 0) + 1,
  });

  try {
    const formData = new FormData();
    // Reconstruct File from stored Blob
    const ext = draft.photoBlob?.type?.includes("webp") ? "webp" : "jpg";
    const photoFile = new File([draft.photoBlob], `craft_${draft.id}.${ext}`, {
      type: draft.photoBlob?.type || "image/webp",
    });

    formData.append("craft_photo", photoFile);
    formData.append("language", draft.language || "en");
    formData.append("needs_bg_removal", draft.removeBg ? "true" : "false");
    formData.append("state", draft.selectedState || "Telangana");
    formData.append("voice_description", draft.voiceDescription || "");
    formData.append("weight_grams", (draft.weightGrams || 350).toString());
    formData.append("crafting_hours", (draft.laborHours || 4.0).toString());
    formData.append("is_hollow", draft.isHollow ? "true" : "false");
    formData.append("scale_reference", draft.scaleReference || "None");

    if (draft.audioBlob) {
      formData.append(
        "craft_audio",
        new File([draft.audioBlob], `audio_${draft.id}.webm`, {
          type: draft.audioBlob?.type || "audio/webm",
        })
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000); // 28s timeout

    const res = await fetch(`${apiBaseUrl}/api/analyze`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.detail || `Server returned ${res.status}`);
    }

    const data = await res.json();

    const updated = await updateQueuedDraft(draft.id, {
      status: "synced",
      result: data,
      syncedAt: Date.now(),
      errorMessage: null,
    });

    return { success: true, draft: updated, result: data };
  } catch (err) {
    console.warn(`Sync failed for draft ${draft.id}:`, err);
    await updateQueuedDraft(draft.id, {
      status: "failed",
      errorMessage: err.message || "Network request failed",
    });
    return { success: false, draft, error: err.message };
  }
}

/**
 * Sync all pending queued appraisals
 */
export async function syncAllPendingAppraisals(onDraftCompleted) {
  const pending = await getPendingAppraisals();
  const results = [];

  for (const draft of pending) {
    const res = await syncSingleAppraisal(draft);
    results.push(res);
    if (onDraftCompleted) {
      onDraftCompleted(res);
    }
  }

  return results;
}
