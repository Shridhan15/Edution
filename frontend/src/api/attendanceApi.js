const BASE_URL = "http://localhost:8000/api";

export async function fetchBatchAttendance(batchId, targetDate) {
    const params = new URLSearchParams();
    if (targetDate) params.append("target_date", targetDate);

    const res = await fetch(`${BASE_URL}/attendance/batch/${batchId}?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch batch attendance");
    return res.json();
}

export async function markBatchAttendance(payload) {
    const res = await fetch(`${BASE_URL}/attendance/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to save attendance");
    }
    return res.json();
}

export async function fetchStudentAttendance(studentId) {
    const res = await fetch(`${BASE_URL}/attendance/student/${studentId}`);
    if (!res.ok) throw new Error("Failed to fetch student attendance");
    return res.json();
}