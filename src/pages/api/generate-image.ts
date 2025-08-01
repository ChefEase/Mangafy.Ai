import { IncomingForm, Fields, Files, File } from "formidable";
import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "@gradio/client";

export const config = {
  api: {
    bodyParser: false, // allow file uploads (FormData)
  },
};

import formidable from "formidable";
import fs from "fs";

const clientPromise = Client.connect("black-forest-labs/FLUX.1-Kontext-Dev");

async function uploadToTransferSh(fileBuffer: Buffer, filename: string): Promise<string> {
  const res = await fetch(`https://transfer.sh/${filename}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: fileBuffer,
  });
  if (!res.ok) throw new Error(`transfer.sh upload failed: ${res.statusText}`);
  return await res.text(); // returns the URL of the uploaded file
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });
  console.log("Request method:", req.method);

  const form = formidable({ multiples: false });

  form.parse(req, async (err: any, fields: Fields, files: Files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(400).json({ error: "Error parsing form data" });
    }

    try {
      const prompt = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt ?? "";
      const seed = parseInt(Array.isArray(fields.seed) ? fields.seed[0] : fields.seed ?? "0");
      const guidance_scale = parseFloat(Array.isArray(fields.guidance_scale) ? fields.guidance_scale[0] : fields.guidance_scale ?? "13.5");
      const num_inference_steps = parseInt(Array.isArray(fields.num_inference_steps) ? fields.num_inference_steps[0] : fields.num_inference_steps ?? "35");

      if (!files.image || Array.isArray(files.image)) {
        return res.status(400).json({ error: "Missing or invalid reference image" });
      }

      const imageFile = files.image as File;
      if (!imageFile) {
        return res.status(400).json({ error: "Missing or invalid reference image" });
      }

      const imagePath = imageFile.filepath;
      const imageBlob = fs.readFileSync(imagePath); // <-- use imageBlob, not imageBuffer
      const imageType = imageFile.mimetype || "image/png";

      // Upload to transfer.sh and get public URL
      const publicUrl = await uploadToTransferSh(imageBlob, imageFile.originalFilename || "upload.png");

      const client = await clientPromise;

      const result = await client.predict("/infer", {
        input_image: {
          path: imagePath,
          url: publicUrl,
          orig_name: imageFile.originalFilename || "upload.png",
          size: imageBlob.length,  // use imageBlob here too
          mime_type: imageType,
          meta: { _type: "gradio.FileData" },
        },
        prompt,
        seed,
        randomize_seed: false,
        guidance_scale,
        steps: num_inference_steps,
      });

      const [imageBase64] = result.data as string[];

      if (!imageBase64) {
        return res.status(500).json({ error: "No image returned" });
      }

      const buffer = Buffer.from(imageBase64.split(",")[1], "base64");

      res.setHeader("Content-Type", "image/png");
      return res.status(200).send(buffer);

    } catch (error: any) {
      console.error("Generation error:", error);
      return res.status(500).json({ error: error.message || "Unknown error" });
    }
  });
}