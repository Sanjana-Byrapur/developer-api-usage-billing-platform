type StatCardProps = {
  title: string;
  value: string;
  description: string;
};

export default function StatCard({
  title,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </h2>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}