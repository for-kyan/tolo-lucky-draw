"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SignOutButtonProps {
  label?: string;
  loadingLabel?: string;
  confirmMessage?: string;
  className?: string;
}

export function SignOutButton({
  label = "Sign Out",
  loadingLabel = "Signing Out...",
  confirmMessage,
  className,
}: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign-out error:", error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={
        className ||
        "px-4 py-2 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/40 text-xs font-bold text-zinc-300 hover:text-red-400 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
      }
    >
      {isSigningOut ? loadingLabel : label}
    </button>
  );
}
