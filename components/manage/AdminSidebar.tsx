"use client";

import { useState } from "react";

interface AdminSidebarProps {
  userRole: "admin" | "operator" | null;
  userEmail: string;
  activeDrawsCount: number;
  totalSystemDraws: number;
  activeOperatorsCount: number;
  onOperatorCreated: () => void;
}

export function AdminSidebar({
  userRole,
  userEmail,
  activeDrawsCount,
  totalSystemDraws,
  activeOperatorsCount,
  onOperatorCreated,
}: AdminSidebarProps) {
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [provisionStatus, setProvisionStatus] = useState<{
    type: "success" | "error" | "loading";
    message: string;
  } | null>(null);

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionStatus({ type: "loading", message: "Creating operator account..." });

    try {
      const response = await fetch("/api/admin/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          password: newUserPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create operator account.");
      }

      setProvisionStatus({
        type: "success",
        message: `Operator account created for ${newUserEmail.trim()}.`,
      });
      setNewUserEmail("");
      setNewUserPassword("");
      onOperatorCreated();
    } catch (err: any) {
      setProvisionStatus({
        type: "error",
        message: err?.message || "Failed to create operator account.",
      });
    }
  };

  return (
    <aside className="w-full lg:w-72 p-5 sm:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-zinc-900 bg-zinc-900/20 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Brand & User Identity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-black tracking-tight text-amber-400">
              EVENT CONTROL HUB
            </h1>
            {userRole && (
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {userRole}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 font-mono truncate" title={userEmail}>
            {userEmail}
          </p>
        </div>

        {/* Role-Specific Console */}
        {userRole === "admin" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl">
                <span className="block text-2xl font-black text-white font-mono">
                  {totalSystemDraws}
                </span>
                <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider mt-1">
                  Total Draws Created
                </span>
              </div>
              <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl">
                <span className="block text-2xl font-black text-amber-400 font-mono">
                  {activeOperatorsCount}
                </span>
                <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider mt-1">
                  Operators
                </span>
              </div>
            </div>

            <form
              onSubmit={handleProvisionUser}
              className="bg-zinc-950/60 p-5 border border-zinc-800/80 rounded-2xl space-y-3"
            >
              <div>
                <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Add Operator Account
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Create confirmed credentials for event hosts.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-mono text-white"
                  placeholder="operator@domain.com"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-mono text-white"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <button
                type="submit"
                disabled={provisionStatus?.type === "loading"}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-bold rounded-xl transition-colors cursor-pointer text-white"
              >
                {provisionStatus?.type === "loading" ? "Creating..." : "Create Operator"}
              </button>

              {provisionStatus && (
                <p
                  className={`text-[11px] p-2.5 rounded-xl border leading-normal ${
                    provisionStatus.type === "error"
                      ? "text-red-400 bg-red-500/5 border-red-500/20"
                      : "text-amber-400 bg-amber-500/5 border-amber-500/20"
                  }`}
                >
                  {provisionStatus.message}
                </p>
              )}
            </form>
          </div>
        ) : (
          <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-medium">Active Draws</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {activeDrawsCount}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
