import { useState } from "react";
import { useStudents } from "../hooks/useStudents";
import AddStudentModal from "../components/AddStudentModal";

export default function StudentList() {
  const { data: students = [], isLoading, error } = useStudents();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading)
    return <div className="p-8 text-gray-500">Loading students...</div>;
  if (error)
    return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Students</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800"
        >
          + Add Student
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-sm text-gray-600">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Parent Name</th>
              <th className="p-4 font-medium">Contact</th>
              <th className="p-4 font-medium">Joining Date</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {students.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  No students found. Add your first student to get started.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                >
                  <td className="p-4 font-medium text-gray-900">
                    {student.full_name}
                  </td>
                  <td className="p-4">{student.parent_name || "—"}</td>
                  <td className="p-4">{student.parent_phone || "—"}</td>
                  <td className="p-4">{student.joining_date}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        student.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
