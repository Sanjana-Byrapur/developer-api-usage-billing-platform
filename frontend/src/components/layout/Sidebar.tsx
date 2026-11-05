import Link from "next/link";
import {
  LayoutDashboard,
  Activity,
  Boxes,
  CreditCard,
  Receipt,
  KeyRound,
  Building2,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "API Usage Logs", href: "/usage", icon: Activity },
  { name: "API Management", href: "/apis", icon: Boxes },
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { name: "Billing & Invoices", href: "/billing", icon: Receipt },
  { name: "API Keys", href: "/api-keys", icon: KeyRound },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-6 py-6">
        <h1 className="text-xl font-bold">DevBill</h1>
        <p className="mt-1 text-xs text-slate-400">
          Developer API Platform
        </p>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-6">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-6 py-4 text-xs text-slate-500">
        Developer API Usage & Billing
      </div>
    </aside>
  );
}
