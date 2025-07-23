"use client";

import React from "react";
import { useRouter } from "next/navigation";
import "./ScriptTemplates.css";

const templates = [
  { id: 1, name: "Hero's Journey", content: "<h1>Hero's Journey</h1><p>Once upon a time...</p>" },
  { id: 2, name: "Romance", content: "<h1>Romance</h1><p>They met under the stars...</p>" },
  { id: 3, name: "Action", content: "<h1>Action</h1><p>The battle raged on...</p>" },
];

const ScriptTemplates = () => {
  const router = useRouter();

  const handleSelectTemplate = (content: string) => {
    // Save the selected template content to localStorage
    localStorage.setItem("selected-template", content);
    // Redirect to the ScriptEditor page
    router.push("/script-writing?source=template");
  };

  return (
    <div className="script-templates">
      <h3 className="custom-header">Script Templates</h3>  {/* Add the class for customization */}
      <ul>
        {templates.map((template) => (
          <li key={template.id} onClick={() => handleSelectTemplate(template.content)}>
            {template.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScriptTemplates;