
"use client"; // Original demo layout retained for reference.

import { useState } from "react";
import {
  Search,
  Boxes,
  Activity,
} from "lucide-react";

type Api = {
  id: number;
  name: string;
  description: string;
  baseUrl: string;
  version: string;
  method: string;
  requests: number;
  rateLimit: string;
  status: "Active" | "Inactive";
};

const apis: Api[] = [
  {
    id: 1,
    name: "Payment API",
    description: "Handles payment processing and refunds.",
    baseUrl: "/api/v1/payments",
    version: "v1.0",
    method: "POST",
    requests: 45280,
    rateLimit: "1,000 req/min",
    status: "Active",
  },
  {
    id: 2,
    name: "User API",
    description: "Manages user accounts and authentication.",
    baseUrl: "/api/v1/users",
    version: "v1.0",
    method: "GET",
    requests: 38450,
    rateLimit: "800 req/min",
    status: "Active",
  },
  {
    id: 3,
    name: "Weather API",
    description: "Provides current weather and forecast data.",
    baseUrl: "/api/v1/weather",
    version: "v2.1",
    method: "GET",
    requests: 28720,
    rateLimit: "500 req/min",
    status: "Active",
  },
  {
    id: 4,
    name: "Notification API",
    description: "Sends email and push notifications.",
    baseUrl: "/api/v1/notifications",
    version: "v1.2",
    method: "POST",
    requests: 12000,
    rateLimit: "300 req/min",
    status: "Inactive",
  },
  {
    id: 5,
    name: "Analytics API",
    description: "Provides application analytics and reports.",
    baseUrl: "/api/v1/analytics",
    version: "v1.0",
    method: "GET",
    requests: 8400,
    rateLimit: "200 req/min",
    status: "Active",
  },
];

export default function ApisPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredApis = apis.filter((api) => {
    const matchesSearch =
      api.name.toLowerCase().includes(search.toLowerCase()) ||
      api.description.toLowerCase().includes(search.toLowerCase()) ||
      api.baseUrl.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || api.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeApis = apis.filter((api) => api.status === "Active").length;
  const totalRequests = apis.reduce((sum, api) => sum + api.requests, 0);

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <div>
        <div className="flex items-center gap-2">
          <Boxes className="text-blue-600" size={25} />
          <h1 className="text-2xl font-bold text-slate-900">
            API Management
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          View and monitor the APIs registered on your platform.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total APIs</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {apis.length}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Registered APIs
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active APIs</p>
          <h2 className="mt-2 text-2xl font-bold text-green-600">
            {activeApis}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Currently active
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Requests</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {totalRequests.toLocaleString()}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Sample request count
          </p>
        </div>
      </div>

      {/* API list */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            Registered APIs
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Overview of available APIs and their configurations.
          </p>

          {/* Search and filter */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search APIs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* API cards */}
        <div className="divide-y divide-slate-100">
          {filteredApis.map((api) => (
            <div
              key={api.id}
              className="p-5 transition hover:bg-slate-50"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Boxes size={21} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {api.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          api.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {api.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {api.description}
                    </p>

                    <p className="mt-2 font-mono text-xs text-slate-500">
                      {api.baseUrl}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:min-w-[420px]">
                  <div>
                    <p className="text-xs text-slate-400">Version</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {api.version}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Method</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {api.method}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Requests</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {api.requests.toLocaleString()}
                    </p>
                  </div>

                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-xs text-slate-400">Rate Limit</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {api.rateLimit}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredApis.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-slate-500">
              No APIs match your search or selected filter.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500">
            Showing {filteredApis.length} of {apis.length} APIs
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity size={15} />
            API registry overview
          </div>
        </div>
      </div>
    </div>
  );
}
