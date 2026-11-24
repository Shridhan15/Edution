import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useBatchDetail, useRemoveStudentFromBatch } from "../hooks/useBatches";
import { formatTime } from "../components/batch/BatchCard";
import AssignStudentsModal from "../components/batch/AssignStudentsModal";
import AttendanceSheet from "../components/batch/AttendanceSheet";

export default function BatchDetails() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("students"); // "students" | "attendance"

  const { data: batch, isLoading, error } = useBatchDetail(batchId);
  const { mutate: removeStudent } = useRemoveStudentFromBatch(batchId);

  if (isLoading)
    return <div className="p-8 text-gray-500">Loading batch...</div>;
  if (error)
    return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6 p-8">
      <Link
        to="/batches"
        className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline"
      >
        &larr; Back to Batches
      </Link>

      {/* Batch Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{batch.name}</h1>
          <p className="mt-1 text-sm font-medium text-blue-600">
            🕒 {formatTime(batch.start_time)} – {formatTime(batch.end_time)}
            {batch.days_of_week?.length > 0 && (
              <span className="ml-2 text-gray-400">
                • {batch.days_of_week.join(", ")}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              setActiveTab(
                activeTab === "attendance" ? "students" : "attendance",
              )
            }
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "attendance"
                ? "bg-blue-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {activeTab === "attendance" ? "View Roster" : "Mark Attendance"}
          </button>
          <button
            onClick={() => setIsAssignOpen(true)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Assign Students
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "attendance" ? (
        <AttendanceSheet batch={batch} />
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Enrolled Students ({batch.students.length})
            </h2>
          </div>

          {batch.students.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-100 py-10 text-center text-sm text-gray-500">
              No students assigned to this batch yet. Click "+ Assign Students"
              to add them.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {batch.students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between py-3"
                >
                  <div
                    onClick={() => navigate(`/students/${student.id}`)}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-xs font-bold text-white">
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={student.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        student.full_name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 hover:text-blue-600">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.parent_phone || "No phone"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeStudent(student.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AssignStudentsModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        batch={batch}
      />
    </div>
  );
}
