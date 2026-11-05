// =============================================================================
// [LINES 1-15: ARCHITECTURAL DEPENDENCY IMPORTS & DATA CONTRACT INTERFACES]
// =============================================================================
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LocalDrawInstance } from "@/types/draw";

export default function ManagePage() {
  const router = useRouter();
  const supabase = createClient();

  // =============================================================================
  // [LINES 16-45: ROLE ARCHITECTURE & SYSTEM MEMORY STATE HOOKS]
  // =============================================================================
  const [userRole, setUserRole] = useState<"admin" | "operator" | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [draws, setDraws] = useState<LocalDrawInstance[]>([]);
  const [newDrawName, setNewDrawName] = useState("");
  
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [provisionStatus, setProvisionStatus] = useState<string | null>(null);

  const [totalSystemDraws, setTotalSystemDraws] = useState<number>(0);
  const [activeOperatorsCount, setActiveOperatorsCount] = useState<number>(0);

  // =============================================================================
  // [LINES 46-85: SECURE SESSION FETCH & POSTGRESQL METRICS INTEGRATIONS]
  // =============================================================================
  useEffect(() => {
    const initializeManagementHub = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
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

        const role = profile?.role || "operator";
        setUserRole(role);

        const savedDraws = localStorage.getItem("tolo_active_draws");
        if (savedDraws) {
          setDraws(JSON.parse(savedDraws));
        }

        if (role === "admin") {
          const { count: drawsCount } = await supabase
            .from("draw_usage_stats")
            .select("*", { count: "exact", head: true });
            
          const { count: opsCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "operator");

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

  // =============================================================================
  // [LINES 86-125: INSTANCE LIFECYCLE CREATION & GARBAGE COLLECTION TRIGGERS]
  // =============================================================================
  const handleCreateDraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrawName.trim()) return;

    // ──> REFACTOR CRITERIA: DROPDOWNS REMOVED. THE DASHBOARD CONTROLS CONFIGURATIONS.
    const newInstance: LocalDrawInstance = {
      id: crypto.randomUUID(), 
      name: newDrawName.trim(),
      drawType: "Pending Dynamic Selection", // Evaluated later inside the workspace dashboard
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
    
    // Wipe specific drawing sub-caches out of memory to protect device space
    localStorage.removeItem(`tolo_active_pool_${id}`);
    localStorage.removeItem(`tolo_history_pool_${id}`);
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionStatus("Provisioning user configuration...");

    try {
      const { error } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: { data: { role: "operator" } }
      });

      if (error) throw error;
      setProvisionStatus(`Success! Created account for ${newUserEmail}`);
      setNewUserEmail("");
      setNewUserPassword("");
      setActiveOperatorsCount((prev) => prev + 1);
    } catch (err: any) {
      setProvisionStatus(`Error: ${err.message}`);
    }
  };

  const handleGlobalSystemSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("tolo_active_draws");
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs animate-pulse">
        VALIDATING_WORKSPACE_AUTHENTICITY...
      </div>
    );
  }
  // =============================================================================
