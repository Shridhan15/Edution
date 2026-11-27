import { useState } from "react";
import {
  useBatchMaterials,
  useUnassignBatchMaterial,
} from "../../hooks/useBatchMaterials";
import AssignMaterialModal from "./AssignMaterialModal";
import PdfViewerModal from "../curriculum/PdfViewerModal";
import MaterialRow from "../curriculum/MaterialRow";

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BatchMaterialsSection({ batch }) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [expandedOutlineId, setExpandedOutlineId] = useState(null);

  const { data: materials = [], isLoading } = useBatchMaterials(batch.id);
  const { mutate: unassignMaterial, isPending: isRemoving } =
    useUnassignBatchMaterial(batch.id);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Assigned Study Materials ({materials.length})
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Tests generated for this batch will draw from these chapters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAssignOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
        >
          + Assign Material
        </button>
      </div>

      {isLoading ? (
        <p className="py-6 text-sm text-gray-400">
          Loading assigned materials...
        </p>
      ) : materials.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-100 py-10 text-center text-sm text-gray-500">
          No study materials assigned to this batch yet. Click "+ Assign
          Material" to pick from Curriculum.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {materials.map((mat) => (
            <MaterialRow
              key={mat.id}
              material={mat}
              badgeText={mat.subject_name}
              subtitlePrefix={
                mat.chapter_number
                  ? `Ch. ${mat.chapter_number}: ${mat.chapter_name}`
                  : mat.chapter_name
              }
              isExpanded={expandedOutlineId === mat.id}
              onToggleOutline={(id) =>
                setExpandedOutlineId((prev) => (prev === id ? null : id))
              }
              onViewPdf={setViewingMaterial}
              removeLabel="Remove"
              isRemoving={isRemoving}
              onRemove={(m) => unassignMaterial(m.id)}
            />
          ))}
        </div>
      )}

      <AssignMaterialModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        batch={batch}
      />

      <PdfViewerModal
        material={viewingMaterial}
        onClose={() => setViewingMaterial(null)}
      />
    </div>
  );
}
