import { useState } from "react";
import {
  useChapterMaterials,
  useDeleteMaterial,
} from "../../hooks/useMaterials";
import UploadMaterialModal from "./UploadMaterialModal";
import PdfViewerModal from "./PdfViewerModal";
import MaterialRow from "./MaterialRow";

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
          {materials.map((mat) => (
            <MaterialRow
              key={mat.id}
              material={mat}
              isExpanded={expandedOutlineId === mat.id}
              onToggleOutline={(id) =>
                setExpandedOutlineId((prev) => (prev === id ? null : id))
              }
              onViewPdf={setViewingMaterial}
              removeLabel="Delete"
              isRemoving={isDeleting}
              onRemove={(m) => {
                if (
                  window.confirm(
                    `Delete "${m.title}"? This also removes its AI index.`,
                  )
                ) {
                  removeMaterial(m.id);
                }
              }}
            />
          ))}
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
