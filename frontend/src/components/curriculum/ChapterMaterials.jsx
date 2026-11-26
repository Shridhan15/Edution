import { useState } from "react";
import {
  useChapterMaterials,
  useDeleteMaterial,
} from "../../hooks/useMaterials";
import UploadMaterialModal from "./UploadMaterialModal";
import PdfViewerModal from "./PdfViewerModal";

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

export default function ChapterMaterials({ chapterId, chapterName }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [expandedOutlineId, setExpandedOutlineId] = useState(null);

  const { data: materials = [], isLoading } = useChapterMaterials(chapterId);
  const { mutate: removeMaterial, isPending: isDeleting } =
    useDeleteMaterial(chapterId);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Study Materials ({materials.length})
        </span>
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
        >
          + Upload PDF
        </button>
      </div>

      {isLoading ? (
        <p className="py-3 text-xs text-gray-400">Loading materials...</p>
      ) : materials.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400">
          No PDFs uploaded for this chapter yet.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {materials.map((mat) => {
            const isExpanded = expandedOutlineId === mat.id;
            const topicCount = mat.extracted_topics?.length || 0;

            return (
              <div key={mat.id} className="py-3 first:pt-1 last:pb-1">
                {/* Wide Single-Row Material Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setViewingMaterial(mat)}
                        className="text-left text-sm font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {mat.title}
                      </button>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          STATUS_BADGE[mat.processing_status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {mat.processing_status === "READY"
                          ? "AI Ready"
                          : mat.processing_status === "PROCESSING"
                            ? "Indexing..."
                            : mat.processing_status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatBytes(mat.file_size_bytes)}
                      {mat.page_count ? ` • ${mat.page_count} pages` : ""}
                      {mat.processing_status === "FAILED" &&
                        mat.error_message && (
                          <span className="ml-2 text-red-600">
                            • {mat.error_message}
                          </span>
                        )}
                    </p>
                  </div>

                  {/* Right-Aligned Inline Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingMaterial(mat)}
                      className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      View PDF
                    </button>

                    {topicCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOutlineId(isExpanded ? null : mat.id)
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          isExpanded
                            ? "bg-slate-900 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {isExpanded
                          ? "Hide Outline"
                          : `Outline (${topicCount})`}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete "${mat.title}"? This also removes its AI index.`,
                          )
                        ) {
                          removeMaterial(mat.id);
                        }
                      }}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Full-Width Scrollable Outline */}
                {isExpanded && topicCount > 0 && (
                  <div className="mt-3 max-h-64 space-y-3 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4">
                    {mat.extracted_topics.map((topic, idx) => (
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
          })}
        </div>
      )}

      <UploadMaterialModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        chapterId={chapterId}
        chapterName={chapterName}
      />

      <PdfViewerModal
        material={viewingMaterial}
        onClose={() => setViewingMaterial(null)}
      />
    </div>
  );
}
