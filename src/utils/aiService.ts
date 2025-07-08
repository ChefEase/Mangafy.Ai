import { HfInference } from "@huggingface/inference";
import { formatStory } from "./FormatStory";

const HF_API_KEY = process.env.HF_API_KEY; // Replace with your Hugging Face API key
const client = new HfInference(HF_API_KEY);

export const generateScript = async (prompt: string): Promise<string> => {
  try {
    const chatCompletion = await client.chatCompletion({
      model: "deepseek-ai/DeepSeek-R1", // Use the DeepSeek-R1 model
      messages: [
        {
          role: "user",
          content: `Generate a detailed manga panel script based on the following description: ${prompt}`,
        },
      ],
      provider: "together", // Specify the provider (if required)
      max_tokens: 2250, // Adjust based on your needs
    });

    // Extract the generated text from the response
    const generatedText = chatCompletion.choices[0].message.content;
    const formattedStory = generatedText?.split("**Title:**")[1]?.trim() || generatedText || "";
    return formatStory(formattedStory) || "";
  } catch (error) {
    console.error("Failed to generate script:", error);
    throw error;
  }
};