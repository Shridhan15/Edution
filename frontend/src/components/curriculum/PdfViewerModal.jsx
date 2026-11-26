export default function PdfViewerModal({ material, onClose }) {
  if (!material) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {material.title}
            </h3>
            <p className="text-xs text-gray-500">
              {material.file_name}
              {material.page_count ? ` • ${material.page_count} pages` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={material.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Open in New Tab
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewer */}
        <div className="flex-1 bg-gray-100">
          <iframe
            src={material.file_url}
            title={material.title}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
