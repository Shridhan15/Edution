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