const BASE_URL = "http://localhost:8000/api/curriculum";

export async function fetchChapterMaterials(chapterId) {
    const res = await fetch(`${BASE_URL}/chapters/${chapterId}/materials`);
    if (!res.ok) throw new Error("Failed to fetch chapter materials");
    return res.json();
}

export async function uploadChapterMaterial({ chapterId, file, title }) {
    const formData = new FormData();
    formData.append("file", file);
    if (title?.trim()) {
        formData.append("title", title.trim());
    }

    const res = await fetch(`${BASE_URL}/chapters/${chapterId}/materials`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to upload PDF");
    }
    return res.json();
}

export async function deleteMaterial(materialId) {
    const res = await fetch(`${BASE_URL}/materials/${materialId}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete material");
    }
    return res.json();
}