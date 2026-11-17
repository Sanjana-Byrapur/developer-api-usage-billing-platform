import { Bell, UserCircle } from "lucide-react";

export default function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div>
        <p className="text-sm font-medium text-slate-500">
          Welcome back
        </p>
      </div>

      <div className="flex items-center gap-5">
        <button aria-label="Notifications">
          <Bell size={20} className="text-slate-600" />
        </button>

        <div className="flex items-center gap-2">
          <UserCircle size={28} className="text-slate-600" />
          <span className="text-sm font-medium text-slate-700">
            Admin
          </span>
        </div>
      </div>
    </header>
  );
}