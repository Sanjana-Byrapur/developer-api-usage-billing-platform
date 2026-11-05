"use client";

import { UserCircle, Sun, Moon, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type Theme = "lofi" | "dyingpromax";

export default function Navbar() {
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<Theme>("lofi");

  const router = useRouter();

  useEffect(() => {
    api
      .get("/auth/me")
      .then((response) => setName(response.data.data.name))
      .catch(() => {});
  }, []);

  // Restore saved theme when the component loads
  useEffect(() => {
    const savedTheme = localStorage.getItem("devbill-theme");

    if (savedTheme === "lofi" || savedTheme === "dyingpromax") {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  function toggleTheme() {
    const newTheme: Theme =
      theme === "lofi" ? "dyingpromax" : "lofi";

    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("devbill-theme", newTheme);
  }

  function handleSignOut() {
    localStorage.removeItem("token");
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-base-300 bg-base-100 px-8">
      {/* Welcome */}
      <div>
        <p className="text-sm font-medium opacity-60">
          Welcome back,
        </p>
        <p className="text-sm font-semibold text-base-content">
          {name || "Account"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-circle"
          aria-label={
            theme === "lofi"
              ? "Switch to dark theme"
              : "Switch to light theme"
          }
          title={
            theme === "lofi"
              ? "Switch to dark theme"
              : "Switch to light theme"
          }
        >
          {theme === "lofi" ? (
            <Moon size={19} />
          ) : (
            <Sun size={19} />
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <UserCircle size={27} className="opacity-70" />
          <span className="text-sm font-medium">
            {name || "Account"}
          </span>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="btn btn-ghost btn-sm gap-2 text-error"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </header>
  );
}
