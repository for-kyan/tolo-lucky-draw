// app/api/upload/backdrop/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET_NAME = "ephemeral-backdrops";
const MAX_FALLBACK_BYTES = 30 * 1024 * 1024; // 30 MB
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const MAX_UPLOADS_PER_4H = 10; // Guardrail: max 10 fallback uploads in a rolling 4-hour window

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * POST: Validates operator session, purges expired (>4h) files for GDPR compliance,
 * enforces the hardcoded 10-uploads-per-4-hours ceiling, and returns signed upload + read URLs.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const drawId = String(body.drawId || "").trim();
    const hash = String(body.hash || "").trim();
    const mimeType = String(body.mimeType || "").trim();
    const fileSize = Number(body.fileSize || 0);

    if (!drawId || !hash || !ALLOWED_MIME_TO_EXT[mimeType]) {
      return NextResponse.json(
        { error: "Invalid backdrop metadata or unsupported MIME type." },
        { status: 400 }
      );
    }

    if (fileSize <= 0 || fileSize > MAX_FALLBACK_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds the 30 MB guardrail limit." },
        { status: 400 }
      );
    }

    // 1. Inspect existing ephemeral objects to enforce the 4-hour rolling guardrail & GDPR cleanup
    const { data: existingObjects, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (listError) {
      return NextResponse.json(
        { error: `Storage inspection failed: ${listError.message}` },
        { status: 500 }
      );
    }

    const now = Date.now();
    const expiredPaths: string[] = [];
    let recentUploadsCount = 0;

    for (const obj of existingObjects || []) {
      if (!obj.name || obj.id === null) continue;
      const createdMs = obj.created_at ? new Date(obj.created_at).getTime() : now;
      if (now - createdMs > FOUR_HOURS_MS) {
        expiredPaths.push(obj.name);
      } else {
        recentUploadsCount += 1;
      }
    }

    // Auto-purge files older than 4 hours (GDPR ephemeral retention)
    if (expiredPaths.length > 0) {
      await supabase.storage.from(BUCKET_NAME).remove(expiredPaths);
    }

    // Hardcoded Guardrail: Max 10 fallback uploads within a 4-hour window
    if (recentUploadsCount >= MAX_UPLOADS_PER_4H) {
      return NextResponse.json(
        {
          error:
            "Cloud fallback rate limit reached (max 10 uploads per 4 hours). Please use local network P2P.",
        },
        { status: 429 }
      );
    }

    const ext = ALLOWED_MIME_TO_EXT[mimeType];
    const storagePath = `${drawId}_${hash.slice(0, 16)}.${ext}`;

    // Remove any existing object at the exact same path before issuing signed upload
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(storagePath);

    if (uploadError || !uploadData) {
      return NextResponse.json(
        { error: uploadError?.message || "Failed to generate signed upload URL." },
        { status: 500 }
      );
    }

    // Generate a 4-hour signed read URL for up to the first 5 display clients
    const { data: readData, error: readError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 4 * 60 * 60);

    if (readError || !readData) {
      return NextResponse.json(
        { error: readError?.message || "Failed to generate signed read URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUploadUrl: uploadData.signedUrl,
      signedReadUrl: readData.signedUrl,
      storagePath,
    });
  } catch (err) {
    console.error("Backdrop fallback API error:", err);
    return NextResponse.json(
      { error: "Unexpected error preparing cloud fallback." },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Immediately purges an ephemeral backdrop when the operator removes it.
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storagePath } = await req.json();
    if (!storagePath || typeof storagePath !== "string") {
      return NextResponse.json({ error: "Missing storagePath." }, { status: 400 });
    }

    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Failed to purge backdrop." }, { status: 500 });
  }
}
