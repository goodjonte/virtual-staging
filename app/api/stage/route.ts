import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stageRoom, RoomType, RoomStyle } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const user = session.user as any;

  // Check render limit
  if (user.rendersUsed >= user.rendersLimit) {
    return NextResponse.json(
      { error: "Render limit reached. Please upgrade your plan." },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("image") as File;
  const roomType = formData.get("roomType") as RoomType;
  const style = formData.get("style") as RoomStyle;

  if (!file || !roomType || !style) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Read file into buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload original image to Supabase storage
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

  // Create pending render record
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

  try {
    // Call OpenAI gpt-image-1 with the raw buffer
    const stagedBuffer = await stageRoom(buffer, file.type, roomType, style);

    // Upload staged image to Supabase storage
    const stagedFileName = `${user.id}/${Date.now()}-staged.jpg`;

    const { data: stagedUpload, error: stagedUploadError } = await getSupabaseAdmin().storage
      .from("renders")
      .upload(stagedFileName, stagedBuffer, { contentType: "image/jpeg" });

    if (stagedUploadError) {
      throw new Error(`Staged upload failed: ${stagedUploadError.message}`);
    }

    const { data: { publicUrl: stagedStoredUrl } } = getSupabaseAdmin().storage
      .from("renders")
      .getPublicUrl(stagedUpload.path);

    // Update render record
    await getSupabaseAdmin()
      .from("renders")
      .update({ staged_url: stagedStoredUrl, status: "completed" })
      .eq("id", render.id);

    // Increment renders_used
    await getSupabaseAdmin()
      .from("users")
      .update({ renders_used: user.rendersUsed + 1 })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      renderId: render.id,
      originalUrl,
      stagedUrl: stagedStoredUrl,
    });

  } catch (err: any) {
    console.error("[STAGE ERROR]", err.message);

    await getSupabaseAdmin()
      .from("renders")
      .update({ status: "failed" })
      .eq("id", render.id);

    return NextResponse.json({ error: "Staging failed", detail: err.message }, { status: 500 });
  }
}
