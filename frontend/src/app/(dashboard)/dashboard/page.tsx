// import StatCard from "@/components/dashboard/StatCard";

// export default function DashboardPage() {
//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-2xl font-bold text-slate-900">
//           Dashboard
//         </h1>
//         <p className="mt-1 text-sm text-slate-500">
//           Overview of your API usage and billing activity.
//         </p>
//       </div>

//       <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
//         <StatCard
//           title="Total API Requests"
//           value="128,450"
//           description="Across all registered APIs"
//         />
//         <StatCard
//           title="Successful Requests"
//           value="124,820"
//           description="Successful responses"
//         />
//         <StatCard
//           title="Failed Requests"
//           value="3,630"
//           description="Failed responses"
//         />
//         <StatCard
//           title="Average Response Time"
//           value="142 ms"
//           description="Average API latency"
//         />
//       </div>

//       <div className="grid gap-5 lg:grid-cols-2">
//         <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
//           <h2 className="font-semibold text-slate-900">
//             API Usage Overview
//           </h2>
//           <p className="mt-2 text-sm text-slate-500">
//             Your API request trends will appear here.
//           </p>
//           <div className="mt-6 flex h-56 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
//             Usage chart coming next
//           </div>
//         </section>

//         <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
//           <h2 className="font-semibold text-slate-900">
//             Recent Activity
//           </h2>
//           <p className="mt-2 text-sm text-slate-500">
//             Your latest API events will appear here.
//           </p>
//           <div className="mt-6 flex h-56 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
//             Recent API activity coming next
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/dashboard/StatCard";
import api from "@/lib/api";
import axios from "axios";

type DashboardData = {
  organizations: number;
  apis: number;
  active_subscriptions: number;
  total_invoiced: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get("/dashboard");
        setData(response.data.data);
      } catch (err: unknown) {
        setError(
          (axios.isAxiosError(err) && err.response?.data?.message) ||
          "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <p className="text-slate-600">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Overview of your API usage and billing activity.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Organizations"
          value={data.organizations.toLocaleString()}
          description="Organizations you belong to"
        />

        <StatCard
          title="Registered APIs"
          value={data.apis.toLocaleString()}
          description="APIs available to you"
        />

        <StatCard
          title="Active Subscriptions"
          value={data.active_subscriptions.toLocaleString()}
          description="Currently active subscriptions"
        />

        <StatCard
          title="Total Invoiced"
          value={data.total_invoiced.toFixed(2)}
          description="Total invoice amount"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            API Usage Overview
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Request trends will appear here once usage events are recorded.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Recent Activity
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Recent API request events will appear here.
          </p>
        </section>
      </div>
    </div>
  );
}
