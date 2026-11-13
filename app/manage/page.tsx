"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LocalDrawInstance } from "@/types/draw";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { LocaleSelector } from "@/components/shared/LocaleSelector";
import { AdminSidebar } from "@/components/manage/AdminSidebar";
import { LOCALES, SupportedLocale } from "@/constants/locales";

interface OperatorRecord {
  id: string;
  email: string;
  role: string;
  login_count: number;
  draws_created_count: number;
  last_login_at: string | null;
}

export default function ManagePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userRole, setUserRole] = useState<"admin" | "operator" | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>("en");

  // Operator-only state
  const [draws, setDraws] = useState<LocalDrawInstance[]>([]);
  const [newDrawName, setNewDrawName] = useState("");

  // Admin-only state
  const [operators, setOperators] = useState<OperatorRecord[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [drawLogs, setDrawLogs] = useState<{ user_id: string; created_at: string }[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  useEffect(() => {
    const savedLocale = localStorage.getItem("tolo_locale") as SupportedLocale | null;
    if (savedLocale && LOCALES[savedLocale]) {
      setActiveLocale(savedLocale);
    }
  }, []);

  const handleLocaleChange = (newLocale: SupportedLocale) => {
    setActiveLocale(newLocale);
    localStorage.setItem("tolo_locale", newLocale);
  };

  const t = LOCALES[activeLocale];

  const loadOperatorsList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/operators");
      if (res.ok) {
        const data = await res.json();
        setOperators(data.operators || []);
        setDrawLogs(data.drawLogs || []);
      }
    } catch (err) {
      console.error("Failed to fetch operators:", err);
    }
  }, []);
  useEffect(() => {
    const initializeManagementHub = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUserEmail(user.email || "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = (profile?.role as "admin" | "operator") || "operator";
        setUserRole(role);

        if (role === "admin") {
          await loadOperatorsList();
        } else {
          const savedDraws = localStorage.getItem("tolo_active_draws");
          if (savedDraws) {
            setDraws(JSON.parse(savedDraws));
          }
        }
      } catch (err) {
        console.error("Workspace recovery exception:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeManagementHub();
  }, [supabase, router, loadOperatorsList]);

  const handleCreateDraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrawName.trim()) return;

    const newInstance: LocalDrawInstance = {
      id: crypto.randomUUID(),
      name: newDrawName.trim(),
      drawType: "Pending Dynamic Selection",
      createdAt: new Date().toLocaleDateString(),
    };

    const updatedDraws = [...draws, newInstance];
    setDraws(updatedDraws);
    localStorage.setItem("tolo_active_draws", JSON.stringify(updatedDraws));
    setNewDrawName("");

    fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "create-draw" }),
    }).catch((err) => console.error("Telemetry error:", err));
  };

  const handleDeleteDraw = (id: string) => {
    const updatedDraws = draws.filter((draw) => draw.id !== id);
    setDraws(updatedDraws);
    localStorage.setItem("tolo_active_draws", JSON.stringify(updatedDraws));

    localStorage.removeItem(`tolo_active_pool_${id}`);
    localStorage.removeItem(`tolo_history_pool_${id}`);
  };

  const handleDeleteOperator = async (operator: OperatorRecord) => {
    if (
      !window.confirm(
        `Permanently delete operator account "${operator.email}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(operator.id);
    try {
      const res = await fetch("/api/admin/operators", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: operator.id }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Failed to delete operator.");
        return;
      }

      setOperators((prev) => prev.filter((op) => op.id !== operator.id));
    } catch (err) {
      console.error("Delete operator failed:", err);
      alert("An unexpected error occurred while deleting the operator.");
    } finally {
      setDeletingId(null);
    }
  };
  const { availableMonths, availableQuarters, periodCountsByUser } = useMemo(() => {
    const monthsSet = new Set<string>();
    const quartersSet = new Set<string>();
    const counts: Record<string, number> = {};

    drawLogs.forEach((log) => {
      const date = new Date(log.created_at);
      if (isNaN(date.getTime())) return;

      const year = date.getUTCFullYear();
      const monthIdx = date.getUTCMonth();
      const monthKey = `M:${year}-${String(monthIdx + 1).padStart(2, "0")}`;
      const quarterKey = `Q:${year}-Q${Math.floor(monthIdx / 3) + 1}`;

      monthsSet.add(monthKey);
      quartersSet.add(quarterKey);

      const matchesFilter =
        selectedPeriod === "all" ||
        selectedPeriod === monthKey ||
        selectedPeriod === quarterKey;

      if (matchesFilter) {
        counts[log.user_id] = (counts[log.user_id] || 0) + 1;
      }
    });

    return {
      availableMonths: Array.from(monthsSet).sort((a, b) => b.localeCompare(a)),
      availableQuarters: Array.from(quartersSet).sort((a, b) => b.localeCompare(a)),
      periodCountsByUser: counts,
    };
  }, [drawLogs, selectedPeriod]);

  const formatPeriodLabel = (key: string) => {
    if (key === "all") return "All Time";
    if (key.startsWith("Q:")) return key.replace("Q:", "").replace("-", " ");
    if (key.startsWith("M:")) {
      const [year, month] = key.replace("M:", "").split("-");
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      return date.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    }
    return key;
  };

  const totalSystemDraws = operators.reduce(
    (sum, op) => sum + (op.draws_created_count || 0),
    0
  );

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm font-medium animate-pulse">
        Loading workspace...
      </div>
    );
  }

  return (
    <main className="w-screen min-h-screen lg:h-screen flex flex-col lg:flex-row bg-zinc-950 text-white font-sans overflow-y-auto lg:overflow-hidden">
      <AdminSidebar
        userRole={userRole}
        userEmail={userEmail}
        activeDrawsCount={draws.length}
        totalSystemDraws={totalSystemDraws}
        activeOperatorsCount={operators.length}
        onOperatorCreated={loadOperatorsList}
      />

      <section className="flex-1 min-w-0 flex flex-col lg:overflow-hidden">
        <header className="px-6 lg:px-8 py-4 border-b border-zinc-900 flex flex-wrap justify-between items-center gap-3 bg-zinc-950/80 shrink-0">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {userRole === "admin" ? t.systemAdmin : t.workspaceDirectory}
          </span>
          <div className="flex items-center gap-2">
            {userRole === "operator" && (
              <LocaleSelector value={activeLocale} onChange={handleLocaleChange} />
            )}
            <SignOutButton
              label={t.signOut}
              loadingLabel={t.signingOut}
              confirmMessage={
                userRole === "operator" && draws.length > 0
                  ? "Signing out will clear all active draw workspaces from browser memory. Continue?"
                  : undefined
              }
            />
          </div>
        </header>

        {userRole === "admin" ? (
          <div className="flex-1 p-6 lg:p-8 space-y-6 lg:overflow-y-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Operator Accounts & Usage
                </h2>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Manage operator credentials and filter draw activity by month or quarter.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Period:
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="all">All Time</option>
                  {availableQuarters.length > 0 && (
                    <optgroup label="Quarters">
                      {availableQuarters.map((q) => (
                        <option key={q} value={q}>
                          {formatPeriodLabel(q)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {availableMonths.length > 0 && (
                    <optgroup label="Months">
                      {availableMonths.map((m) => (
                        <option key={m} value={m}>
                          {formatPeriodLabel(m)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {operators.length === 0 ? (
              <div className="w-full h-[55vh] border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-zinc-900/5">
                <h3 className="text-base font-bold text-zinc-300">No operator accounts yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm mt-1">
                  Use the form in the left panel to create your first operator login.
                </p>
              </div>
            ) : (
              <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-x-auto shadow-2xl">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-zinc-900 text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="p-4">Operator Email</th>
                      <th className="p-4 text-center">Logins</th>
                      <th className="p-4 text-center">
                        Draws ({formatPeriodLabel(selectedPeriod)})
                      </th>
                      <th className="p-4 text-center">Lifetime Draws</th>
                      <th className="p-4">Last Login</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 font-medium">
                    {operators.map((op) => {
                      const periodDraws =
                        selectedPeriod === "all"
                          ? op.draws_created_count ?? 0
                          : periodCountsByUser[op.id] ?? 0;

                      return (
                        <tr key={op.id} className="hover:bg-zinc-900/30 transition-colors">
                          <td className="p-4 text-white font-mono text-xs">{op.email}</td>
                          <td className="p-4 text-center font-mono text-zinc-200">
                            {op.login_count ?? 0}
                          </td>
                          <td className="p-4 text-center font-mono text-amber-400 font-bold">
                            {periodDraws}
                          </td>
                          <td className="p-4 text-center font-mono text-zinc-400">
                            {op.draws_created_count ?? 0}
                          </td>
                          <td className="p-4 text-zinc-400 text-xs">
                            {op.last_login_at
                              ? new Date(op.last_login_at).toLocaleString()
                              : "Never"}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteOperator(op)}
                              disabled={deletingId === op.id}
                              className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/40 hover:bg-red-500/5 text-zinc-400 hover:text-red-400 disabled:opacity-40 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              {deletingId === op.id ? "Deleting..." : t.deleteBtn}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-6 lg:p-8 space-y-6 lg:overflow-y-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">{t.activeDrawsDir}</h2>
                <p className="text-sm text-zinc-400 mt-0.5">{t.activeDrawsSubtitle}</p>
              </div>

              <form onSubmit={handleCreateDraw} className="flex gap-2 w-full md:w-auto">
                <input
                  type="text"
                  required
                  value={newDrawName}
                  onChange={(e) => setNewDrawName(e.target.value)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl focus:outline-none text-sm text-white min-w-[220px] flex-1 md:flex-none"
                  placeholder={t.newDrawPlaceholder}
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-sm font-extrabold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t.createNewDraw}
                </button>
              </form>
            </div>

            {draws.length === 0 ? (
              <div className="w-full h-[55vh] border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-zinc-900/5">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 font-bold mb-3 border border-zinc-800">
                  0
                </div>
                <h3 className="text-base font-bold text-zinc-300">{t.noActiveDrawsTitle}</h3>
                <p className="text-xs text-zinc-500 max-w-sm mt-1">{t.noActiveDrawsDesc}</p>
              </div>
            ) : (
              <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-x-auto shadow-2xl">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-zinc-900 text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="p-4">{t.colDrawName}</th>
                      <th className="p-4">{t.colRoomId}</th>
                      <th className="p-4">{t.colCreated}</th>
                      <th className="p-4 text-center">{t.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 font-medium">
                    {draws.map((draw) => (
                      <tr key={draw.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="p-4 text-white font-bold">{draw.name}</td>
                        <td
                          className="p-4 text-zinc-500 font-mono text-xs max-w-[140px] truncate"
                          title={draw.id}
                        >
                          {draw.id}
                        </td>
                        <td className="p-4 text-zinc-400 text-xs whitespace-nowrap">
                          {draw.createdAt}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/dashboard/${draw.id}`)}
                              className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-amber-500/5 text-amber-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              {t.openWorkspace}
                            </button>
                            <button
                              onClick={() => handleDeleteDraw(draw.id)}
                              className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-500 hover:text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              {t.deleteBtn}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
