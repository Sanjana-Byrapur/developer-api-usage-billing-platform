
"use client";

import { useState } from "react";
import {
  CreditCard,
  Check,
  CalendarDays,
  Zap,
  Search,
} from "lucide-react";

type Subscription = {
  id: number;
  organization: string;
  plan: string;
  price: number;
  billingCycle: string;
  requestLimit: number;
  requestsUsed: number;
  startDate: string;
  renewalDate: string;
  status: "Active" | "Expired" | "Cancelled";
};

const subscriptions: Subscription[] = [
  {
    id: 1,
    organization: "Acme Technologies",
    plan: "Pro",
    price: 49,
    billingCycle: "Monthly",
    requestLimit: 100000,
    requestsUsed: 68450,
    startDate: "2026-10-01",
    renewalDate: "2026-11-01",
    status: "Active",
  },
  {
    id: 2,
    organization: "CloudNova Solutions",
    plan: "Enterprise",
    price: 199,
    billingCycle: "Monthly",
    requestLimit: 500000,
    requestsUsed: 324000,
    startDate: "2026-10-15",
    renewalDate: "2026-11-15",
    status: "Active",
  },
  {
    id: 3,
    organization: "Pixel Labs",
    plan: "Basic",
    price: 19,
    billingCycle: "Monthly",
    requestLimit: 25000,
    requestsUsed: 22000,
    startDate: "2026-09-01",
    renewalDate: "2026-10-01",
    status: "Expired",
  },
  {
    id: 4,
    organization: "NextGen Systems",
    plan: "Pro",
    price: 49,
    billingCycle: "Monthly",
    requestLimit: 100000,
    requestsUsed: 45000,
    startDate: "2026-10-05",
    renewalDate: "2026-11-05",
    status: "Active",
  },
  {
    id: 5,
    organization: "DataBridge Inc.",
    plan: "Basic",
    price: 19,
    billingCycle: "Monthly",
    requestLimit: 25000,
    requestsUsed: 12000,
    startDate: "2026-10-10",
    renewalDate: "2026-11-10",
    status: "Cancelled",
  },
];

const plans = [
  {
    name: "Basic",
    price: 19,
    requests: "25,000",
    features: [
      "25,000 API requests/month",
      "Basic usage analytics",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: 49,
    requests: "100,000",
    features: [
      "100,000 API requests/month",
      "Advanced usage analytics",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: 199,
    requests: "500,000",
    features: [
      "500,000 API requests/month",
      "Detailed analytics",
      "Dedicated support",
    ],
  },
];

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.organization.toLowerCase().includes(search.toLowerCase()) ||
      sub.plan.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = subscriptions.filter(
    (sub) => sub.status === "Active"
  ).length;

  const monthlyRevenue = subscriptions
    .filter((sub) => sub.status === "Active")
    .reduce((sum, sub) => sum + sub.price, 0);

  const totalRequestsUsed = subscriptions.reduce(
    (sum, sub) => sum + sub.requestsUsed,
    0
  );

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-2">
          <CreditCard className="text-blue-600" size={25} />
          <h1 className="text-2xl font-bold text-slate-900">
            Subscriptions
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Manage subscription plans, billing cycles, and API usage limits.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Subscriptions</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {subscriptions.length}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Across all organizations
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Subscriptions</p>
          <h2 className="mt-2 text-2xl font-bold text-green-600">
            {activeCount}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Currently active plans
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Monthly Revenue</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            ${monthlyRevenue.toLocaleString()}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            From active sample subscriptions
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Requests Used</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {totalRequestsUsed.toLocaleString()}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Combined sample usage
          </p>
        </div>
      </div>

      {/* Pricing plans */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Available Pricing Plans
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Compare the subscription plans offered by the platform.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border bg-white p-6 shadow-sm ${
                plan.name === "Pro"
                  ? "border-blue-400 ring-1 ring-blue-100"
                  : "border-slate-200"
              }`}
            >
              {plan.name === "Pro" && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Popular Plan
                </span>
              )}

              <h3 className="mt-3 text-lg font-semibold text-slate-900">
                {plan.name}
              </h3>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">
                  ${plan.price}
                </span>
                <span className="text-sm text-slate-500">/month</span>
              </div>

              <div className="mt-5 rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Zap size={16} className="text-blue-600" />
                  {plan.requests} requests/month
                </div>
              </div>

              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <Check size={16} className="text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription records */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            Subscription Records
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            View subscription details for each organization.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search organization or plan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Organization</th>
                <th className="px-5 py-4 font-semibold">Plan</th>
                <th className="px-5 py-4 font-semibold">Price</th>
                <th className="px-5 py-4 font-semibold">Usage</th>
                <th className="px-5 py-4 font-semibold">Renewal Date</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredSubscriptions.map((sub) => {
                const usagePercent = Math.min(
                  (sub.requestsUsed / sub.requestLimit) * 100,
                  100
                );

                return (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                      {sub.organization}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {sub.plan}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                      ${sub.price}/{sub.billingCycle === "Monthly" ? "mo" : "yr"}
                    </td>

                    <td className="min-w-48 px-5 py-4">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{sub.requestsUsed.toLocaleString()}</span>
                        <span>{usagePercent.toFixed(0)}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        of {sub.requestLimit.toLocaleString()} requests
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      <span className="flex items-center gap-2">
                        <CalendarDays size={15} />
                        {sub.renewalDate}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          sub.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : sub.status === "Expired"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredSubscriptions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No subscriptions match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500">
            Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
          </p>
        </div>
      </section>
    </div>
  );
}
