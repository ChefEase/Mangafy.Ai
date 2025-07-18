import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "@gradio/client";

const gradio = new Client("Asahina2K/animagine-xl-3.1");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  const {
    prompt,
    negative_prompt = "",
    seed = 0,
    custom_width = 1024,
    custom_height = 1024,
    guidance_scale = 7,
    num_inference_steps = 28,
    sampler = "Euler a",
    aspect_ratio_selector = "896 x 1152",
    style_selector = "(None)",
    quality_selector = "Standard v3.1",
    use_upscaler = false,
    upscaler_strength = 0.55,
    upscale_by = 1.5,
    add_quality_tags = true
  } = req.body;

  const args = [
    prompt,
    negative_prompt,
    seed,
    custom_width,
    custom_height,
    guidance_scale,
    num_inference_steps,
    sampler,
    aspect_ratio_selector,
    style_selector,
    quality_selector,
    use_upscaler,
    upscaler_strength,
    upscale_by,
    add_quality_tags
  ];

  try {
    const result = await gradio.predict(args as any, { api_name: "/run" });
    
    // Handle potential binary response safely
    if (typeof result === "string") {
      // Create a buffer to check the PNG signature safely
      const buffer = Buffer.from(result, 'binary');
      if (buffer[0] === 0x89 && buffer[1] === 0x50) { // 0x89 followed by 'P' (0x50)
        res.setHeader('Content-Type', 'image/png');
        return res.status(200).send(buffer);
      }
    }

    // Handle structured response
    const [images, metadata] = result as unknown as [{ image: { url: string } }[], Record<string, any>];

    if (!images?.[0]?.image?.url) {
      return res.status(500).json({ error: "No image url returned" });
    }

    const imageResp = await fetch(images[0].image.url);
    const imageBuffer = await imageResp.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (err: any) {
    console.error("❌ Gradio API error:", err);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: err.message || "unknown error" });
  }
}