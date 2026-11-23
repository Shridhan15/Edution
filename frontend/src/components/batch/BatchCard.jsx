export function formatTime(timeStr) {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export default function BatchCard({ batch, className, onOpen, onDeleteClick }) {
  return (
    <div
      onClick={onOpen}
      className="group relative cursor-pointer rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {batch.name}
          </h3>
          <p className="mt-1 text-sm font-medium text-blue-600">
            🕒 {formatTime(batch.start_time)} – {formatTime(batch.end_time)}
          </p>
        </div>

        <button
          type="button"
          title="Delete batch"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(batch);
          }}
          className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {/* Days of Week */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {batch.days_of_week?.length > 0 ? (
          batch.days_of_week.map((day) => (
            <span
              key={day}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
            >
              {day}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">No days set</span>
        )}
      </div>

      {/* Footer Meta */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3 text-xs font-medium text-gray-500">
        <span>🎓 {className || "Mixed / All Classes"}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
          {batch.student_count}{" "}
          {batch.student_count === 1 ? "Student" : "Students"}
        </span>
      </div>
    </div>
  );
}
