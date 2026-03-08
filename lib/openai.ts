import OpenAI from "openai";
import { toFile } from "openai";

export type RoomStyle =
  | "Modern"
  | "Scandinavian"
  | "Transitional"
  | "Rustic"
  | "Mid-Century Modern"
  | "Urban Industrial"
  | "Farmhouse"
  | "Coastal"
  | "Traditional"
  | "Modern Organic"
  | "Hamptons"
  | "Minimalist"
  | "Luxury";

export type RoomType =
  | "Living Room"
  | "Bedroom"
  | "Dining Room"
  | "Kitchen"
  | "Office"
  | "Bathroom"
  | "Balcony"
  | "Garden"
  | "Swimming Pool";

export async function stageRoom(
  imageBuffer: Buffer,
  mimeType: string,
  roomType: RoomType,
  style: RoomStyle
): Promise<Buffer> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const prompt = `You are a professional virtual staging expert. 
Look at this photo of an empty or partially furnished ${roomType.toLowerCase()}.

Without changing:
- The room layout, walls, ceiling, floors or windows
- Any existing fixed features (fireplace, built-ins, appliances)
- The lighting or perspective of the photo
- The overall dimensions or architecture

Add realistic, high quality ${style} style furniture and decor to make it look beautifully staged for a real estate listing. 
The result should look like a professional real estate photo. 
Make it photorealistic and aspirational.`;

  // gpt-image-1 requires PNG
  const imageFile = await toFile(imageBuffer, "room.png", { type: "image/png" });

  const response = await client.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt,
    n: 1,
    size: "1024x1024",
  });

  const imageData = response.data?.[0];

  if (!imageData) {
    throw new Error("No image data in OpenAI response");
  }

  // gpt-image-1 returns base64
  if (imageData.b64_json) {
    return Buffer.from(imageData.b64_json, "base64");
  }

  // Fallback: download from URL if returned
  if (imageData.url) {
    const res = await fetch(imageData.url);
    return Buffer.from(await res.arrayBuffer());
  }

  throw new Error("No image data in OpenAI response");
}
