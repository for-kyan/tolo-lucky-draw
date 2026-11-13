// app/api/telemetry/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { event } = await request.json();

    if (event === "login") {
      await supabase.rpc("record_user_login");
    } else if (event === "create-draw") {
      await supabase.rpc("record_draw_created");
      await supabase.from("draw_usage_stats").insert({
        user_id: user.id,
        total_names_in_draw: 0,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
