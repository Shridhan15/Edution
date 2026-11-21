export default function StudentContactCard({ student }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
        Guardian & Contact
      </h2>

      <div className="space-y-4 text-sm">
        <div>
          <p className="text-gray-500">Parent / Guardian</p>
          <p className="font-medium text-gray-900 mt-0.5">
            {student.parent_name || "Not provided"}
          </p>
        </div>

        <div>
          <p className="text-gray-500">Phone Number</p>
          <p className="font-medium text-gray-900 mt-0.5">
            {student.parent_phone || "Not provided"}
          </p>
        </div>
      </div>
    </div>
  );
}
