const BASE_URL = "http://localhost:8000/api/batches";

export async function fetchBatchMaterials(batchId) {
    const res = await fetch(`${BASE_URL}/${batchId}/materials`);
    if (!res.ok) throw new Error("Failed to fetch batch materials");
    return res.json();
}

export async function fetchAllReadyMaterials() {
    const res = await fetch(`${BASE_URL}/ready-materials`);
    if (!res.ok) throw new Error("Failed to fetch curriculum materials");
    return res.json();
}

export async function assignBatchMaterials({ batchId, materialIds }) {
    const res = await fetch(`${BASE_URL}/${batchId}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material_ids: materialIds }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to assign materials");
    }
    return res.json();
}

export async function unassignBatchMaterial({ batchId, materialId }) {
    const res = await fetch(`${BASE_URL}/${batchId}/materials/${materialId}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to unassign material");
    }
    return res.json();
}