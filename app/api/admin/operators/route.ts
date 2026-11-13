// app/api/admin/operators/route.ts
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }
  return createSupabaseAdmin(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verifyCallerIsAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? user : null;
}
// GET: List all operator accounts + raw draw timestamps for client-side period filtering
export async function GET() {
  try {
    const adminUser = await verifyCallerIsAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const adminClient = getAdminSupabase();
    const { data: operators, error } = await adminClient
      .from("profiles")
      .select("id, email, role, login_count, draws_created_count, last_login_at")
      .eq("role", "operator")
      .order("email", { ascending: true });

    if (error) throw error;

    const { data: drawLogs } = await adminClient
      .from("draw_usage_stats")
      .select("user_id, created_at")
      .order("created_at", { ascending: false });

    return NextResponse.json({
      operators: operators || [],
      drawLogs: drawLogs || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new confirmed operator account without overwriting admin session
export async function POST(request: Request) {
  try {
    const adminUser = await verifyCallerIsAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { email, password } = await request.json();
    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Valid email and password (min 6 characters) are required." },
        { status: 400 }
      );
    }

    const adminClient = getAdminSupabase();
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { role: "operator" },
    });

    if (createError) throw createError;

    // Ensure profile row exists and has email + operator role populated
    if (created.user) {
      await adminClient.from("profiles").upsert({
        id: created.user.id,
        email: created.user.email,
        role: "operator",
        login_count: 0,
        draws_created_count: 0,
      });
    }

    return NextResponse.json({ success: true, user: created.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Permanently delete an operator account
export async function DELETE(request: Request) {
  try {
    const adminUser = await verifyCallerIsAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId || userId === adminUser.id) {
      return NextResponse.json({ error: "Invalid target user ID." }, { status: 400 });
    }

    const adminClient = getAdminSupabase();

    // Prevent deleting another admin via this endpoint
    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (targetProfile?.role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts cannot be deleted here." },
        { status: 403 }
      );
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    await adminClient.from("profiles").delete().eq("id", userId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
