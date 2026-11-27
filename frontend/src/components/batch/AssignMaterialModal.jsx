import { useMemo, useState } from "react";
import {
  useAllReadyMaterials,
  useBatchMaterials,
  useAssignBatchMaterials,
} from "../../hooks/useBatchMaterials";

export default function AssignMaterialModal({ isOpen, onClose, batch }) {
  const [search, setSearch] = useState("");
  const [allClasses, setAllClasses] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const {
    data: allReady = [],
    isLoading,
    isFetching,
    refetch,
  } = useAllReadyMaterials(isOpen);
  const { data: assigned = [] } = useBatchMaterials(batch?.id);
  const {
    mutateAsync: assignMaterials,
    isPending,
    error,
  } = useAssignBatchMaterials(batch?.id);

  const grouped = useMemo(() => {
    const assignedSet = new Set(assigned.map((m) => m.id));
    const q = search.trim().toLowerCase();

    const filtered = allReady.filter((m) => {
      if (assignedSet.has(m.id)) return false;
      if (!allClasses && batch?.class_id && m.class_id !== batch.class_id) {
        return false;
      }
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.subject_name.toLowerCase().includes(q) ||
        m.chapter_name.toLowerCase().includes(q) ||
        m.class_name.toLowerCase().includes(q)
      );
    });

    const map = {};
    for (const mat of filtered) {
      const groupKey = `${mat.class_name} • ${mat.subject_name}`;
      if (!map[groupKey]) map[groupKey] = [];
      map[groupKey].push(mat);
    }
    return Object.entries(map);
  }, [allReady, assigned, allClasses, batch?.class_id, search]);

  if (!isOpen) return null;

  const toggleId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleClose = () => {
    setSelectedIds([]);
    setSearch("");
    onClose();
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0) return;
    await assignMaterials(selectedIds);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Assign Study Materials
            </h3>
            <p className="text-xs text-gray-500">
              Select indexed curriculum PDFs for {batch.name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Search, Class Filter & Refresh Bar */}
        <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/70 px-6 py-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, chapter, or subject..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-slate-900"
          />
          {batch.class_id && (
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
              <input
                type="checkbox"
                checked={allClasses}
                onChange={(e) => setAllClasses(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-slate-900"
              />
              Show all classes
            </label>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {error.message}
          </div>
        )}

        {/* Material List */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Loading curriculum materials...
            </p>
          ) : grouped.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-100 py-10 text-center text-sm text-gray-400">
              {search
                ? "No matching materials found."
                : "No unassigned AI-ready materials available."}
            </div>
          ) : (
            grouped.map(([groupLabel, items]) => (
              <div key={groupLabel}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {groupLabel}
                </p>
                <div className="space-y-2">
                  {items.map((mat) => {
                    const isChecked = selectedIds.includes(mat.id);
                    const topicCount = mat.extracted_topics?.length || 0;

                    return (
                      <label
                        key={mat.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          isChecked
                            ? "border-slate-900 bg-slate-50/70"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleId(mat.id)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-slate-900"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {mat.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {mat.chapter_number
                              ? `Ch. ${mat.chapter_number}: `
                              : ""}
                            {mat.chapter_name}
                            {mat.page_count ? ` • ${mat.page_count} pages` : ""}
                            {topicCount > 0 ? ` • ${topicCount} topics` : ""}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-6 py-3">
          <span className="text-xs font-medium text-gray-500">
            {selectedIds.length} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending || selectedIds.length === 0}
              onClick={handleAssign}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isPending ? "Assigning..." : `Assign (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
