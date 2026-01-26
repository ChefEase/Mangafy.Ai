"use client";

import React from "react";
import { motion } from "framer-motion";
import "./DocumentationPage.css";

const DocumentationPage: React.FC = () => {
  return (
    <div className="documentation-page">
      <div className="doc-video-cta">
        <span className="doc-video-kicker">Prefer video?</span>
        <a
          className="doc-video-button"
          href="https://www.youtube.com"
          target="_blank"
          rel="noreferrer"
        >
          <span className="doc-video-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z" />
            </svg>
          </span>
          Watch the 5-minute tutorial on YouTube
        </a>
      </div>
      {/* Header */}
      <header className="documentation-header">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          App Documentation
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Everything you need to plan, write, and generate your manga.
        </motion.p>
      </header>

      {/* Main Content */}
      <main className="documentation-main">
        <section className="doc-intro">
          <div className="doc-intro-card">
            <h2>Quick Summary</h2>
            <p>
              This guide walks you through logging in, writing scripts, controlling generation,
              managing characters, and exporting your final panels.
            </p>
            <div className="doc-callout doc-tip">
              <strong>Tip:</strong> Start with the story box format if you are new, then refine with
              Advanced Options.
            </div>
          </div>

          <nav className="doc-toc" aria-label="Documentation table of contents">
            <h3>On this page</h3>
            <ul>
              <li>
                <a href="#login">Logging In</a>
              </li>
              <li>
                <a href="#story-writing">Writing Your Story</a>
              </li>
              <li>
                <a href="#advanced-options">Advanced Options</a>
              </li>
              <li>
                <a href="#character-management">Character Management</a>
              </li>
              <li>
                <a href="#referrals">Referrals</a>
              </li>
              <li>
                <a href="#chatbot-templates">Chatbot, Templates, Ideas</a>
              </li>
              <li>
                <a href="#generate-gallery">Generate and Gallery</a>
              </li>
              <li>
                <a href="#upgrading">Upgrading to Premium</a>
              </li>
              <li>
                <a href="#text-box">Text Box</a>
              </li>
            </ul>
          </nav>
        </section>

        {/* 1. Logging In */}
        <section className="documentation-section" id="login">
          <h2>1. Logging In</h2>
          <p>
            You can log in either using Google or via our website credentials. Logging in through
            the website gives you extra referral credits.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/login-placeholder (1).png" alt="Login Screen" />
            <img src="/screenshots/login-placeholder (2).png" alt="Login Screen" />
          </motion.div>
        </section>

        {/* 2. Story Editor */}
        <section className="documentation-section" id="story-writing">
          <h2>2. Writing Your Story</h2>
          <p className="doc-lead">
            Inside a project, use the tab header to switch between the Story Text Box and Advanced
            Options.
          </p>
          <div className="doc-subsection">
            <h3>Story box format</h3>
            <p>
              You can write directly or upload a Word or PDF file. Use the panel format below to
              keep scenes consistent.
            </p>
            <pre className="doc-code">
              <code>
                {`In first panel, (action), (setting), (camera angle).
In second panel, (action), (setting), (camera angle).
In third panel, (action), (setting), (camera angle).`}
              </code>
            </pre>
          </div>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/storybox (1).png" alt="Story Text Box" />
            <img src="/screenshots/storybox (2).png" alt="Story Text Box" />
            <img src="/screenshots/storybox (3).png" alt="Story Text Box" />
          </motion.div>
        </section>

        {/* 3. Advanced Options */}
        <section className="documentation-section" id="advanced-options">
          <h2>3. Advanced Options</h2>
          <p className="doc-lead">
            Switch to the Advanced Options tab to control generation settings.
          </p>
          <ul className="doc-list">
            <li>
              <strong>Style Presets:</strong> Choose a look like Cinematic, Photographic, Anime, or
              Digital Art.
            </li>
            <li>
              <strong>Art Style:</strong> Select Default Manga, One Piece, Jujutsu Kaisen, My Hero
              Academia, and more.
            </li>
            <li>
              <strong>Panel Layout:</strong> Choose your manga or comic grid layout.
            </li>
            <li>
              <strong>Color Options:</strong> Full color or black and white.
            </li>
            <li>
              <strong>Lighting and Mood:</strong> Presets like Neon, Sunset, or Cinematic.
            </li>
            <li>
              <strong>Mangafy Checkbox:</strong> Adds traditional manga effects like inking and
              cross-hatching.
            </li>
            <li>
              <strong>Custom Art Style:</strong> Add your own style prompt.
            </li>
            <li>
              <strong>Guidance Scale:</strong> 1-15 controls how closely the AI sticks to your
              prompt. Recommended value is 7.
            </li>
            <li>
              <strong>Seed and Randomizer:</strong> Keep a seed for consistent results, randomize
              for variation.
            </li>
          </ul>
          <div className="doc-callout doc-important">
            <strong>Important:</strong> Keep your seed consistent across chapters if you want a
            unified art style.
          </div>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/advanced-options.png" alt="Advanced Options Panel" />
            <img src="/screenshots/advanced-options (1).png" alt="Advanced Options Panel" />
            <img src="/screenshots/advanced-options (2).png" alt="Advanced Options Panel" />
            <img src="/screenshots/advanced-options (3).png" alt="Advanced Options Panel" />
            <img src="/screenshots/advanced-options (4).png" alt="Advanced Options Panel" />
            <img src="/screenshots/advanced-options (5).png" alt="Advanced Options Panel" />
          </motion.div>
        </section>

        {/* 4. Character Management */}
        <section className="documentation-section" id="character-management">
          <h2>4. Character Management</h2>
          <p className="doc-lead">
            Use the Character Bar to upload, edit, or delete characters. Each character includes an
            image, name, role, and description for the AI.
          </p>
          <div className="doc-subsection">
            <h3>Character description vs script box</h3>
            <p>Use the character description for permanent traits only:</p>
            <ul className="doc-list">
              <li>Hair, eyes, face features, body type</li>
              <li>Age or vibe</li>
              <li>Scars, tattoos, glasses, etc.</li>
            </ul>
            <div className="doc-callout doc-warning">
              <strong>Common mistake:</strong> Do not include clothing here unless it never changes.
            </div>
            <p>Use the script box for anything that can change panel to panel:</p>
            <ul className="doc-list">
              <li>Clothing and accessories</li>
              <li>Actions and emotions</li>
              <li>Environment and scene changes</li>
            </ul>
            <pre className="doc-code">
              <code>
                {`Character Description
Riku is a teenage boy with messy black hair, blue eyes, and a tired expression.

Script
In the first panel, Riku is crying at home. He is wearing a white t-shirt and blue sweatpants.
In the second panel, his sister Hina enters the room.`}
              </code>
            </pre>
          </div>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/character-management (1).png" alt="Character Management" />
            <img src="/screenshots/character-management (2).png" alt="Character Management" />
            <img src="/screenshots/character-management (3).png" alt="Character Management" />
          </motion.div>
        </section>

        {/* 5. Referrals */}
        <section className="documentation-section" id="referrals">
          <h2>5. Referrals</h2>
          <p>
            Share your referral link from the website (not Google login) to earn an extra{" "}
            <span className="highlight">120 credits per signup</span>.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/referral-placeholder (1).png" alt="Referral Link" />
            <img src="/screenshots/referral-placeholder (2).png" alt="Referral Link" />
          </motion.div>
        </section>

        {/* 6. Chatbot & Templates */}
        <section className="documentation-section" id="chatbot-templates">
          <h2>6. Chatbot, Templates and Ideas</h2>
          <p>
            Use the <span className="highlight">AI Chatbot</span> to ask questions, upload pictures,
            or get feedback. Explore script templates and panel format ideas to structure your
            manga quickly.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/chatbot (1).png" alt="Chatbot Screen" />
            <img src="/screenshots/chatbot (2).png" alt="Chatbot Screen" />
            <img src="/screenshots/chatbot (3).png" alt="Chatbot Screen" />
            <img src="/screenshots/chatbot (4).png" alt="Chatbot Screen" />
          </motion.div>
        </section>

        {/* 7. Generating & Gallery */}
        <section className="documentation-section" id="generate-gallery">
          <h2>7. Generate and Gallery</h2>
          <p>
            When you are ready, hit <span className="highlight">Generate</span> to create manga
            panels. Generated panels are saved in the Gallery below the canvas for easy download or
            sharing.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/gallery.png" alt="Gallery Example" />
            <img src="/screenshots/gallery(1).png" alt="Gallery Example" />
          </motion.div>
        </section>

        {/* 8. Upgrading */}
        <section className="documentation-section" id="upgrading">
          <h2>8. Upgrading to Premium</h2>
          <p>
            Go to Profile &gt; Subscription. Select a plan (Standard or Premium) and complete
            payment to upgrade.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/subscription-placeholder (1).png" alt="Subscription Screen" />
          </motion.div>
        </section>

        <section className="documentation-section" id="text-box">
          <h2>9. Text Box</h2>
          <p>
            To create or add text boxes, use other apps like Medibang Paint or Clip Studio Paint. To
            edit generated images, use third-party apps since in-app editing is not available yet.
          </p>
          <div className="doc-callout doc-tip">
            <strong>Tip:</strong> Keep a layered PSD or CLIP file so edits are easier later.
          </div>
        </section>
      </main>

      {/* Footer */}
      <div className="doc-video-cta doc-video-cta-bottom">
        <span className="doc-video-kicker">Prefer video?</span>
        <a
          className="doc-video-button"
          href="https://www.youtube.com"
          target="_blank"
          rel="noreferrer"
        >
          <span className="doc-video-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z" />
            </svg>
          </span>
          Watch the 5-minute tutorial on YouTube
        </a>
      </div>
      <footer className="documentation-footer">
        <p>(c) {new Date().getFullYear()} Mangafy.AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default DocumentationPage;
