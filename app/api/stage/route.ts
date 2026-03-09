import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const user = session.user as any;

  if (user.rendersUsed >= user.rendersLimit) {
    return NextResponse.json(
      { error: "Render limit reached. Please upgrade your plan." },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("image") as File;
  const roomType = formData.get("roomType") as string;
  const style = formData.get("style") as string;

  if (!file || !roomType || !style) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload original image to Supabase
  const fileExt = file.name.split(".").pop() || "jpg";
  const originalFileName = `${user.id}/${Date.now()}-original.${fileExt}`;

  const { data: uploadData, error: uploadError } = await getSupabaseAdmin().storage
    .from("renders")
    .upload(originalFileName, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed", detail: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl: originalUrl } } = getSupabaseAdmin().storage
    .from("renders")
    .getPublicUrl(uploadData.path);

  // Create render record with processing status
  const { data: render, error: renderError } = await getSupabaseAdmin()
    .from("renders")
    .insert({
      user_id: user.id,
      original_url: originalUrl,
      room_type: roomType,
      style,
      status: "processing",
    })
    .select()
    .single();

  if (renderError) {
    return NextResponse.json({ error: "DB error", detail: renderError.message }, { status: 500 });
  }

  // Fire background function (don't await — returns immediately)
  const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get("host")}`;
  fetch(`${baseUrl}/.netlify/functions/process-stage-background`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      renderId: render.id,
      userId: user.id,
      imageUrl: originalUrl,
      roomType,
      style,
      rendersUsed: user.rendersUsed,
    }),
  }).catch((err) => console.error("[STAGE] Failed to trigger background function:", err.message));

  // Return render ID immediately — client will poll for status
  return NextResponse.json({ renderId: render.id, originalUrl });
}
