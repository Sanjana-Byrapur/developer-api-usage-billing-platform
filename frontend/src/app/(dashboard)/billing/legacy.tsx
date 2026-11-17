
"use client"; // Original demo layout retained for reference.

import { useState } from "react";
import {
  Receipt,
  Search,
  Eye,
  IndianRupee,
  CircleCheck,
  Clock,
  AlertCircle,
} from "lucide-react";

type Invoice = {
  id: string;
  organization: string;
  date: string;
  dueDate: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  paymentMethod: string;
};

const invoices: Invoice[] = [
  {
    id: "INV-2026-001",
    organization: "Acme Technologies",
    date: "2026-10-01",
    dueDate: "2026-10-10",
    amount: 4900,
    status: "Paid",
    paymentMethod: "UPI",
  },
  {
    id: "INV-2026-002",
    organization: "CloudNova Solutions",
    date: "2026-10-15",
    dueDate: "2026-11-05",
    amount: 19900,
    status: "Pending",
    paymentMethod: "Credit Card",
  },
  {
    id: "INV-2026-003",
    organization: "Pixel Labs",
    date: "2026-09-01",
    dueDate: "2026-09-10",
    amount: 1900,
    status: "Overdue",
    paymentMethod: "Bank Transfer",
  },
  {
    id: "INV-2026-004",
    organization: "NextGen Systems",
    date: "2026-10-05",
    dueDate: "2026-10-15",
    amount: 4900,
    status: "Paid",
    paymentMethod: "UPI",
  },
  {
    id: "INV-2026-005",
    organization: "DataBridge Inc.",
    date: "2026-10-10",
    dueDate: "2026-11-10",
    amount: 1900,
    status: "Pending",
    paymentMethod: "Credit Card",
  },
  {
    id: "INV-2026-006",
    organization: "Acme Technologies",
    date: "2026-09-01",
    dueDate: "2026-09-10",
    amount: 4200,
    status: "Paid",
    paymentMethod: "UPI",
  },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function BillingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(search.toLowerCase()) ||
      invoice.organization.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalBilled = invoices.reduce(
    (sum, invoice) => sum + invoice.amount,
    0
  );

  const totalPaid = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const totalPending = invoices
    .filter(
      (invoice) =>
        invoice.status === "Pending" || invoice.status === "Overdue"
    )
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const paidCount = invoices.filter(
    (invoice) => invoice.status === "Paid"
  ).length;

  const getStatusStyle = (status: Invoice["status"]) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-amber-100 text-amber-700";
      case "Overdue":
        return "bg-red-100 text-red-700";
    }
  };

  const getStatusIcon = (status: Invoice["status"]) => {
    switch (status) {
      case "Paid":
        return <CircleCheck size={14} />;
      case "Pending":
        return <Clock size={14} />;
      case "Overdue":
        return <AlertCircle size={14} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <div className="flex items-center gap-2">
          <Receipt className="text-blue-600" size={25} />
          <h1 className="text-2xl font-bold text-slate-900">
            Billing & Invoices
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Track API expenses, monitor payments, and manage invoices.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Billed</p>
            <IndianRupee size={19} className="text-blue-600" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(totalBilled)}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Across all sample invoices
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Paid</p>
            <CircleCheck size={19} className="text-green-600" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-green-600">
            {formatCurrency(totalPaid)}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {paidCount} paid invoices
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Pending Amount</p>
            <Clock size={19} className="text-amber-600" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-amber-600">
            {formatCurrency(totalPending)}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Pending and overdue invoices
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Invoices</p>
            <Receipt size={19} className="text-purple-600" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            {invoices.length}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Generated invoices
          </p>
        </div>
      </div>

      {/* Invoice table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">
            Invoice History
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            View and track invoices generated for API usage.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search invoice ID or organization..."
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
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Invoice ID</th>
                <th className="px-5 py-4 font-semibold">Organization</th>
                <th className="px-5 py-4 font-semibold">Invoice Date</th>
                <th className="px-5 py-4 font-semibold">Due Date</th>
                <th className="px-5 py-4 font-semibold">Amount</th>
                <th className="px-5 py-4 font-semibold">Payment Method</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-blue-600">
                    {invoice.id}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                    {invoice.organization}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {invoice.date}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {invoice.dueDate}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                    {formatCurrency(invoice.amount)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {invoice.paymentMethod}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(invoice.status)}`}
                    >
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        alert(`Invoice details for ${invoice.id}`)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No invoices match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </p>
        </div>
      </section>
    </div>
  );
}
