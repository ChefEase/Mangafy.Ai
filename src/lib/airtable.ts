import { Message } from "@/types/chat";

const AIRTABLE_TOKEN = "patIcK5hqVA19dyEk.d90f3484ca4bda1a32788051177ba6cda8ac2793ea7cf2421729b9f23657df99";
const AIRTABLE_BASE_ID = "apppD5DROHf5ImEYG";

// Save a new chat to Airtable
export const saveNewChat = async (chatId: string, title: string) => {
  try {
    const payload = {
      fields: {
        id: chatId,
        title: title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Chats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to save chat to Airtable:", result);
      throw new Error(result.error?.message || "Unknown error");
    }

    return result;
  } catch (error) {
    console.error("❌ Error saving new chat:", error);
  }
};

// Save a message with optional base64 or URL image
export const saveMessage = async (message: Message) => {
  try {
    const imageUrl = message.imageUrl ?? "";
const isBase64 = imageUrl.startsWith("data:");
const hasImage = imageUrl.length > 0;

if (isBase64 && hasImage) {
  const contentType = imageUrl.substring(5, imageUrl.indexOf(";"));
  const base64Data = imageUrl.split(",")[1];
  const filename = `image-${Date.now()}.jpg`;

  const uploaded = await uploadBase64ToAirtable(base64Data, contentType, filename, message.chatId);

      if (uploaded?.id) {
        return uploaded;
      } else {
        throw new Error("Image upload failed");
      }
    } else {
      // No image or it's a plain URL
      const attachments =
        typeof message.imageUrl === "string" && message.imageUrl.startsWith("http")
          ? [{ url: message.imageUrl }]
          : [];

      const payload = {
        fields: {
          id: message.id,
          chatId: message.chatId,
          role: message.role,
          content: message.content || "",
          imageUrl: attachments,
          createdAt: message.createdAt.toISOString(),
        },
      };

      const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to save message to Airtable:", result);
        throw new Error(result.error?.message || "Unknown error");
      }

      return result;
    }
  } catch (error) {
    console.error("❌ Error saving message:", error);
    return null;
  }
};

// Upload base64 image to Airtable's uploadAttachment endpoint
export const uploadBase64ToAirtable = async (
  base64Data: string,
  contentType: string,
  filename: string,
  chatId: string
) => {
  try {
    // Step 1: create empty record to get ID
    const createRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
      body: JSON.stringify({
        fields: {
          chatId,
          role: "user",
          content: "",
          createdAt: new Date().toISOString(),
        },
      }),
    });

    const created = await createRes.json();
    const recordId = created.id;

    // Step 2: upload the base64 file to that record
    const uploadRes = await fetch(
      `https://content.airtable.com/v0/${AIRTABLE_BASE_ID}/${recordId}/imageUrl/uploadAttachment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
        body: JSON.stringify({
          contentType,
          filename,
          file: base64Data,
        }),
      }
    );

    const uploaded = await uploadRes.json();
    return uploaded;
  } catch (error) {
    console.error("❌ Error uploading base64 image to Airtable:", error);
    return null;
  }
};
