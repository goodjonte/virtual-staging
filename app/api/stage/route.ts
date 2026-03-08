import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { stageRoom, RoomType, RoomStyle } from "@/lib/openai";

export const maxDuration = 300; // 5 minutes (Netlify Pro supports up to 900s)

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
  const roomType = formData.get("roomType") as RoomType;
  const style = formData.get("style") as RoomStyle;

  if (!file || !roomType || !style) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload original image
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

  // Create render record
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

  // Return render ID immediately so client can start polling
  // Then process in background using streaming response to keep connection alive
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send render ID immediately
      controller.enqueue(encoder.encode(JSON.stringify({ status: "processing", renderId: render.id }) + "\n"));

      try {
        // Keep connection alive with periodic pings while OpenAI processes
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify({ status: "ping" }) + "\n"));
          } catch {}
        }, 5000);

        console.log("[STAGE] Calling OpenAI...");
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("OpenAI request timed out after 90 seconds")), 90000)
        );
        const stagedBuffer = await Promise.race([
          stageRoom(buffer, file.type, roomType, style),
          timeoutPromise,
        ]);
        console.log("[STAGE] OpenAI returned, uploading result...");

        clearInterval(pingInterval);

        // Upload staged image
        const stagedFileName = `${user.id}/${Date.now()}-staged.jpg`;
        const { data: stagedUpload, error: stagedUploadError } = await getSupabaseAdmin().storage
          .from("renders")
          .upload(stagedFileName, stagedBuffer, { contentType: "image/jpeg" });

        if (stagedUploadError) throw new Error(stagedUploadError.message);

        const { data: { publicUrl: stagedUrl } } = getSupabaseAdmin().storage
          .from("renders")
          .getPublicUrl(stagedUpload.path);

        await getSupabaseAdmin()
          .from("renders")
          .update({ staged_url: stagedUrl, status: "completed" })
          .eq("id", render.id);

        await getSupabaseAdmin()
          .from("users")
          .update({ renders_used: user.rendersUsed + 1 })
          .eq("id", user.id);

        controller.enqueue(encoder.encode(JSON.stringify({
          status: "completed",
          renderId: render.id,
          originalUrl,
          stagedUrl,
        }) + "\n"));

      } catch (err: any) {
        await getSupabaseAdmin()
          .from("renders")
          .update({ status: "failed" })
          .eq("id", render.id);

        controller.enqueue(encoder.encode(JSON.stringify({
          status: "failed",
          error: err.message,
        }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
