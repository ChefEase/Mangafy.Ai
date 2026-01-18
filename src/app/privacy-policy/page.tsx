import React from "react";
import "./privacy-policy.css";

const PrivacyPolicy = () => {
  return (
    <div className="privacy-container">
      <header className="privacy-hero" id="summary">
        <h1>Privacy Policy for Mangafy-ai</h1>
        <p className="privacy-updated">Last updated: July 19, 2025</p>

        <div className="privacy-summary">
          <h2>In short</h2>
          <ul>
            <li>We only collect data needed to run Mangafy.</li>
            <li>Your content is used to provide the service, not sold.</li>
            <li>You can request access or deletion of your data anytime.</li>
          </ul>
        </div>
      </header>

      <nav className="privacy-toc" aria-label="Privacy policy table of contents">
        <h2>Contents</h2>
        <ul>
          <li><a href="#summary">Summary</a></li>
          <li><a href="#definitions">Interpretation and Definitions</a></li>
          <li><a href="#data">Information We Collect</a></li>
          <li><a href="#usage">How We Use Your Data</a></li>
          <li><a href="#content">User Content & AI Processing</a></li>
          <li><a href="#sharing">Sharing & Third Parties</a></li>
          <li><a href="#retention">Data Retention</a></li>
          <li><a href="#security">Security</a></li>
          <li><a href="#rights">Your Rights</a></li>
          <li><a href="#cookies">Cookies</a></li>
          <li><a href="#children">Children’s Privacy</a></li>
          <li><a href="#changes">Policy Updates</a></li>
          <li><a href="#contact">Contact Us</a></li>
        </ul>
      </nav>

      {/* DEFINITIONS */}
      <section className="privacy-section" id="definitions">
        <details>
          <summary>1. Interpretation and Definitions</summary>
          <div className="privacy-section-body">
            <p>Words with capitalized initial letters have meanings defined below.</p>
            <ul>
              <li><strong>Account:</strong> A unique account created to access Mangafy.</li>
              <li><strong>Company:</strong> Mangafy-ai.</li>
              <li><strong>Personal Data:</strong> Any information that identifies you.</li>
              <li><strong>Service:</strong> The Mangafy website and applications.</li>
              <li><strong>Website:</strong> <a href="https://www.mangafyai.com">https://www.mangafyai.com</a></li>
            </ul>
          </div>
        </details>
      </section>

      {/* DATA COLLECTION */}
      <section className="privacy-section" id="data">
        <details>
          <summary>2. Information We Collect</summary>
          <div className="privacy-section-body">
            <ul>
              <li>Account information (email, login credentials)</li>
              <li>User-generated content (scripts, prompts, images you upload)</li>
              <li>Usage data (features used, interactions, error logs)</li>
              <li>Device and browser information</li>
            </ul>
          </div>
        </details>
      </section>

      {/* USAGE */}
      <section className="privacy-section" id="usage">
        <details>
          <summary>3. How We Use Your Data</summary>
          <div className="privacy-section-body">
            <ul>
              <li>To operate and maintain the Mangafy service</li>
              <li>To generate manga panels, characters, and stories</li>
              <li>To improve performance, quality, and reliability</li>
              <li>To provide customer support and respond to requests</li>
              <li>To prevent abuse, fraud, or misuse</li>
            </ul>
          </div>
        </details>
      </section>

      {/* AI CONTENT */}
      <section className="privacy-section" id="content">
        <details>
          <summary>4. User Content & AI Processing</summary>
          <div className="privacy-section-body">
            <p>
              Mangafy processes user-submitted text and images to generate manga-related outputs.
              Your content is used only to provide the service.
            </p>
            <p>
              We do not sell your content. Uploaded content may be temporarily stored to deliver
              results and improve system reliability.
            </p>
          </div>
        </details>
      </section>

      {/* SHARING */}
      <section className="privacy-section" id="sharing">
        <details>
          <summary>5. Sharing & Third-Party Services</summary>
          <div className="privacy-section-body">
            <p>
              We may share limited data with trusted service providers to operate Mangafy, including:
            </p>
            <ul>
              <li>Cloud hosting and storage providers</li>
              <li>Authentication services</li>
              <li>Payment processors (if applicable)</li>
              <li>AI inference and processing services</li>
            </ul>
          </div>
        </details>
      </section>

      {/* RETENTION */}
      <section className="privacy-section" id="retention">
        <details>
          <summary>6. Data Retention</summary>
          <div className="privacy-section-body">
            <p>
              We retain personal data only as long as necessary to provide the service or comply with
              legal obligations. You may request deletion at any time.
            </p>
          </div>
        </details>
      </section>

      {/* SECURITY */}
      <section className="privacy-section" id="security">
        <details>
          <summary>7. Security</summary>
          <div className="privacy-section-body">
            <p>
              We implement reasonable safeguards to protect your data. However, no method of
              transmission or storage is 100% secure.
            </p>
          </div>
        </details>
      </section>

      {/* RIGHTS */}
      <section className="privacy-section" id="rights">
        <details>
          <summary>8. Your Rights</summary>
          <div className="privacy-section-body">
            <p>You may request to:</p>
            <ul>
              <li>Access your data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
            </ul>
          </div>
        </details>
      </section>

      {/* COOKIES */}
      <section className="privacy-section" id="cookies">
        <details>
          <summary>9. Cookies</summary>
          <div className="privacy-section-body">
            <p>
              Cookies are used to maintain sessions, improve performance, and understand usage
              patterns. You can disable cookies in your browser settings.
            </p>
          </div>
        </details>
      </section>

      {/* CHILDREN */}
      <section className="privacy-section" id="children">
        <details>
          <summary>10. Children’s Privacy</summary>
          <div className="privacy-section-body">
            <p>
              Mangafy is not intended for children under 13. We do not knowingly collect personal
              data from children.
            </p>
          </div>
        </details>
      </section>

      {/* CHANGES */}
      <section className="privacy-section" id="changes">
        <details>
          <summary>11. Changes to This Policy</summary>
          <div className="privacy-section-body">
            <p>
              We may update this policy from time to time. Changes will be posted on this page with
              an updated date.
            </p>
          </div>
        </details>
      </section>

      {/* CONTACT */}
      <section className="privacy-section" id="contact">
        <details>
          <summary>12. Contact Us</summary>
          <div className="privacy-section-body">
            <p>
              Email:{" "}
              <a href="mailto:mangaficustomercare@gmail.com">
                mangaficustomercare@gmail.com
              </a>
            </p>
          </div>
        </details>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
