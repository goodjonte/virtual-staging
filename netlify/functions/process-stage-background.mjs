import { createClient } from "@supabase/supabase-js";
import OpenAI, { toFile } from "openai";

export default async function handler(req) {
  const { renderId, userId, imageBase64, mimeType, roomType, style, rendersUsed } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You must stage this ${roomType.toLowerCase()} with ${style} style furniture. 
Do not change what is already within the image — do not change the room layout, walls, ceiling, floors, windows, fixtures, or any existing items. 
Do not change the colour of any existing things. 
Add furniture and decor only. 
Make it look like a professional real estate photo.`;

    const imageBuffer = Buffer.from(imageBase64, "base64");
    const imageFile = await toFile(imageBuffer, "room.png", { type: "image/png" });

    console.log("[BG] Calling OpenAI gpt-image-1...");

    const response = await client.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageData = response.data?.[0];
    if (!imageData) throw new Error("No image data returned from OpenAI");

    let stagedBuffer;
    if (imageData.b64_json) {
      stagedBuffer = Buffer.from(imageData.b64_json, "base64");
    } else if (imageData.url) {
      const res = await fetch(imageData.url);
      stagedBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      throw new Error("No image data in OpenAI response");
    }

    console.log("[BG] Uploading staged image...");

    // Upload staged image to Supabase
    const stagedFileName = `${userId}/${Date.now()}-staged.jpg`;
    const { data: stagedUpload, error: uploadError } = await supabase.storage
      .from("renders")
      .upload(stagedFileName, stagedBuffer, { contentType: "image/jpeg" });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl: stagedUrl } } = supabase.storage
      .from("renders")
      .getPublicUrl(stagedUpload.path);

    // Update render record
    await supabase
      .from("renders")
      .update({ staged_url: stagedUrl, status: "completed" })
      .eq("id", renderId);

    // Increment renders_used
    await supabase
      .from("users")
      .update({ renders_used: rendersUsed + 1 })
      .eq("id", userId);

    console.log("[BG] Done:", renderId);

  } catch (err) {
    console.error("[BG] Error:", err.message);
    await supabase
      .from("renders")
      .update({ status: "failed", error_message: err.message })
      .eq("id", renderId);
  }
}

export const config = { background: true };
