export default function StudentTimeline() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Academic Timeline
        </h2>
        <span className="text-xs text-gray-400">
          Auto-populated from Tests & Attendance
        </span>
      </div>

      <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-lg">
        <p className="text-gray-500 text-sm font-medium">
          No academic events recorded yet.
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Attendance logs, test scores, and AI evaluations will appear here
          chronologically.
        </p>
      </div>
    </div>
  );
}
