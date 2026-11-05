
"use client"; // Original demo layout retained for reference.

import { useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Activity } from "lucide-react";

type ApiLog = {
  id: string;
  api: string;
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  timestamp: string;
};

const logs: ApiLog[] = [
  { id: "REQ-1001", api: "Payment API", endpoint: "/payments", method: "POST", status: 200, responseTime: 145, timestamp: "2026-11-02 10:30:15" },
  { id: "REQ-1002", api: "User API", endpoint: "/users/profile", method: "GET", status: 200, responseTime: 82, timestamp: "2026-11-02 10:28:42" },
  { id: "REQ-1003", api: "Payment API", endpoint: "/payments/refund", method: "POST", status: 500, responseTime: 850, timestamp: "2026-11-02 10:25:10" },
  { id: "REQ-1004", api: "Weather API", endpoint: "/weather/current", method: "GET", status: 200, responseTime: 112, timestamp: "2026-11-02 10:20:05" },
  { id: "REQ-1005", api: "User API", endpoint: "/users/login", method: "POST", status: 401, responseTime: 65, timestamp: "2026-11-02 10:15:33" },
  { id: "REQ-1006", api: "Payment API", endpoint: "/payments/history", method: "GET", status: 200, responseTime: 178, timestamp: "2026-11-02 10:12:18" },
  { id: "REQ-1007", api: "Weather API", endpoint: "/weather/forecast", method: "GET", status: 503, responseTime: 920, timestamp: "2026-11-02 10:08:51" },
  { id: "REQ-1008", api: "User API", endpoint: "/users", method: "GET", status: 200, responseTime: 96, timestamp: "2026-11-02 10:02:07" },
];

const PAGE_SIZE = 5;

export default function UsagePage() {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.id.toLowerCase().includes(search.toLowerCase()) ||
      log.api.toLowerCase().includes(search.toLowerCase()) ||
      log.endpoint.toLowerCase().includes(search.toLowerCase());

    const matchesMethod =
      methodFilter === "All" || log.method === methodFilter;

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Success" && log.status >= 200 && log.status < 300) ||
      (statusFilter === "Failed" && log.status >= 400);

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + PAGE_SIZE);

  const successfulRequests = logs.filter(
    (log) => log.status >= 200 && log.status < 300
  ).length;

  const failedRequests = logs.length - successfulRequests;

  function resetFilters() {
    setSearch("");
    setMethodFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
  }

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <div>
        <div className="flex items-center gap-2">
          <Activity className="text-blue-600" size={25} />
          <h1 className="text-2xl font-bold text-slate-900">
            API Usage Logs
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Monitor, search, and analyse your API requests.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Requests</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {logs.length}
          </h2>
          <p className="mt-1 text-xs text-slate-400">Sample log records</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Successful Requests</p>
          <h2 className="mt-2 text-2xl font-bold text-green-600">
            {successfulRequests}
          </h2>
          <p className="mt-1 text-xs text-slate-400">2xx responses</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Failed Requests</p>
          <h2 className="mt-2 text-2xl font-bold text-red-600">
            {failedRequests}
          </h2>
          <p className="mt-1 text-xs text-slate-400">4xx and 5xx responses</p>
        </div>
      </div>

      {/* Logs table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-slate-900">
                Request History
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Detailed records of API activity
              </p>
            </div>

            <button
              onClick={resetFilters}
              className="self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>

          {/* Search and filters */}
          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search API, endpoint or request ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={17} className="text-slate-400" />

              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="All">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Request ID</th>
                <th className="px-5 py-4 font-semibold">API</th>
                <th className="px-5 py-4 font-semibold">Endpoint</th>
                <th className="px-5 py-4 font-semibold">Method</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Response Time</th>
                <th className="px-5 py-4 font-semibold">Timestamp</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-blue-600">
                    {log.id}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                    {log.api}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {log.endpoint}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {log.method}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        log.status >= 200 && log.status < 300
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.status}{" "}
                      {log.status >= 200 && log.status < 300
                        ? "Success"
                        : "Failed"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {log.responseTime} ms
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                    {log.timestamp}
                  </td>
                </tr>
              ))}

              {currentLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No API logs match your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row">
          <p className="text-xs text-slate-500">
            Showing {filteredLogs.length === 0 ? 0 : startIndex + 1}–
            {Math.min(startIndex + PAGE_SIZE, filteredLogs.length)} of{" "}
            {filteredLogs.length} requests
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
