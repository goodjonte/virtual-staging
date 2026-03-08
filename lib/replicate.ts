import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export type RoomStyle =
  | "Default (AI decides)"
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
  | "Scandinavian Oasis"
  | "Transitional Luxury"
  | "B&W Modern"
  | "Farmhouse Hacienda"
  | "Metro Industrial"
  | "NYC Modern";

export type RoomType =
  | "Living Room"
  | "Bedroom"
  | "Balcony"
  | "Dining Room"
  | "Office"
  | "Kitchen"
  | "Bathroom"
  | "Garden"
  | "Swimming Pool";

export async function stageRoom(
  imageUrl: string,
  roomType: RoomType,
  style: RoomStyle
): Promise<string> {
  const output = await replicate.run(
    "proplabs/virtual-staging:635d607efc6e3a6016ef6d655327cd35f3d792e84b8f110688b04498c6e94cfb",
    {
      input: {
        image: imageUrl,
        room: roomType,
        furniture_style: style,
      },
    }
  ) as any;

  // Output is a Replicate file object
  const result = typeof output?.url === "function" ? output.url() : (Array.isArray(output) ? output[0] : output);

  if (!result) {
    throw new Error("No output from Replicate");
  }

  return result;
}
