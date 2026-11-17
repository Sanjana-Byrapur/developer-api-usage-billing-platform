"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";

type Organization = { organization_id: number; name: string; created_at: string };
export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function load() {
    try { setOrganizations((await api.get("/organizations")).data.data); }
    catch (err: unknown) { setError(axios.isAxiosError(err) ? err.response?.data?.message || "Could not load organizations." : "Could not load organizations."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    api.get("/organizations").then(response => setOrganizations(response.data.data)).catch((err: unknown) => setError(axios.isAxiosError(err) ? err.response?.data?.message || "Could not load organizations." : "Could not load organizations.")).finally(() => setLoading(false));
  }, []);
  async function create(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    try { await api.post("/organizations", { name }); setName(""); setSuccess("Organization created. You are its owner."); await load(); }
    catch (err: unknown) { setError(axios.isAxiosError(err) ? err.response?.data?.message || "Could not create organization." : "Could not create organization."); }
    finally { setSaving(false); }
  }
  return <div className="space-y-7"><div><h1 className="text-2xl font-bold text-slate-900">Organizations</h1><p className="mt-2 text-sm text-slate-500">Manage organizations you can access.</p></div>
    <form onSubmit={create} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><label htmlFor="org-name" className="block font-semibold text-slate-900">Create organization</label><div className="mt-4 flex gap-3"><input id="org-name" value={name} onChange={e=>setName(e.target.value)} maxLength={150} required placeholder="Organization name" className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm"/><button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Creating..." : "Create"}</button></div></form>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}{success && <p role="status" className="text-sm text-green-700">{success}</p>}
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Your organizations</h2>{loading ? <p className="mt-4 text-sm text-slate-500">Loading organizations...</p> : organizations.length === 0 ? <p className="mt-4 text-sm text-slate-500">No organizations yet. Create one above.</p> : <ul className="mt-4 divide-y divide-slate-100">{organizations.map(org=><li key={org.organization_id} className="py-3 text-sm text-slate-700"><span className="font-medium">{org.name}</span> <span className="text-slate-400">(ID {org.organization_id})</span></li>)}</ul>}</section>
  </div>;
}
