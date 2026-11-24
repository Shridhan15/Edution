import { useMemo } from "react";
import { useStudentAttendance } from "../../hooks/useAttendance";

const BADGE_STYLES = {
  PRESENT: "bg-green-100 text-green-700",
  LATE: "bg-amber-100 text-amber-700",
  ABSENT: "bg-red-100 text-red-700",
};

export default function StudentTimeline({ studentId, batches = [] }) {
  const { data, isLoading, error } = useStudentAttendance(studentId);

  const batchMap = useMemo(
    () => Object.fromEntries(batches.map((b) => [b.id, b.name])),
    [batches],
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Academic Timeline
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Auto-populated from Tests & Attendance
          </p>
        </div>

        {data?.total_days > 0 && (
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
            {data.attendance_percentage}% Attended
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-sm text-gray-400">
          Loading attendance history...
        </div>
      ) : error ? (
        <div className="py-6 text-center text-sm text-red-500">
          Failed to load attendance: {error.message}
        </div>
      ) : !data || data.total_days === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-lg">
          <p className="text-gray-500 text-sm font-medium">
            No academic events recorded yet.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Attendance logs, test scores, and AI evaluations will appear here
            chronologically.
          </p>
        </div>
      ) : (
        <>
          {/* Attendance Summary Strip */}
          <div className="mb-4 flex flex-wrap gap-4 rounded-lg bg-gray-50 px-4 py-2.5 text-xs font-medium">
            <span className="text-gray-600">Total Days: {data.total_days}</span>
            <span className="text-green-600">Present: {data.present_days}</span>
            <span className="text-amber-600">Late: {data.late_days}</span>
            <span className="text-red-600">Absent: {data.absent_days}</span>
          </div>

          {/* Chronological Attendance Logs */}
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
            {data.records.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {rec.date}
                    </span>
                    {batchMap[rec.batch_id] && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {batchMap[rec.batch_id]}
                      </span>
                    )}
                  </div>
                  {rec.remarks && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      Remark: {rec.remarks}
                    </p>
                  )}
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    BADGE_STYLES[rec.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {rec.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
