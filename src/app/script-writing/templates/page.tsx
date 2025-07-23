"use client";

import { useRouter } from "next/navigation";
import Header from "../Header";
import "./ScriptTemplates.css";

const templates = [
  { id: 1, name: "Shounen Action", content: "<h1>Fists of Determination</h1><p>Ryo clenched his fists. \"I won’t lose!\" He dashed forward, dodging a barrage of attacks before delivering a powerful punch.</p>" },
  { id: 2, name: "Romance", content: "<h1>Blossoms of Love</h1><p>Under the cherry blossoms, Aiko hesitated. \"I... I like you.\" Kento blinked in surprise before a warm smile formed. \"Me too.\"</p>" },
  { id: 3, name: "Isekai", content: "<h1>Awakening in Another World</h1><p>Kenji awoke in a field of glowing mushrooms. A notification appeared: [Welcome to Eldoria, Hero]. \"What... is this?\"</p>" },
  { id: 4, name: "Horror", content: "<h1>Whispers in the Dark</h1><p>The hallway stretched longer with every step. Shadows whispered his name. He turned... but nothing was there. Yet.</p>" },
  { id: 5, name: "Mystery", content: "<h1>The Clue That Didn't Fit</h1><p>A torn letter, a missing watch, and a locked door. Detective Reina’s eyes narrowed. \"Something doesn’t add up.\"</p>" },
  { id: 6, name: "Fantasy", content: "<h1>Spell of the Ancients</h1><p>The dragon’s eyes gleamed. Lyra raised her staff, chanting. The runes glowed, and with a gust of wind, magic roared to life.</p>" },
  { id: 7, name: "Sci-Fi", content: "<h1>Crash Landing on Titan</h1><p>The ship's alarms blared. Captain Juno gritted her teeth. \"Hyperdrive failure! Prepare for emergency landing on Titan!\"</p>" },
  { id: 8, name: "Slice of Life", content: "<h1>The Cake Dilemma</h1><p>Hana sighed, staring at the last piece of cake. Sharing it with her little brother or eating it? The toughest decision yet.</p>" },
  { id: 9, name: "Comedy", content: "<h1>Soda Disaster</h1><p>Yuto tripped, launching his soda into the air. It landed... on the principal’s head. The entire cafeteria fell silent.</p>" },
  { id: 10, name: "Supernatural", content: "<h1>The Shadow That Moved</h1><p>Kei’s shadow moved... but he hadn’t. \"Did you just sigh?\" The shadow nodded. Kei screamed.</p>" },
  { id: 11, name: "Psychological", content: "<h1>Unseen Watcher</h1><p>Every message in his phone had been read. He hadn’t opened them. Someone was watching.</p>" },
  { id: 12, name: "Thriller", content: "<h1>Red or Blue?</h1><p>One minute until the bomb detonated. Haru’s hands trembled as he cut the wire. Red or blue?</p>" },
  { id: 13, name: "Mecha", content: "<h1>The First Step</h1><p>The cockpit sealed shut. \"Launch sequence, go!\" The giant robot roared to life, taking its first step onto the battlefield.</p>" },
  { id: 14, name: "Historical", content: "<h1>The Last Samurai's Stand</h1><p>The samurai drew his blade, facing the setting sun. \"This will be my final battle.\"</p>" },
  { id: 15, name: "Sports", content: "<h1>The Game Winning Shot</h1><p>The ball soared through the air. The entire stadium held its breath. \"Will it go in?!\"</p>" },
  { id: 16, name: "Tragedy", content: "<h1>Too Late</h1><p>Raindrops fell on the gravestone. \"I was too late...\"</p>" },
  { id: 17, name: "Martial Arts", content: "<h1>Strike of the Master</h1><p>Master Li moved like the wind. One strike, one victory.</p>" },
  { id: 18, name: "Cyberpunk", content: "<h1>10 Minutes to Disappear</h1><p>The neon lights flickered. A bounty was on his head. He had 10 minutes to disappear.</p>" },
  { id: 19, name: "Vampire", content: "<h1>Moonlit Fangs</h1><p>The girl’s eyes widened. \"You’re... a vampire?!\" He smirked, fangs glinting under the moon.</p>" },
  { id: 20, name: "Steampunk", content: "<h1>Skybound Voyage</h1><p>The gears clicked into place. The airship rose, its brass engines hissing steam.</p>" },
  { id: 21, name: "Survival", content: "<h1>The Hunt Begins</h1><p>They were stranded. No food. No water. And something was hunting them.</p>" },
  { id: 22, name: "Gothic", content: "<h1>The Candle in the Dark</h1><p>The mansion loomed, cold and lifeless. Yet, a candle flickered inside.</p>" },
  { id: 23, name: "Detective", content: "<h1>The Twisted Truth</h1><p>The evidence was clear. But the truth? Far more twisted.</p>" },
  { id: 24, name: "Musical", content: "<h1>The Final Note</h1><p>The melody echoed in the concert hall. She strummed the final note, her heart racing.</p>" },
  { id: 25, name: "Post-Apocalyptic", content: "<h1>Hope in the Ashes</h1><p>The world had ended. But he still had hope.</p>" },
  { id: 26, name: "Magical Girl", content: "<h1>Moonlight Blessing</h1><p>Her wand sparkled. \"Moonlight Blessing!\"</p>" },
  { id: 27, name: "Ghost Story", content: "<h1>Reflections of the Unknown</h1><p>The mirror reflected someone else. Someone who wasn’t there.</p>" },
  { id: 28, name: "War", content: "<h1>The Roar of Cannons</h1><p>The battlefield was silent. Then, the cannons roared.</p>" },
  { id: 29, name: "Crime", content: "<h1>The Vanishing Diamonds</h1><p>The vault was open. The diamonds were gone. \"We have a problem.\"</p>" },
  { id: 30, name: "Dystopian", content: "<h1>The Last Warning</h1><p>\"Obey.\" The word flashed on every screen. \"Or disappear.\"</p>" }
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