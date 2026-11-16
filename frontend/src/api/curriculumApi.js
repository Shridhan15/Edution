const BASE_URL = "http://localhost:8000/api/curriculum";

// Classes
export async function fetchClasses() {
    const res = await fetch(`${BASE_URL}/classes`);
    if (!res.ok) throw new Error("Failed to fetch classes");
    return res.json();
}

export async function createClass(data) {
    const res = await fetch(`${BASE_URL}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create class");
    return res.json();
}

// Subjects
export async function fetchSubjects(classId) {
    const res = await fetch(`${BASE_URL}/classes/${classId}/subjects`);
    if (!res.ok) throw new Error("Failed to fetch subjects");
    return res.json();
}

export async function createSubject(data) {
    const res = await fetch(`${BASE_URL}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create subject");
    return res.json();
}

// Chapters
export async function fetchChapters(subjectId) {
    const res = await fetch(`${BASE_URL}/subjects/${subjectId}/chapters`);
    if (!res.ok) throw new Error("Failed to fetch chapters");
    return res.json();
}

export async function createChapter(data) {
    const res = await fetch(`${BASE_URL}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create chapter");
    return res.json();
}