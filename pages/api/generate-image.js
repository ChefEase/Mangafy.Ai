import { Client } from "@gradio/client";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // Required for formidable
  },
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

    try {
      const { fields, files } = await parseForm(req);
      const prompt = fields.prompt?.[0] || "";
      const imageFile = files.image?.[0];
      const lora_name = fields.lora_name?.[0] || "Ghibli";
      const guidance_scale = parseFloat(fields.guidance_scale?.[0] || "17");
      const num_inference_steps = parseInt(fields.num_inference_steps?.[0] || "25");
      const seed = parseInt(fields.seed?.[0] || "42");
      const width = parseInt(fields.width?.[0] || "1024");
      const height = parseInt(fields.height?.[0] || "1024");

      if (!imageFile) return res.status(400).json({ error: "No image provided" });

      const imageBuffer = fs.readFileSync(imageFile.filepath);

      // 🔁 Connect to public Gradio space
      const client = await Client.connect("yiren98/OmniConsistency");
      
      console.time("Prediction");
      const result = await client.predict("/generate_image", {
        lora_name,
        custom_repo_id: "",
        prompt,
        uploaded_image: imageBuffer,
        width,
        height,
        guidance_scale,
        num_inference_steps,
        seed,
      });
      console.log("🧠 result.data:", result.data); // <-- Add this
      const outputArray = result.data;
    
      const imageArray = Array.isArray(result.data?.[0]) ? result.data[0] : result.data;
      const lastImage = imageArray?.[imageArray.length - 1];
      
      if (!lastImage?.url) {
        return res.status(500).json({ error: "Invalid image format" });
      }
      console.timeEnd("Prediction") 
      return res.status(200).json({ image: lastImage });

    } catch (err) {
      console.error("🔥 Generation failed:", JSON.stringify(err, null, 2));
      res.status(500).json({ error: err.message || "Generation failed" });
    }
  }

