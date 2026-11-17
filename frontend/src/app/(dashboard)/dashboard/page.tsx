import StatCard from "@/components/dashboard/StatCard";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of your API usage and billing activity.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total API Requests"
          value="128,450"
          description="Across all registered APIs"
        />
        <StatCard
          title="Successful Requests"
          value="124,820"
          description="Successful responses"
        />
        <StatCard
          title="Failed Requests"
          value="3,630"
          description="Failed responses"
        />
        <StatCard
          title="Average Response Time"
          value="142 ms"
          description="Average API latency"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            API Usage Overview
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your API request trends will appear here.
          </p>
          <div className="mt-6 flex h-56 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
            Usage chart coming next
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Recent Activity
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your latest API events will appear here.
          </p>
          <div className="mt-6 flex h-56 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
            Recent API activity coming next
          </div>
        </section>
      </div>
    </div>
  );
}