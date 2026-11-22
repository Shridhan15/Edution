import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStudent } from "../hooks/useStudents";
import { useClasses } from "../hooks/useCurriculum";
import StudentHeader from "../components/student/StudentHeader";
import StudentContactCard from "../components/student/StudentContactCard";
import StudentTimeline from "../components/student/StudentTimeline";
import EditStudentModal from "../components/student/EditStudentModal";

export default function StudentProfile() {
  const { studentId } = useParams();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: student, isLoading, error } = useStudent(studentId);
  const { data: classes = [] } = useClasses();

  if (isLoading)
    return <div className="p-8 text-gray-500">Loading profile...</div>;
  if (error)
    return <div className="p-8 text-red-500">Error: {error.message}</div>;

  const enrolledClass = classes.find((c) => c.id === student.class_id);

  return (
    <div className="p-8 space-y-6">
      <Link
        to="/students"
        className="text-sm text-blue-500 hover:underline inline-flex items-center gap-1"
      >
        &larr; Back to Students
      </Link>

      <StudentHeader
        student={student}
        className={enrolledClass?.name}
        onEditClick={() => setIsEditOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <StudentContactCard student={student} />
        </div>
        <div className="lg:col-span-2">
          <StudentTimeline />
        </div>
      </div>

      <EditStudentModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        student={student}
      />
    </div>
  );
}
