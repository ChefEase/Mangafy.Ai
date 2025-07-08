export const formatStory = (story: string): string => {
    // Split the story into lines
    const lines = story.split("\n");
  
    // Format each line
    const formattedLines = lines.map((line) => {
      if (line.startsWith("### ")) {
        // Format headings (e.g., ### Chapter 1)
        return `<h3>${line.replace("### ", "")}</h3>`;
      } else if (line.startsWith("*[")) {
        // Format panel descriptions (e.g., *[Opening panel: ...])
        return `<p><em>${line.replace("*[", "").replace("]*", "")}</em></p>`;
      } else if (line.startsWith("**")) {
        // Format bold text (e.g., **Title:**)
        return `<strong>${line.replace("**", "")}</strong>`;
      } else if (line.trim() === "---") {
        // Format separators (e.g., ---)
        return `<hr />`;
      } else {
        // Format regular paragraphs
        return `<p>${line}</p>`;
      }
    });
  
    // Join the formatted lines into a single string
    return formattedLines.join("");
  };