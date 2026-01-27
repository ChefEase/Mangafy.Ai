// DocumentationPage.tsx
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
          href="https://youtu.be/2cWoyazCpBY"
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
          Project Documentation
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          A focused guide to creating, managing, and growing your projects.
        </motion.p>
      </header>

      {/* Content */}
      <main className="documentation-main">
        <section className="documentation-intro">
          <div className="doc-summary">
            <h2>Quick Summary</h2>
            <p>
              In this guide, you will learn how to log in, create a project, manage chapters,
              earn referral credits, and upgrade your plan.
            </p>
            <div className="doc-summary-grid">
              <div className="doc-summary-item">
                <span className="doc-summary-label">Start Here</span>
                <p>Log in, add a project, and open it to begin working on chapters.</p>
              </div>
              <div className="doc-summary-item">
                <span className="doc-summary-label">Core Actions</span>
                <p>Create, rename, add chapters, and delete projects from the project card.</p>
              </div>
              <div className="doc-summary-item">
                <span className="doc-summary-label">Growth</span>
                <p>Share referrals to earn credits and upgrade when you are ready.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 1. Logging In */}
        <section className="documentation-section doc-card">
          <div className="doc-card-header">
            <h2>1. Logging In</h2>
            <p className="doc-lead">
              Sign in with Google or website credentials. Website login qualifies for referral
              credits.
            </p>
          </div>
          <ol className="doc-steps">
            <li>Select Google or Email login.</li>
            <li>Use website login to unlock referral credits.</li>
          </ol>
          <div className="doc-figure-grid">
            <figure className="doc-figure">
              <img src="/screenshots/login-placeholder (1).png" alt="Login Screen" />
              <figcaption>Login with email</figcaption>
            </figure>
            <figure className="doc-figure">
              <img src="/screenshots/login-placeholder (2).png" alt="Login Screen" />
              <figcaption>Login with Google</figcaption>
            </figure>
          </div>
        </section>

        {/* 2. Creating a Project */}
        <section className="documentation-section doc-card">
          <div className="doc-card-header">
            <h2>2. Creating a Project</h2>
            <p className="doc-lead">
              Click the <span className="highlight">Add Project</span> button and enter your project
              details.
            </p>
          </div>
          <ol className="doc-steps">
            <li>Add a title, cover image, and short description.</li>
            <li>Save to generate your project card.</li>
          </ol>
          <div className="doc-figure-grid">
            <figure className="doc-figure">
              <img src="/screenshots/add-project-placeholder.png" alt="Add Project Screen" />
              <img src="/screenshots/add-project-placeholder(1).png" alt="Add Project Screen" />
              <figcaption>Add project form</figcaption>
            </figure>
            <figure className="doc-figure">
              <img src="/screenshots/add-project-placeholder(2).png" alt="Add Project Screen" />
              <figcaption>Project created</figcaption>
            </figure>
          </div>
        </section>

        {/* 3. Managing Projects */}
        <section className="documentation-section doc-card">
          <div className="doc-card-header">
            <h2>3. Managing Projects</h2>
            <p className="doc-lead">
              Click a project card to access actions for opening, renaming, adding chapters, or
              deleting.
            </p>
          </div>
          <ol className="doc-steps">
            <li>Select a project card to open the action panel.</li>
            <li>Choose Open, Rename, or Delete.</li>
          </ol>
          <div className="doc-figure-grid">
            <figure className="doc-figure">
              <img src="/screenshots/manage-project-placeholder.png" alt="Manage Project" />
              <figcaption>Project actions panel</figcaption>
            </figure>
          </div>
        </section>

        <section className="documentation-section doc-card">
          <div className="doc-card-header">
            <h2>4. Start Creating</h2>
            <p className="doc-lead">
              Open a project and click on add chapter, add a chapter name and click ok.
            </p>
          </div>
          <ol className="doc-steps">
            <li>After Creating a chapter</li>
            <li>Click Edit Chapters to start creating.</li>
          </ol>
          <div className="doc-figure-grid">
            <figure className="doc-figure">
              <img src="/screenshots/chapter (1).png" alt="Chapter Editor" />
              <img src="/screenshots/chapter (2).png" alt="Chapter Editor" />
              <figcaption>Adding a Chapter</figcaption>
            </figure>
            <figure className="doc-figure">
            <img src="/screenshots/chapter (3).png" alt="Chapter Editor" />
              <figcaption>Editing a chapter</figcaption>
            </figure>
          </div>
        </section>

        {/* 4. Referrals */}
        <section className="documentation-section doc-card">
          <div className="doc-card-header">
            <h2>5. Referrals</h2>
            <p className="doc-lead">
              Share your referral link from the website to earn credits when new users sign up.
            </p>
          </div>
          <ol className="doc-steps">
            <li>Copy your referral link from the website.</li>
            <li>
              New users must sign up through the website (not Google) to earn{" "}
              <span className="highlight">120 credits per signup</span>.
            </li>
          </ol>
          <div className="doc-figure-grid">
            <figure className="doc-figure">
              <img src="/screenshots/referral-placeholder (1).png" alt="Referral Link" />
              <figcaption>Referral link</figcaption>
            </figure>
            <figure className="doc-figure">
              <img src="/screenshots/referral-placeholder (2).png" alt="Referral Link" />
              <figcaption>Referral share panel</figcaption>
            </figure>
          </div>
        </section>

        {/* 5. Upgrading */}
        <section className="documentation-section doc-card">
          <div className="doc-card-header">
            <h2>6. Upgrading to Premium</h2>
            <p className="doc-lead">
              Go to your profile &gt; Subscription, choose a plan, and complete payment to upgrade.
            </p>
          </div>
          <ol className="doc-steps">
            <li>Select Standard or Premium.</li>
            <li>Complete payment to activate the upgrade.</li>
          </ol>
          <div className="doc-figure-grid">
            <figure className="doc-figure">
              <img src="/screenshots/subscription-placeholder (1).png" alt="Subscription Screen" />
              <figcaption>Subscription overview</figcaption>
            </figure>
            <figure className="doc-figure">
              <img src="/screenshots/subscription-placeholder (2).png" alt="Subscription Screen" />
              <figcaption>Plan selection</figcaption>
            </figure>
            <figure className="doc-figure">
              <img src="/screenshots/subscription-placeholder (3).png" alt="Subscription Screen" />
              <figcaption>Payment confirmation</figcaption>
            </figure>
          </div>
        </section>

      </main>

      {/* Footer */}
      <div className="doc-video-cta doc-video-cta-bottom">
        <span className="doc-video-kicker">Prefer video?</span>
        <a
          className="doc-video-button"
          href="https://youtu.be/2cWoyazCpBY"
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
