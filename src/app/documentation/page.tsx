"use client";

import React from "react";
import { motion } from "framer-motion";
import "./DocumentationPage.css";

const DocumentationPage: React.FC = () => {
  return (
    <div className="documentation-page">
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
          How to use our platform
        </motion.p>
      </header>

      {/* Main Content */}
      <main className="documentation-main">
        {/* 1. Logging In */}
        <section className="documentation-section">
          <h2>1. Logging In</h2>
          <p>
            You can log in either using Google or via our website credentials.
            Logging in through the website gives you extra referral credits.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/login-placeholder (1).png" alt="Login Screen" />
            <img src="/screenshots/login-placeholder (2).png" alt="Login Screen" />
          </motion.div>
        </section>

        {/* 2. Story Editor */}
        <section className="documentation-section">
          <h2>2. Writing Your Story</h2>
          <p>
            Once inside your project, you'll see a <span className="highlight">tab header</span> that lets you switch between
            the <strong>Story Text Box</strong> and the <strong>Advanced Options</strong> panel.
          </p>
          <p>
            In the story box, you can <span className="highlight">write directly</span> or
            <span className="highlight"> upload a Word or PDF file</span>. 
            Each scene or panel should follow this format:
          </p>
          <ul className="doc-list">
            <li><b>For one panel:</b> In first panel (action), (setting), (camera angle)</li>
            <li><b>For two panels:</b> In first panel (action)... In second panel (action)...</li>
            <li><b>For three panels:</b> Continue the same pattern</li>
          </ul>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/storybox.png" alt="Story Text Box" />
          </motion.div>
        </section>

        {/* 3. Advanced Options */}
        <section className="documentation-section">
          <h2>3. Advanced Options</h2>
          <p>
            Switch to the <span className="highlight">Advanced Options</span> tab to control generation settings.
            Here, you’ll find:
          </p>
          <ul className="doc-list">
            <li><b>Style Presets</b> – Choose from predefined looks (you’ll list your styles).</li>
            <li><b>Art Style</b> – Pick your preferred drawing style (you’ll list these too).</li>
            <li><b>Panel Layout</b> – Select your manga/comic panel layout.</li>
            <li><b>Color Options</b> – Choose between full color or black & white.</li>
            <li><b>Mangafy Checkbox</b> – Adds traditional manga effects like inking, cross-hatching, shading, etc. (Not applicable for the default “Manga” option.)</li>
            <li><b>Custom Art Style</b> – Input your own prompt if you want a unique art style.</li>
            <li><b>Guidance Scale</b> – (1–15) controls how closely the AI sticks to your prompt.</li>
            <li><b>Seed & Randomizer</b> – Seeds keep results consistent; randomizing changes the look.</li>
          </ul>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/advanced-options.png" alt="Advanced Options Panel" />
          </motion.div>
        </section>

        {/* 4. Character Management */}
        <section className="documentation-section">
          <h2>4. Character Management</h2>
          <p>
            In the <span className="highlight">Character Bar</span>, you can upload, edit, or delete your characters.
            Each character includes an image, name, role, and a detailed description for the AI.
          </p>
          <p>
            Use this format for accurate generation:  
            <i>1girl, black hair, white skirt, blue eyes, smiling, school uniform</i>
          </p>
          <p>
            You can search characters by <strong>name</strong>, <strong>role</strong>, or <strong>creation date</strong>, 
            and sort results ascending or descending.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/character-management.png" alt="Character Management" />
          </motion.div>
        </section>

        {/* 5. Referrals */}
        <section className="documentation-section">
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
        <section className="documentation-section">
          <h2>6. Chatbot, Templates & Ideas</h2>
          <p>
            Use our <span className="highlight">AI Chatbot</span> to ask questions, upload pictures, or get feedback.
            You can also explore <strong>script templates</strong> and <strong>panel format ideas</strong> to help structure your manga.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/chatbot.png" alt="Chatbot Screen" />
          </motion.div>
        </section>

        {/* 7. Generating & Gallery */}
        <section className="documentation-section">
          <h2>7. Generate & Gallery</h2>
          <p>
            Once ready, hit <span className="highlight">Generate</span> to create your manga panels.
            All generated panels are saved in the <strong>Gallery</strong> below the canvas, where you can
            view, redownload, or share your creations anytime.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/gallery.png" alt="Gallery Example" />
          </motion.div>
        </section>

        {/* 8. Upgrading */}
        <section className="documentation-section">
          <h2>8. Upgrading to Premium</h2>
          <p>
            Go to your profile → Subscription → Select a plan (Standard or Premium) and complete payment to upgrade.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/subscription-placeholder (1).png" alt="Subscription Screen" />
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="documentation-footer">
        <p>© {new Date().getFullYear()} Mangafy.AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default DocumentationPage;
