export default function StatsGrid({
  totalStudents,
  activeStudents,
  totalClasses,
  totalSubjects,
}) {
  const inactiveStudents = totalStudents - activeStudents;

  const cards = [
    {
      label: "Total Students",
      value: totalStudents,
      subtext:
        inactiveStudents > 0
          ? `${activeStudents} active • ${inactiveStudents} inactive`
          : "All students active",
    },
    {
      label: "Active Classes",
      value: totalClasses,
      subtext: "Across your center",
    },
    {
      label: "Total Subjects",
      value: totalSubjects,
      subtext: "Structured in curriculum",
    },
    {
      label: "Today's Attendance",
      value: "—",
      subtext: "Attendance module coming soon",
      muted: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {card.label}
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${
              card.muted ? "text-gray-300" : "text-gray-900"
            }`}
          >
            {card.value}
          </p>
          <p className="mt-1 text-xs text-gray-500">{card.subtext}</p>
        </div>
      ))}
    </div>
  );
}
