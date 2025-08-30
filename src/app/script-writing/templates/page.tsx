"use client";

import { useRouter } from "next/navigation";
import Header from "../Header";
import "./ScriptTemplates.css";
import MobileNav from "../../../components/ScriptEditor/MobileNav"

const templates = [
  { id: 1, name: "Shounen Action", content: `In the first panel, Ryo clenches his fists, determination burning in his eyes, with rubble scattered across the battlefield. Camera angle: low shot looking up for intensity.

In the second panel, he dashes forward through a barrage of glowing strikes, background blurred with speed lines. Camera angle: dynamic tracking shot.

In the third panel, Ryo delivers a powerful punch that cracks the ground beneath his enemy. Camera angle: close-up impact shot.` },

  { id: 2, name: "Romance", content: `In the first panel, under a canopy of cherry blossoms, Aiko looks nervous, petals floating gently around. Camera angle: medium shot from the side.

In the second panel, Kento smiles warmly, the sunlight filtering through blossoms. Camera angle: close-up on his face.` },

  { id: 3, name: "Isekai", content: `In the first panel, Kenji wakes in a glowing mushroom forest, mist curling between giant fungi. Camera angle: wide shot establishing the otherworld.

In the second panel, a floating notification box appears before his stunned face. Camera angle: over-the-shoulder shot.` },

  { id: 4, name: "Horror", content: `In the first panel, the hallway stretches unnaturally long, shadows flickering along cracked walls. Camera angle: extreme long shot.

In the second panel, he turns suddenly, sweat dripping down his face, but the hall is empty. Camera angle: close-up with Dutch angle.` },

  { id: 5, name: "Mystery", content: `In the first panel, Detective Reina examines a cluttered desk with a torn letter and broken watch. Camera angle: overhead shot.

In the second panel, her eyes narrow as a door in the background is shown locked tight. Camera angle: focus pull between her face and the locked door.` },

  { id: 6, name: "Fantasy", content: `In the first panel, Lyra raises her staff, glowing runes swirling around her in a stormy sky. Camera angle: upward shot for grandeur.

In the second panel, a dragon’s eyes gleam as magic sparks fly. Camera angle: dramatic close-up.` },

  { id: 7, name: "Sci-Fi", content: `In the first panel, alarms flash red inside the spaceship, crew panicked at their stations. Camera angle: wide cockpit shot.

In the second panel, Captain Juno grips the controls as Titan looms outside the viewport. Camera angle: close-up with planet filling the window.` },

  { id: 8, name: "Slice of Life", content: `In the first panel, Hana stares at the last piece of cake on a kitchen table, her brother watching eagerly in the background. Camera angle: medium shot.

In the second panel, a comedic close-up of Hana sweating nervously, fork trembling in her hand.` },

  { id: 9, name: "Comedy", content: `In the first panel, Yuto trips in a crowded cafeteria, soda flying midair. Camera angle: exaggerated wide shot.

In the second panel, the soda lands squarely on the principal’s head, dripping everywhere. Camera angle: close-up reaction.` },

  { id: 10, name: "Supernatural", content: `In the first panel, Kei walks alone in a dim room, his shadow stretching unnaturally. Camera angle: overhead shot with long shadows.

In the second panel, the shadow moves on its own, sighing back at him. Camera angle: eerie close-up.` },

  { id: 11, name: "Psychological", content: `In the first panel, a darkened room lit only by his glowing phone, unread messages piling up. Camera angle: over-the-shoulder.

In the second panel, his eyes widen in horror as the text shows “seen.” Camera angle: close-up.` },

  { id: 12, name: "Thriller", content: `In the first panel, Haru’s trembling hands hover over red and blue wires, sweat dripping. Camera angle: extreme close-up of hands.

In the second panel, the ticking bomb timer fills the frame, one minute left. Camera angle: tight focus shot.` },

  { id: 13, name: "Mecha", content: `In the first panel, a massive cockpit seals shut around the pilot, screens lighting up. Camera angle: inside cockpit POV.

In the second panel, the giant robot takes its first thunderous step onto a battlefield of smoke. Camera angle: wide exterior shot.` },

  { id: 14, name: "Historical", content: `In the first panel, the samurai stands against the setting sun, sword drawn, cherry blossoms drifting. Camera angle: long shot silhouette.` },

  { id: 15, name: "Sports", content: `In the first panel, the basketball arcs toward the hoop, the stadium frozen in suspense. Camera angle: dramatic upward shot.` },

  { id: 16, name: "Tragedy", content: `In the first panel, rain pours over a gravestone, a lone figure kneeling before it. Camera angle: wide melancholic shot.` },

  { id: 17, name: "Martial Arts", content: `In the first panel, Master Li strikes with perfect precision, wind swirling around him. Camera angle: dynamic mid-action shot.` },

  { id: 18, name: "Cyberpunk", content: `In the first panel, neon lights flicker over a rain-soaked alley, bounty posters glowing. Camera angle: wide city shot.

In the second panel, the fugitive pulls his hood up, eyes darting. Camera angle: close-up with neon reflections.` },

  { id: 19, name: "Vampire", content: `In the first panel, under the moonlight, a boy reveals sharp fangs with a sly smirk. Camera angle: close-up dramatic shadow.` },

  { id: 20, name: "Steampunk", content: `In the first panel, gears click as a massive airship lifts off, steam hissing around brass pipes. Camera angle: wide establishing shot.` },

  { id: 21, name: "Survival", content: `In the first panel, a group huddles in a dark forest, empty backpacks visible. Camera angle: wide overhead.

In the second panel, glowing eyes peer at them from the shadows. Camera angle: POV from the predator.` },

  { id: 22, name: "Gothic", content: `In the first panel, a candle flickers in the vast emptiness of a crumbling mansion. Camera angle: long corridor shot.` },

  { id: 23, name: "Detective", content: `In the first panel, Detective flips through evidence photos under a dim lamp. Camera angle: overhead.

In the second panel, her face hardens as she realizes the truth is darker than expected. Camera angle: close-up with shadows.` },

  { id: 24, name: "Musical", content: `In the first panel, she strums the final note on her guitar in an empty concert hall. Camera angle: wide shot from stage.` },

  { id: 25, name: "Post-Apocalyptic", content: `In the first panel, ruins of skyscrapers crumble around a lone survivor holding a broken flag. Camera angle: wide shot, ash falling.` },

  { id: 26, name: "Magical Girl", content: `In the first panel, her wand glows with dazzling sparkles as she shouts her attack. Camera angle: heroic low angle.` },

  { id: 27, name: "Ghost Story", content: `In the first panel, a mirror shows a figure who isn’t in the room. Camera angle: eerie close-up reflection.` },

  { id: 28, name: "War", content: `In the first panel, soldiers wait in silence, fog covering the battlefield. Camera angle: wide shot.

In the second panel, cannons erupt in flames, shaking the ground. Camera angle: explosive low angle.` },

  { id: 29, name: "Crime", content: `In the first panel, a vault door swings open, diamonds missing from their cases. Camera angle: wide overhead.

In the second panel, a detective mutters, “We have a problem,” his face half in shadow. Camera angle: close-up.` },

  { id: 30, name: "Dystopian", content: `In the first panel, giant holographic screens flash the word “OBEY” across a silent city. Camera angle: wide cityscape.

In the second panel, a faceless enforcer looms over the crowd. Camera angle: low perspective.` }
];


export default function TemplatesPage() {
  const router = useRouter();

  const handleApplyTemplate = (content: string) => {
    localStorage.setItem("selected-template", content);
    router.push("/script-writing?source=template");
  };

  return (
    <div>
      <Header />
      <div className="templates-section">
        <h2>Script Template Ideas</h2>
        <div>
        <MobileNav /> {/* Only visible on mobile */}
        </div>
        <div className="templates-grid">
          {templates.map((template) => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => handleApplyTemplate(template.content)}
            >
              <h3>{template.name}</h3>
              <div dangerouslySetInnerHTML={{ __html: template.content }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}