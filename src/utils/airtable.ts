// src/utils/airtable.ts
const AIRTABLE_API_URL = `https://api.airtable.com/v0/apppD5DROHf5ImEYG/Characters`;
const AIRTABLE_TOKEN = "patZGn8fKYkL9M0pE.886619bbd975f1f2e93be680b31d973b30cff046b6eafb0760e21546a77f9acd";

export const fetchUserData = async (userId: string) => {
  try {
    const response = await fetch(`${AIRTABLE_API_URL}?filterByFormula=({user_id}='${userId}')`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Fetched user data from Airtable:", data);
    if (data.records && data.records.length > 0) {
      const userData = data.records[0].fields;
      return {
        characters: {
          name: userData.name,
          description: userData.description,
          role: userData.role,
          image: userData.image?.[0]?.url || "",
        },
        projects: JSON.parse(userData.projects || "[]"),
      };
    }
    console.log("✅ Retrieved user data from Airtable:", data);
    return { characters: {}, projects: [] };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return { characters: {}, projects: [] };
  }
};

export const saveUserData = async (userId: string, data: any) => {
    console.log("🔄 Saving user data to Airtable:", data); // ✅ Log data before saving
    try {
      // Fetch the existing user data
      const response = await fetch(`${AIRTABLE_API_URL}?filterByFormula=({user_id}='${userId}')`, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }
  
      const userData = await response.json();
      console.log("Fetched user data for update:", userData);
      const recordId = userData.records?.[0]?.id;
  
      // Merge existing characters with the new data
      const existingCharacters = userData.records[0]?.fields || {};
      const payload = {
        fields: {
          user_id: userId,
          name: data.characters?.name || existingCharacters.name,
          description: data.characters?.description || existingCharacters.description,
          role: data.characters?.role || existingCharacters.role,
          image: data.characters?.image ? [{ url: data.characters.image }] : existingCharacters.image || [],
          projects: JSON.stringify(data.projects),
        },
      };
  
      if (recordId) {
        // Update existing record
        await fetch(`${AIRTABLE_API_URL}/${recordId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new record
        await fetch(AIRTABLE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          },
          body: JSON.stringify(payload),
        });
      }
      console.log("✅ User data saved to Airtable"); // ✅ Log success
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };
