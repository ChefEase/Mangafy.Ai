export const autoSave = (key, content) => {
  if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, content);
      console.log("Auto-saved successfully!");
    } catch (error) {
      console.error("Failed to auto-save:", error);
    }
  };
  
  export const loadSavedContent = (key) => {
    if (typeof window === 'undefined') return "";
    return localStorage.getItem(key) || "";
  };