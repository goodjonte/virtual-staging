import OpenAI, { toFile } from "openai";

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

  const prompt = `You must stage this ${roomType.toLowerCase()} with ${style} style furniture. 
Do not change what is already within the image — do not change the room layout, walls, ceiling, floors, windows, fixtures, or any existing items. 
Do not change the colour of any existing things. 
Add furniture and decor only. 
Make it look like a professional real estate photo.`;

  const imageFile = await toFile(imageBuffer, "room.png", { type: "image/png" });

  console.log("[OpenAI] Sending request to gpt-image-1...");

  const response = await client.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
  } as any);

  console.log("[OpenAI] Got response:", JSON.stringify(response).slice(0, 200));

  const imageData = response.data?.[0];

  if (!imageData) {
    throw new Error("No image data in OpenAI response");
  }

  if (imageData.b64_json) {
    return Buffer.from(imageData.b64_json, "base64");
  }

  if (imageData.url) {
    const res = await fetch(imageData.url);
    return Buffer.from(await res.arrayBuffer());
  }

  throw new Error("No image data in OpenAI response");
}
