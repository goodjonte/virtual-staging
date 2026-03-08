import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export type RoomStyle =
  | "modern"
  | "scandinavian"
  | "hamptons"
  | "industrial"
  | "contemporary";

export type RoomType =
  | "living room"
  | "bedroom"
  | "dining room"
  | "kitchen"
  | "office"
  | "bathroom";

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
        room_type: roomType,
        style: style,
      },
    }
  ) as string | string[];

  const result = Array.isArray(output) ? output[0] : output;

  if (!result) {
    throw new Error("No output from Replicate");
  }

  return result;
}
