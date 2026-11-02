
"use client";

import { useMemo, useState } from "react";
import {
  KeyRound,
  Plus,
  Search,
  Copy,
  Ban,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";

type ApiKey = {
  id: number;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: "Active" | "Revoked";
};

const initialKeys: ApiKey[] = [
  {
    id: 1,
    name: "Production Key",
    key: "sk_live_••••••••••••a82f",
    created: "2026-10-12",
    lastUsed: "2 minutes ago",
    status: "Active",
  },
  {
    id: 2,
    name: "Development Key",
    key: "sk_test_••••••••••••b91c",
    created: "2026-10-18",
    lastUsed: "1 hour ago",
    status: "Active",
  },
  {
    id: 3,
    name: "Testing Key",
    key: "sk_test_••••••••••••c73d",
    created: "2026-09-25",
    lastUsed: "Never",
    status: "Revoked",
  },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [newKeyName, setNewKeyName] = useState("");

  const filteredKeys = useMemo(() => {
    return keys.filter((key) => {
      const matchesSearch = key.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" || key.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [keys, search, filter]);

  const createKey = () => {
    if (!newKeyName.trim()) {
      alert("Please enter a name for the API key.");
      return;
    }

    const newKey: ApiKey = {
      id: Date.now(),
      name: newKeyName.trim(),
      key: "sk_demo_••••••••••••" +
        Math.random().toString(16).slice(2, 6),
      created: new Date().toISOString().slice(0, 10),
      lastUsed: "Never",
      status: "Active",
    };

    setKeys((previous) => [newKey, ...previous]);
    setNewKeyName("");
    alert("Demo API key created!");
  };

  const revokeKey = (id: number) => {
    if (!window.confirm("Are you sure you want to revoke this key?")) {
      return;
    }

    setKeys((previous) =>
      previous.map((key) =>
        key.id === id ? { ...key, status: "Revoked" } : key
      )
    );
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert("Masked key copied. This is demo data, not a usable API key.");
  };

  const activeCount = keys.filter(
    (key) => key.status === "Active"
  ).length;

  const revokedCount = keys.filter(
    (key) => key.status === "Revoked"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            API Key Management
          </h1>
          <p className="mt-2 text-slate-500">
            Create, view, and revoke API keys securely.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <ShieldCheck size={18} />
          Secure key management
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Total API Keys</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {keys.length}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Active Keys</p>
          <h2 className="mt-2 text-2xl font-bold text-green-600">
            {activeCount}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Revoked Keys</p>
          <h2 className="mt-2 text-2xl font-bold text-red-600">
            {revokedCount}
          </h2>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Create New API Key
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Enter API key name"
            className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
          />

          <button
            onClick={createKey}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Create API Key
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row">
          <h2 className="text-lg font-semibold text-slate-900">
            Your API Keys
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search keys..."
                className="w-full rounded-lg border py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 sm:w-52"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
            >
              <option value="All">All Keys</option>
              <option value="Active">Active</option>
              <option value="Revoked">Revoked</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-medium">Key Name</th>
                <th className="px-4 py-3 font-medium">API Key</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Last Used</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredKeys.map((key) => (
                <tr key={key.id} className="border-b last:border-0">
                  <td className="px-4 py-4 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      <KeyRound size={16} className="text-blue-600" />
                      {key.name}
                    </div>
                  </td>

                  <td className="px-4 py-4 font-mono text-slate-600">
                    <div className="flex items-center gap-2">
                      {key.key}
                      <button
                        onClick={() => copyKey(key.key)}
                        title="Copy masked key"
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {key.created}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {key.lastUsed}
                  </td>

                  <td className="px-4 py-4">
                    {key.status === "Active" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        <CheckCircle size={13} />
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                        Revoked
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {key.status === "Active" && (
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800"
                      >
                        <Ban size={15} />
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredKeys.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No API keys found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Demo only: these are mock keys. Real key generation, secure storage,
        and revocation must be handled by the backend.
      </p>
    </div>
  );
}
