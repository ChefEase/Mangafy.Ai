// DocumentationPage.tsx
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

      {/* Content */}
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

        {/* 2. Creating a Project */}
        <section className="documentation-section">
          <h2>2. Creating a Project</h2>
          <p>
            Click the <span className="highlight">Add Project</span> button. Fill out the project
            information including title, cover picture, and description.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/add-project-placeholder.png" alt="Add Project Screen" />
            <img src="/screenshots/add-project-placeholder(1).png" alt="Add Project Screen" />
          </motion.div>
        </section>

        {/* 3. Managing Projects */}
        <section className="documentation-section">
          <h2>3. Managing Projects</h2>
          <p>
            On desktop: Right-click the project card to add a chapter, rename, or delete the
            project. On mobile: Hold the project card to see the same options.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
  <img src="/screenshots/manage-project-placeholder.png" alt="Manage Project" />
  <img src="/screenshots/manage-project-placeholder.jpg" alt="Manage Project" />
</motion.div>
        </section>

        {/* 4. Referrals */}
        <section className="documentation-section">
          <h2>4. Referrals</h2>
          <p>
            Share your referral link from the website and to claim referral points, the person who is getting referred to needs to sign up through our website(not google login) to earn an extra{" "}
            <span className="highlight">120 credits per signup</span>.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/referral-placeholder (1).png" alt="Referral Link" />
            <img src="/screenshots/referral-placeholder (2).png" alt="Referral Link" />
          </motion.div>
        </section>

        {/* 5. Upgrading */}
        <section className="documentation-section">
          <h2>5. Upgrading to Premium</h2>
          <p>
            Go to your profile → Subscription → Select a plan (Standard or Premium) and complete the
            payment to upgrade.
          </p>
          <motion.div className="documentation-image-card" whileHover={{ scale: 1.03 }}>
            <img src="/screenshots/subscription-placeholder.png" alt="Subscription Screen" />
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
