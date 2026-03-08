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
  const prompt = `A beautifully ${style} styled ${roomType}, professionally staged for real estate photography, bright natural lighting, high end furniture, photorealistic`;
  const negativePrompt = "ugly, blurry, low quality, distorted, people, text, watermark";

  const output = await replicate.run(
    // Interior design / virtual staging model
    "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6bfab4",
    {
      input: {
        image: imageUrl,
        prompt,
        negative_prompt: negativePrompt,
        guidance_scale: 15,
        num_inference_steps: 50,
        strength: 0.8,
      },
    }
  ) as string[];

  if (!output || !output[0]) {
    throw new Error("No output from Replicate");
  }

  return output[0];
}
