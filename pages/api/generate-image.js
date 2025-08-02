import formidable from "formidable";
import fs from "fs";
import { Client } from "@gradio/client";
import { Blob } from "fetch-blob"; // ✅ correct Blob shim for Node

export const config = {
  api: {
    bodyParser: false,
  },
};

const clientPromise = Client.connect("black-forest-labs/FLUX.1-Kontext-Dev");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const form = formidable({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(400).json({ error: "Error parsing form data" });
    }

    const imageArray = files.image;
    if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0) {
      return res.status(400).json({ error: "Missing or invalid reference image" });
    }

    const imageFile = imageArray[0];
    const prompt = (fields.prompt && fields.prompt[0]) || "";
    const guidance_scale = parseFloat((fields.guidance_scale && fields.guidance_scale[0]) || "7.5");
    const num_inference_steps = parseInt((fields.num_inference_steps && fields.num_inference_steps[0]) || "20");
    const seed = parseInt((fields.seed && fields.seed[0]) || "0");

    try {
      const imagePath = imageFile.filepath;
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBlob = new Blob([imageBuffer], { type: imageFile.mimetype || "image/png" }); // ✅ correct Blob now

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
        return res.status(200).send(buffer);
      }
      
      if (typeof resultData === "object" && resultData.url) {
        // Fetch image from the provided URL
        const imageResponse = await fetch(resultData.url);
        const imageBuffer = await imageResponse.arrayBuffer();
      
        res.setHeader("Content-Type", "image/png");
        return res.status(200).send(Buffer.from(imageBuffer));
      }

      console.error("Unexpected image format from model:", resultData);
      return res.status(500).json({ error: "Unexpected image data format from model" });

    } catch (error) {
      console.error("Generation error:", error);
      return res.status(500).json({ error: error.message || "Unknown error" });
    }
  });
}
