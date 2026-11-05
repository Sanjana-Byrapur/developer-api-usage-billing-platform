"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-base-300 bg-base-100 text-base-content">
      {/* Logo */}
      <div className="border-b border-base-300 px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          DevBill<span className="text-secondary">.</span>
        </h1>
        <p className="mt-1 text-xs opacity-60">
          Developer API Platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider opacity-50">
          Workspace
        </p>

        {navigation.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-content shadow-sm"
                  : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
              }`}
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-base-300 px-6 py-4">
        <p className="text-xs opacity-60">
          Developer API Usage & Billing
        </p>
        <p className="mt-1 text-xs opacity-40">
          DevBill Platform
        </p>
      </div>
    </aside>
  );
}
