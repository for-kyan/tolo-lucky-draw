// app/api/draw/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { totalNames } = await request.json();

    // 1. Authenticate the admin user via secure session cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new NextResponse("Unauthorized Admin Access", { status: 401 });
    }

    // 2. Log the activity metric permanently in your Postgres 'draw_usage_stats' table
    // Note: We only record the metadata count. Raw names are NEVER saved here.
    const { error: logError } = await supabase
      .from('draw_usage_stats')
      .insert({
        user_id: user.id,
        total_names_in_draw: totalNames
      });

    if (logError) {
      console.error("Database logging failure:", logError.message);
      return new NextResponse("Internal Logging Error", { status: 500 });
    }

    // 3. Success response. (Next step: add code below to stream names to the active room cache)
    return NextResponse.json({ 
      success: true, 
      message: "Usage statistics successfully updated." 
    });

  } catch (error) {
    return new NextResponse("Invalid Request Payload", { status: 400 });
  }
}