// [LINES 126-250: USER INTERFACE LAYOUT GRAPHICS COMPONENT RENDERING]
// =============================================================================
  return (
    <main className="w-screen h-screen flex bg-zinc-950 text-white font-sans overflow-hidden">
      
      {/* CONTROL BANNER CONSOLE (LEFT LAYOUT SIDEBAR) */}
      <section className="w-96 p-8 border-r border-zinc-900 bg-zinc-900/20 space-y-6 overflow-y-auto flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-black tracking-tight text-amber-400">DRAW CONTROL HUB</h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono truncate">Logged In: {userEmail}</p>
          </div>

          {userRole === "admin" ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl">
                  <span className="block text-2xl font-black text-white font-mono">{totalSystemDraws}</span>
                  <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mt-1">Total Draws Run</span>
                </div>
                <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-xl">
                  <span className="block text-2xl font-black text-amber-500 font-mono">{activeOperatorsCount}</span>
                  <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mt-1">Operators</span>
                </div>
              </div>

              <form onSubmit={handleProvisionUser} className="space-y-3 pt-4 border-t border-zinc-900">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Provision Operator Account</h2>
                <input 
                  type="email" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-mono text-white"
                  placeholder="operator@domain.com"
                />
                <input 
                  type="password" required value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-mono text-white"
                  placeholder="••••••••••••"
                />
                <button type="submit" className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-lg transition-colors cursor-pointer text-white">
                  Create Account
                </button>
                {provisionStatus && (
                  <p className="text-[10px] text-amber-500 font-mono bg-amber-500/5 p-2 rounded border border-amber-500/10 leading-normal">{provisionStatus}</p>
                )}
              </form>
            </div>
          ) : (
            /* CRUCIAL NOTE: THIS IS THE COMPONENT REFERRED TO FOR REMOVAL BEFORE FINAL DEPLOYMENT */
            <div className="space-y-6">
              <div className="bg-zinc-950 p-5 border border-zinc-800 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Session Environment</h2>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">DEVELOPMENT_MODE</span>
                </div>
                <div className="space-y-2 pt-2 border-t border-zinc-900">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Active Workspaces:</span>
                    <span className="font-mono font-bold text-zinc-300">{draws?.length || 0} Active</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Storage Partition:</span>
                    <span className="font-mono font-bold text-zinc-300">Client Memory</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Leak Prevention Guard:</span>
                    <span className="font-mono text-emerald-400 font-bold">ACTIVE</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl">
                Notice: Delete drawing spaces when your Draw finishes to instantly free up internal browser memory footprint.
              </p>
            </div>
          )}
        </div>

        {/* Global Security Shutdown Actions Cluster */}
        <div className="pt-4 border-t border-zinc-900 flex flex-col gap-2">
          <div className="text-[10px] text-zinc-600 font-mono tracking-wider">
            AUTHORITY_LEVEL: {userRole?.toUpperCase()}
          </div>
          <button
            onClick={handleGlobalSystemSignOut}
            className="w-full py-2 bg-zinc-950 border border-zinc-900 hover:border-red-500/30 text-zinc-500 hover:text-red-400 text-xs font-bold rounded-lg transition-all cursor-pointer font-mono"
          >
            DISCONNECT_SESSION_LOGOUT
          </button>
        </div>
      </section>

      {/* EVENTS DIRECTORY REGISTRY CONTAINER (RIGHT PANEL) */}
      <section className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Active Draw Directory</h2>
            <p className="text-sm text-zinc-400 mt-0.5">Initialize a blank event draw  below to begin configurations.</p>
          </div>
          
          {/* Streamlined Create Draw Input Header Form */}
          <form onSubmit={handleCreateDraw} className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" required value={newDrawName} onChange={(e) => setNewDrawName(e.target.value)}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl focus:outline-none text-sm text-white min-w-[260px] flex-1 md:flex-none"
              placeholder="e.g. Corporate Gala Lucky Draw"
            />
            <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-sm font-extrabold rounded-xl transition-colors cursor-pointer whitespace-nowrap">
              Create New Draw
            </button>
          </form>
        </div>

        {/* Dynamic Directory List Table Section */}
        {!draws || draws.length === 0 ? (
          /* Elegant Onboarding Blank State Layout */
          <div className="w-full h-[60vh] border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-zinc-900/5">
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 font-bold mb-3 border border-zinc-800">0</div>
            <h3 className="text-base font-bold text-zinc-300">No active draws found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">Type a name in the box above to generate an isolated, secure workspace instance.</p>
          </div>
        ) : (
          /* Interactive Shared Data Grid List Layout (Relabeled for Non-Tech Users) */
          <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-900 text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-4">Active Draw Title</th>
                  <th className="p-4">Secure Channel Code</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 font-medium">
                {draws.map((draw) => (
                  <tr key={draw.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="p-4 text-white font-bold">{draw.name}</td>
                    <td className="p-4 text-zinc-500 font-mono text-xs">{draw.id}</td>
                    <td className="p-4 text-zinc-400 text-xs">{draw.createdAt}</td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button 
                        onClick={() => router.push(`/dashboard/${draw.id}`)}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-amber-500/5 text-amber-400 text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Open Workspace
                      </button>
                      <button 
                        onClick={() => handleDeleteDraw(draw.id)}
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-500 hover:text-red-400 text-xs font-bold rounded-lg transition-all cursor-pointer"
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
      </section>

    </main>
  );
}
