"use client";
import { UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function Navbar() {
  const [name,setName]=useState("");
  const router=useRouter();
  useEffect(()=>{api.get("/auth/me").then(r=>setName(r.data.data.name)).catch(()=>{});},[]);
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Welcome back
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <UserCircle size={28} className="text-slate-600" />
          <span className="text-sm font-medium text-slate-700">
            {name || "Account"}
          </span>
        </div>
        <button className="text-sm text-slate-600" onClick={()=>{localStorage.removeItem("token");router.push("/");}}>Sign out</button>
      </div>
    </header>
  );
}
