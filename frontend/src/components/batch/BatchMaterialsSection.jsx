import { useMemo, useState } from "react";
import {
  useBatchMaterials,
  useUnassignBatchMaterial,
} from "../../hooks/useBatchMaterials";
import AssignMaterialModal from "./AssignMaterialModal";
import PdfViewerModal from "../curriculum/PdfViewerModal";
import MaterialRow from "../curriculum/MaterialRow";

export default function BatchMaterialsSection({ batch }) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [expandedOutlineId, setExpandedOutlineId] = useState(null);

  const { data: materials = [], isLoading } = useBatchMaterials(batch.id);
  const { mutate: unassignMaterial, isPending: isRemoving } =
    useUnassignBatchMaterial(batch.id);

  // Group assigned materials by "Class • Subject" and sort chapters inside each group
  const groupedMaterials = useMemo(() => {
    const map = {};
    for (const mat of materials) {
      const groupKey = `${mat.class_name} • ${mat.subject_name}`;
      if (!map[groupKey]) map[groupKey] = [];
      map[groupKey].push(mat);
    }

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, items]) => [
        label,
        [...items].sort(
          (a, b) => (a.chapter_number ?? 999) - (b.chapter_number ?? 999),
        ),
      ]);
  }, [materials]);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
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
      ) : groupedMaterials.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-100 py-10 text-center text-sm text-gray-500">
          No study materials assigned to this batch yet. Click "+ Assign
          Material" to pick from Curriculum.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedMaterials.map(([groupLabel, items]) => (
            <div key={groupLabel}>
              {/* Class • Subject Group Header */}
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {groupLabel}
                </p>
                <span className="text-[11px] font-medium text-gray-400">
                  {items.length} {items.length === 1 ? "file" : "files"}
                </span>
              </div>

              {/* Grouped Materials Box */}
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 px-4 py-1">
                {items.map((mat) => (
                  <MaterialRow
                    key={mat.id}
                    material={mat}
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
            </div>
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
