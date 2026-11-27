const STATUS_BADGE = {
  PENDING: "bg-gray-100 text-gray-600",
  PROCESSING: "bg-amber-100 text-amber-700 animate-pulse",
  READY: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border border-red-200",
};

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MaterialRow({
  material,
  isExpanded,
  onToggleOutline,
  onViewPdf,
  onRemove,
  removeLabel = "Delete",
  isRemoving = false,
  badgeText = null,
  subtitlePrefix = null,
}) {
  const topicCount = material.extracted_topics?.length || 0;

  return (
    <div className="py-3.5 first:pt-1 last:pb-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onViewPdf(material)}
              className="text-left text-sm font-semibold text-gray-900 hover:text-blue-600"
            >
              {material.title}
            </button>

            {badgeText && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                {badgeText}
              </span>
            )}

            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                STATUS_BADGE[material.processing_status] ||
                "bg-gray-100 text-gray-600"
              }`}
            >
              {material.processing_status === "READY"
                ? "AI Ready"
                : material.processing_status === "PROCESSING"
                  ? "Indexing..."
                  : material.processing_status}
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            {subtitlePrefix && <span>{subtitlePrefix} • </span>}
            {formatBytes(material.file_size_bytes)}
            {material.page_count ? ` • ${material.page_count} pages` : ""}
            {material.processing_status === "FAILED" &&
              material.error_message && (
                <span className="ml-2 text-red-600">
                  • {material.error_message}
                </span>
              )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onViewPdf(material)}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            View PDF
          </button>

          {topicCount > 0 && (
            <button
              type="button"
              onClick={() => onToggleOutline(material.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isExpanded
                  ? "bg-slate-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isExpanded ? "Hide Outline" : `Outline (${topicCount})`}
            </button>
          )}

          <button
            type="button"
            disabled={isRemoving}
            onClick={() => onRemove(material)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {removeLabel}
          </button>
        </div>
      </div>

      {/* Shared Expandable Outline */}
      {isExpanded && topicCount > 0 && (
        <div className="mt-3 max-h-64 space-y-3 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4">
          {material.extracted_topics.map((topic, idx) => (
            <div key={idx}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-gray-800">
                  {idx + 1}. {topic.title}
                </span>
                {topic.page && (
                  <span className="shrink-0 text-[11px] font-medium text-gray-400">
                    p.{topic.page}
                  </span>
                )}
              </div>

              {topic.subtopics?.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {topic.subtopics.map((sub, sIdx) => (
                    <span
                      key={sIdx}
                      className="rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-xs text-gray-600"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
