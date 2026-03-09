import { createClient } from "@supabase/supabase-js";
import Replicate from "replicate";

export default async function handler(req) {
  const { renderId, userId, imageUrl, roomType, style, rendersUsed } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const prompt = `Virtually stage this room by adding furniture and soft furnishings only. Do not change anything that already exists in the photo. This means: do not move, remove, recolour, or alter walls, floors, stairs, ceilings, windows, curtains, blinds, doors, light fittings, fixtures, appliances, or any architectural features. The room structure must remain identical to the original photo. Only add furniture such as sofas, chairs, tables, beds, rugs, cushions, lamps, artwork and plants. The result should look like the exact same room photographed after furniture was physically placed inside it. Photorealistic, professional real estate photography style.`;

    console.log("[BG] Calling Replicate openai/gpt-image-1.5...");

    const output = await replicate.run("openai/gpt-image-1.5", {
      input: {
        prompt,
        quality: "low",
        background: "auto",
        moderation: "low",
        aspect_ratio: "3:2",
        input_images: [imageUrl],
        output_format: "webp",
        input_fidelity: "high",
        number_of_images: 1,
        output_compression: 90,
      },
    });

    const result = output?.[0];
    if (!result) throw new Error("No output from Replicate");

    const stagedUrl = typeof result.url === "function" ? result.url() : String(result);

    console.log("[BG] Got staged image:", stagedUrl);

    // Download the webp and upload to Supabase
    const imgRes = await fetch(stagedUrl);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    const stagedFileName = `${userId}/${Date.now()}-staged.webp`;
    const { data: stagedUpload, error: uploadError } = await supabase.storage
      .from("renders")
      .upload(stagedFileName, imgBuffer, { contentType: "image/webp" });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl: stagedStoredUrl } } = supabase.storage
      .from("renders")
      .getPublicUrl(stagedUpload.path);

    // Update render record
    await supabase
      .from("renders")
      .update({ staged_url: stagedStoredUrl, status: "completed" })
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
