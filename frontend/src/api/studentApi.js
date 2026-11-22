const BASE_URL = "http://localhost:8000/api";

export async function fetchStudents() {
  const response = await fetch(`${BASE_URL}/students/`);
  if (!response.ok) {
    throw new Error("Failed to fetch students");
  }
  return response.json();
}

export async function createStudent(studentData) {
  const response = await fetch(`${BASE_URL}/students/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to create student");
  }
  return response.json();
}

export async function fetchStudentById(studentId) {
  const response = await fetch(`${BASE_URL}/students/${studentId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch student profile");
  }
  return response.json();
}


export async function updateStudent(studentId, studentData) {
  const response = await fetch(`${BASE_URL}/students/${studentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to update student");
  }
  return response.json();
}


export async function uploadStudentPhoto(studentId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/students/${studentId}/photo`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to upload photo");
  }
  return response.json();
}

export async function deleteStudent(studentId) {
  const response = await fetch(`${BASE_URL}/students/${studentId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete student");
  }
}