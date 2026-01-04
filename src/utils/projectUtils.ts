// ✅ Define the TypeScript interfaces
interface Project {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    chapters: { id: string; title: string }[];
  }
  
  // ✅ Fix: Explicitly type parameters for sorting
  export const sortProjects = (projects: Project[], key: keyof Project): Project[] => {
    return [...projects].sort((a, b) => (a[key] > b[key] ? 1 : -1));
  };
  
  // ✅ Fix: Explicitly type parameters for filtering
  export const filterProjects = (projects: Project[], searchTerm: string): Project[] => {
    console.log("projects before filter:", projects);
    if (!projects || !Array.isArray(projects)) {
      console.warn("filterProjects: projects is not an array, returning empty array");
      return [];
    }
    return projects.filter((project) =>
      project?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  