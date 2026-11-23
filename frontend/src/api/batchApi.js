const BASE_URL = "http://localhost:8000/api";

export async function fetchBatches() {
  const res = await fetch(`${BASE_URL}/batches`);
  if (!res.ok) throw new Error("Failed to fetch batches");
  return res.json();
}

export async function fetchBatchDetail(batchId) {
  const res = await fetch(`${BASE_URL}/batches/${batchId}`);
  if (!res.ok) throw new Error("Failed to fetch batch details");
  return res.json();
}

export async function createBatch(batchData) {
  const res = await fetch(`${BASE_URL}/batches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(batchData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create batch");
  }
  return res.json();
}

export async function deleteBatch(batchId) {
  const res = await fetch(`${BASE_URL}/batches/${batchId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete batch");
}

export async function addStudentsToBatch(batchId, studentIds) {
  const res = await fetch(`${BASE_URL}/batches/${batchId}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_ids: studentIds }),
  });
  if (!res.ok) throw new Error("Failed to assign students");
  return res.json();
}

export async function removeStudentFromBatch(batchId, studentId) {
  const res = await fetch(`${BASE_URL}/batches/${batchId}/students/${studentId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove student from batch");
}