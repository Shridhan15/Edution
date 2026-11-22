import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStudents, useDeleteStudent } from "../hooks/useStudents";
import { useClasses } from "../hooks/useCurriculum";
import AddStudentModal from "../components/AddStudentModal";
import StudentCard from "../components/student/StudentCard";

export default function StudentList() {
  const navigate = useNavigate();
  const { data: students = [], isLoading, error } = useStudents();
  const { data: classes = [] } = useClasses();
  const { mutateAsync: removeStudent, isPending: isDeleting } =
    useDeleteStudent();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const classMap = useMemo(() => {
    return Object.fromEntries(classes.map((cls) => [cls.id, cls.name]));
  }, [classes]);

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    await removeStudent(studentToDelete.id);
    setStudentToDelete(null);
  };

  if (isLoading)
    return <div className="p-8 text-gray-500">Loading students...</div>;
  if (error)
    return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Students</h1>
          <p className="mt-1 text-sm text-gray-500">
            {students.length} {students.length === 1 ? "student" : "students"}{" "}
            enrolled
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800"
        >
          + Add Student
        </button>
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-gray-500 shadow-sm">
          No students found. Add your first student to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              className={classMap[student.class_id]}
              onOpen={() => navigate(`/students/${student.id}`)}
              onDeleteClick={setStudentToDelete}
            />
          ))}
        </div>
      )}

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900">Delete Student?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {studentToDelete.full_name}
              </span>
              ? This will permanently remove their profile photo, attendance
              logs, assignments, and academic history.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStudentToDelete(null)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
