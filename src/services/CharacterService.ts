export class CharacterService {
    static async getCharacters(): Promise<Character[]> {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return [];
        const API_KEY = `patZGn8fKYkL9M0pE.886619bbd975f1f2e93be680b31d973b30cff046b6eafb0760e21546a77f9acd`;
        
        const response = await fetch(
          `https://api.airtable.com/v0/apppD5DROHf5ImEYG/Characters?filterByFormula=({user_id}='${userId}')`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        );
  
        const data = await response.json();
        return data.records?.map((record: any) => ({
          id: record.id,
          name: record.fields?.name || 'Unnamed',
          description: record.fields?.description || 'No description',
          role: record.fields?.role || 'supporting',
          image: record.fields?.image?.[0]?.url || "",
        })) || [];
      } catch (error) {
        console.error('Error:', error);
        return [];
      }
    }
  
    static replaceNamesWithDescriptions(text: string, characters: Character[]): string {
      if (!characters?.length) return text;
      
      const sorted = [...characters].sort((a, b) => b.name.length - a.name.length);
      
      sorted.forEach(char => {
        const regex = new RegExp(`\\b${this.escapeRegex(char.name)}\\b`, 'gi');
        text = text.replace(regex, char.description);
      });
      
      return text;
    }
  
    private static escapeRegex(str: string) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }

  export interface Character {
    id: string;
    name: string;
    description: string;
    role: string;
    image?: string;
    referenceKeywords?: string[]; // Optional image property
  }
  