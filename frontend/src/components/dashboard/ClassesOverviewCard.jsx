import { Link, useNavigate } from "react-router-dom";

export default function ClassesOverviewCard({ classes }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Classes Overview
        </h2>
        <Link
          to="/curriculum"
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          View All &rarr;
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-100 py-10 text-center">
          <p className="text-sm text-gray-500">No classes created yet.</p>
          <Link
            to="/curriculum"
            className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
          >
            + Create your first class
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {classes.map((cls) => (
            <div
              key={cls.id}
              onClick={() => navigate(`/curriculum/${cls.id}`)}
              className="group flex cursor-pointer items-center justify-between py-3.5 transition-colors hover:bg-gray-50/70 -mx-2 px-2 rounded-lg"
            >
              <div>
                <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {cls.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {cls.subject_count}{" "}
                  {cls.subject_count === 1 ? "Subject" : "Subjects"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {cls.student_count}{" "}
                  {cls.student_count === 1 ? "Student" : "Students"}
                </span>
                <span className="text-gray-300 group-hover:text-blue-500 transition-colors">
                  &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
