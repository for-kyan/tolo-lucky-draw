"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LocalDrawInstance } from "@/types/draw";
import { SignOutButton } from "@/components/shared/SignOutButton";
import { AdminSidebar } from "@/components/manage/AdminSidebar";

export default function ManagePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userRole, setUserRole] = useState<"admin" | "operator" | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [draws, setDraws] = useState<LocalDrawInstance[]>([]);
  const [newDrawName, setNewDrawName] = useState("");

  const [totalSystemDraws, setTotalSystemDraws] = useState<number>(0);
  const [activeOperatorsCount, setActiveOperatorsCount] = useState<number>(0);

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

        const savedDraws = localStorage.getItem("tolo_active_draws");
        if (savedDraws) {
          setDraws(JSON.parse(savedDraws));
        }

        if (role === "admin") {
          const [{ count: drawsCount }, { count: opsCount }] = await Promise.all([
            supabase.from("draw_usage_stats").select("*", { count: "exact", head: true }),
            supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("role", "operator"),
          ]);

          setTotalSystemDraws(drawsCount || 0);
          setActiveOperatorsCount(opsCount || 0);
        }
      } catch (err) {
        console.error("Workspace recovery exception:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeManagementHub();
  }, [supabase, router]);

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
  };

  const handleDeleteDraw = (id: string) => {
    const updatedDraws = draws.filter((draw) => draw.id !== id);
    setDraws(updatedDraws);
    localStorage.setItem("tolo_active_draws", JSON.stringify(updatedDraws));

    localStorage.removeItem(`tolo_active_pool_${id}`);
    localStorage.removeItem(`tolo_history_pool_${id}`);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm font-medium animate-pulse">
        Loading workspace...
      </div>
    );
  }

  return (
    <main className="w-screen h-screen flex bg-zinc-950 text-white font-sans overflow-hidden">
      {/* LEFT SIDEBAR CONSOLE */}
      <AdminSidebar
        userRole={userRole}
        userEmail={userEmail}
        activeDrawsCount={draws.length}
        totalSystemDraws={totalSystemDraws}
        activeOperatorsCount={activeOperatorsCount}
        onOperatorCreated={() => setActiveOperatorsCount((prev) => prev + 1)}
      />

      {/* MAIN WORKSPACE AREA */}
      <section className="flex-1 flex flex-col overflow-hidden">
        {/* TOP UTILITY HEADER (Logout Button Outside Side Pane) */}
        <header className="px-8 py-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/80 shrink-0">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Workspace Directory
          </span>
          <SignOutButton
            confirmMessage={
              draws.length > 0
                ? "Signing out will clear all active draw workspaces from browser memory. Continue?"
                : undefined
            }
          />
        </header>

        {/* SCROLLABLE DIRECTORY CONTENT */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Active Draws Directory</h2>
              <p className="text-sm text-zinc-400 mt-0.5">
                Create a raffle workspace below to configure entries and launch the display screen.
              </p>
            </div>

            <form onSubmit={handleCreateDraw} className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                required
                value={newDrawName}
                onChange={(e) => setNewDrawName(e.target.value)}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl focus:outline-none text-sm text-white min-w-[260px] flex-1 md:flex-none"
                placeholder="e.g. Corporate Gala Draw"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-sm font-extrabold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Create New Draw
              </button>
            </form>
          </div>

          {draws.length === 0 ? (
            <div className="w-full h-[55vh] border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-zinc-900/5">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 font-bold mb-3 border border-zinc-800">
                0
              </div>
              <h3 className="text-base font-bold text-zinc-300">No active draws yet</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                Enter an event name above to create a private, browser-based draw room.
              </p>
            </div>
          ) : (
            <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-zinc-900 text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Draw Name</th>
                    <th className="p-4">Room ID</th>
                    <th className="p-4">Created</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-medium">
                  {draws.map((draw) => (
                    <tr key={draw.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="p-4 text-white font-bold">{draw.name}</td>
                      <td className="p-4 text-zinc-500 font-mono text-xs">{draw.id}</td>
                      <td className="p-4 text-zinc-400 text-xs">{draw.createdAt}</td>
                      <td className="p-4 text-center space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/dashboard/${draw.id}`)}
                          className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-amber-500/5 text-amber-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Open Workspace
                        </button>
                        <button
                          onClick={() => handleDeleteDraw(draw.id)}
                          className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-500 hover:text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
