import Replicate from "replicate";

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

const PROMPT = `Virtually stage this room by adding furniture and soft furnishings only. Do not change anything that already exists in the photo. This means: do not move, remove, recolour, or alter walls, floors, stairs, ceilings, windows, curtains, blinds, doors, light fittings, fixtures, appliances, or any architectural features. The room structure must remain identical to the original photo. Only add furniture such as sofas, chairs, tables, beds, rugs, cushions, lamps, artwork and plants. The result should look like the exact same room photographed after furniture was physically placed inside it. Photorealistic, professional real estate photography style.`;

export async function stageRoom(
  imageUrl: string,
  roomType: RoomType,
  style: RoomStyle
): Promise<string> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

  const prompt = `${PROMPT} Style: ${style}. Room type: ${roomType}.`;

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
  }) as any[];

  const result = output?.[0];
  if (!result) throw new Error("No output from Replicate");

  // Replicate returns a file object with .url() method
  return typeof result.url === "function" ? result.url() : String(result);
}
