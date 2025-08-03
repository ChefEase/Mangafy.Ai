import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { Fields, Files, File } from "formidable";
import fs from "fs";
import { Client } from "@gradio/client";
import { Blob } from "fetch-blob"; // For Node.js < 20

export const config = {
  api: {
    bodyParser: false,
  },
};

const clientPromise = Client.connect("black-forest-labs/FLUX.1-Kontext-Dev");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST allowed" });
    return;
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err: any, fields: Fields, files: Files) => {
    if (err) {
      console.error("Form parsing error:", err);
      res.status(400).json({ error: "Error parsing form data" });
      return;
    }

    const imageArray = files.image as File[] | undefined;
    if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0) {
      res.status(400).json({ error: "Missing or invalid reference image" });
      return;
    }

    const imageFile = imageArray[0];

    const prompt = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt ?? "";
    const guidance_scale = parseFloat(
      Array.isArray(fields.guidance_scale) ? fields.guidance_scale[0] : fields.guidance_scale ?? "7.5"
    );
    const num_inference_steps = parseInt(
      Array.isArray(fields.num_inference_steps) ? fields.num_inference_steps[0] : fields.num_inference_steps ?? "20"
    );
    const seed = parseInt(
      Array.isArray(fields.seed) ? fields.seed[0] : fields.seed ?? "0"
    );

    try {
      const imagePath = imageFile.filepath;
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBlob = new Blob([imageBuffer], { type: imageFile.mimetype || "image/png" });

      const client = await clientPromise;

      const result = await client.predict("/infer", {
        input_image: imageBuffer,
        prompt,
        seed,
        randomize_seed: false,
        guidance_scale,
        steps: num_inference_steps,
      });

      console.log("Gradio raw result:", JSON.stringify(result, null, 2));

      const resultData = result.data?.[0];

      if (typeof resultData === "string" && resultData.startsWith("data:image")) {
        const buffer = Buffer.from(resultData.split(",")[1], "base64");
        res.setHeader("Content-Type", "image/png");
        res.status(200).send(buffer);
        return;
      }

      if (typeof resultData === "object" && resultData !== null && "url" in resultData) {
        const imageResponse = await fetch((resultData as any).url);
        const imageBuffer = await imageResponse.arrayBuffer();

        res.setHeader("Content-Type", "image/png");
        res.status(200).send(Buffer.from(imageBuffer));
        return;
      }

      console.error("Unexpected image format from model:", resultData);
      res.status(500).json({ error: "Unexpected image data format from model" });

    } catch (error: any) {
      console.error("Generation error:", error);
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  });
}
