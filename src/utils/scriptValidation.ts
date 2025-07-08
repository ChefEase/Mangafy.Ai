export const validateScript = (content: string): string[] => {
  const errors: string[] = [];
  if (!content || content.trim().length < 100) {
    errors.push("Script must be at least 100 characters long.");
  }
  return errors;
}; 