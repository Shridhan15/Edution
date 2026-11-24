import { useState, useEffect } from "react";
import {
  useBatchAttendance,
  useMarkBatchAttendance,
} from "../../hooks/useAttendance";

const STATUS_OPTIONS = [
  {
    value: "PRESENT",
    label: "Present",
    activeClass: "bg-green-600 text-white border-green-600",
  },
  {
    value: "LATE",
    label: "Late",
    activeClass: "bg-amber-500 text-white border-amber-500",
  },
  {
    value: "ABSENT",
    label: "Absent",
    activeClass: "bg-red-600 text-white border-red-600",
  },
];

export default function AttendanceSheet({ batch }) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [records, setRecords] = useState({});
  const [savedNotice, setSavedNotice] = useState(false);

  const { data: existingLogs = [], isLoading } = useBatchAttendance(
    batch.id,
    selectedDate,
  );
  const {
    mutateAsync: saveAttendance,
    isPending,
    error,
  } = useMarkBatchAttendance(batch.id, selectedDate);

  // Sync local state whenever date or fetched logs change
  useEffect(() => {
    const existingMap = Object.fromEntries(
      existingLogs.map((log) => [log.student_id, log]),
    );

    const initial = {};
    batch.students.forEach((student) => {
      const saved = existingMap[student.id];
      initial[student.id] = {
        status: saved ? saved.status : "PRESENT",
        remarks: saved?.remarks || "",
      };
    });
    setRecords(initial);
    setSavedNotice(false);
  }, [existingLogs, batch.students, selectedDate]);

  const updateRecord = (studentId, field, value) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
    setSavedNotice(false);
  };

  const handleSave = async () => {
    const payload = {
      batch_id: batch.id,
      date: selectedDate,
      records: batch.students.map((s) => ({
        student_id: s.id,
        status: records[s.id]?.status || "PRESENT",
        remarks: records[s.id]?.remarks?.trim() || null,
      })),
    };

    await saveAttendance(payload);
    setSavedNotice(true);
  };

  const isAlreadyMarked = existingLogs.length > 0;
  const presentCount = Object.values(records).filter(
    (r) => r.status === "PRESENT",
  ).length;
  const lateCount = Object.values(records).filter(
    (r) => r.status === "LATE",
  ).length;
  const absentCount = Object.values(records).filter(
    (r) => r.status === "ABSENT",
  ).length;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Top Bar: Date Picker & Summary */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 outline-none focus:border-blue-500"
          />
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isAlreadyMarked
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isAlreadyMarked ? "Marked (Editing)" : "Not Marked Yet"}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="text-green-600">Present: {presentCount}</span>
          <span className="text-amber-600">Late: {lateCount}</span>
          <span className="text-red-600">Absent: {absentCount}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error.message}
        </div>
      )}

      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">
          Loading attendance...
        </p>
      ) : batch.students.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          Assign students to this batch before marking attendance.
        </p>
      ) : (
        <>
          <div className="divide-y divide-gray-100">
            {batch.students.map((student) => {
              const rec = records[student.id] || {
                status: "PRESENT",
                remarks: "",
              };
              return (
                <div
                  key={student.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {student.full_name}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Pills */}
                    <div className="flex gap-1.5">
                      {STATUS_OPTIONS.map((opt) => {
                        const isActive = rec.status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              updateRecord(student.id, "status", opt.value)
                            }
                            className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                              isActive
                                ? opt.activeClass
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Optional Remark */}
                    <input
                      type="text"
                      placeholder="Remark (optional)"
                      value={rec.remarks}
                      onChange={(e) =>
                        updateRecord(student.id, "remarks", e.target.value)
                      }
                      className="w-40 rounded-lg border border-gray-200 px-2.5 py-1 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            {savedNotice && (
              <span className="text-xs font-medium text-green-600">
                ✓ Attendance saved
              </span>
            )}
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isPending
                ? "Saving..."
                : isAlreadyMarked
                  ? "Update Attendance"
                  : "Save Attendance"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
