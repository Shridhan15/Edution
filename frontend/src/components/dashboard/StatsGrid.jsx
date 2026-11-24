export default function StatsGrid({
  totalStudents,
  activeStudents,
  totalClasses,
  totalSubjects,
  totalBatches,
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
      label: "Active Batches",
      value: totalBatches,
      subtext: "Scheduled time slots",
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
          <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
          <p className="mt-1 text-xs text-gray-500">{card.subtext}</p>
        </div>
      ))}
    </div>
  );
}
