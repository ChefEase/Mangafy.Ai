'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Logo from '@/public/logo.png';
import styles from './LandingPage.module.css';
import { useRouter } from 'next/navigation';

const MANGA_SAMPLES: { pages: string[] }[] = [
  {
    pages: [
      '/samples/Chapter1.png',
      '/samples/page 2.png',
      '/samples/page 3.png',
    ],
  },
  {
    pages: [
      '/samples/page 4.png',
      '/samples/page 5.png',
      '/samples/page 6.jpg',
    ],
  },
];


const CAROUSEL_IMAGES = [
  '/samples/sample1.png',
  '/samples/sample2.png',
  '/samples/sample3.png',
  '/samples/sample 4.png',
  '/samples/sample5.png',
  '/samples/sample 6.png',
  '/samples/sample 7.jpeg',
  '/samples/sample 8.png',
  '/samples/sample9.png',
  '/samples/sample 10.png',
  '/samples/sample11.png',
  '/samples/sample12.png',  
  '/samples/sample 13.png',  
  '/samples/sample14.png', 
  '/samples/sample15.png', 
  '/samples/sample16.png', 
  '/samples/sample17.png', 
  '/samples/sample18.png',
  '/samples/sample19.png',
  '/samples/sample20.png',  
  '/samples/sample21.png',  
  '/samples/sample22.png',
  '/samples/sample23.png', 
  '/samples/sample 24.jpeg', 
  '/samples/sample 24.png', 
  '/samples/sample 25.png', 
  '/samples/sample 26.png', 
  '/samples/sample 27.png', 
  '/samples/sample 28.jpeg', 
  '/samples/sample 29.jpeg', 
  '/samples/sample 30.png',  
];

const FEATURES = [
  {
    title: 'AI Character Consistency Engine',
    description:
      'Mangafy.AI uses your uploaded characters and their descriptions to maintain consistent appearances across all manga panels. Our AI parses character roles, traits, and visuals to ensure visual continuity across scenes. Concise and clear descriptions yield the best results, achieving up to 85% character consistency.',
    media: '/samples/sample3.png',
  },

  {
    title: 'Character Library & Profiles',
    description:
      'Store your characters in a dedicated library with saved images, roles, and descriptions. Once added, you no longer need to rewrite full character descriptions for every panel—just reference the character. Only describe clothing when it changes or is panel-specific, saving time and improving consistency.',
      media: [
        '/features/character-library.png',
        '/features/character-library (2).png',
      ],
  },

  {
    title: 'Snapshot & Preset Saves',
    description:
      'Save snapshots of your scripts, generation settings, and advanced options in one click. Re-import them anytime to reuse, tweak, or iterate on previous ideas without starting from scratch. Perfect for experimenting with variations or continuing unfinished projects.',
      media: [
        '/features/snapshots.png',
        '/features/snapshots(1).png',
        '/features/snapshots(2).png',
      ],
  },

  {
    title: 'Genre-Based Script Templates',
    description:
      'Get started instantly with professionally designed script templates tailored for different genres such as action, romance, fantasy, horror, and slice of life. Templates help structure scenes, panel flow, and pacing for better AI-generated results.',
    media: '/features/script-templates.png',
  },

  {
    title: 'AI Recommended Settings',
    description:
      'Mangafy.AI analyzes the content of your script and automatically recommends advanced generation settings. From style strength to composition and continuity options, the AI optimizes technical parameters so creators can focus on storytelling instead of tweaking sliders.',
    media: '/features/ai-recommendations.png',
  },

  {
    title: 'AI Chatbot with Image Upload',
    description:
      'Engage in seamless conversations with our AI chatbot that understands your creative intent. Upload images, ask questions, refine prompts, or get real-time guidance on improving panel composition and storytelling.',
    media: [ 
      '/features/feature.png',
      '/features/feature(1).png',
    ]
  },
];

const PRICING = [
  { plan: 'Free', price: '$0', perks: ['Limited manga generations', 'Basic features'] },
  { plan: 'Pro', price: '$9.99/mo', perks: ['Unlimited manga creations', 'Advanced AI styles', 'Priority support'] },
];

const FAQ = [
  {
    question: 'How does Mangafy.ai work?',
    answer: 'Our AI takes your story input, character pictures and description and generates manga illustrations automatically.',
  },
  {
    question: 'Do I need to be an artist?',
    answer: 'No, Mangafy.ai creates all the art for you based on your story input.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards through our secure payment partner, Stripe.',
  },
  {
    question: 'What apps work well with Mangafy-Ai?',
    answer: 'We recommend Photoshop or any editing app with text bubbles and inpainting tools.',
  }  
];

export default function LandingPage() {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const router = useRouter();
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Detect Electron
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent.toLowerCase();
      setIsElectron(userAgent.includes("electron"));
    }
  }, []);

  // Handler functions
  const handleChooseFree = () => {
    router.push('/Entire-Home-Auth-Page');
  };

  const handleChoosePro = () => {
    router.push('/subscription');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((idx) => (idx + 1) % CAROUSEL_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className={styles.main}>
      {/* Floating vertical carousel behind header */}
      <div className={styles.carouselContainer}>
        <div className={styles.carouselInner}>
          {CAROUSEL_IMAGES.map((img, i) => (
            <div
              key={i}
              className= {styles.carouselItem}>
              <Image
                src={img}
                alt={`Sample manga carousel ${i + 1}`}
                width={150}
                height={250}
                className={styles.carouselImage}
                priority={i === carouselIndex}
              />
            </div>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Image src={Logo} alt="Mangafy.ai Logo" width={48} height={48}/>
          <span className={styles.logoText}>Mangafy.ai</span>
        </div>
      </header>

      {/* HERO */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Welcome to Mangafy-ai</h1>
        <p className={styles.heroSubtitle}>
          Where imagination becomes reality. Create comics and manga with AI.
          <br />
          With one click, turn your stories into manga.
        </p>
        <Link href="/splash-screen" legacyBehavior>
          <a className={styles.ctaButton}>Try Mangafy Now For Free</a>
        </Link>
      </section>
      <Image
    src="/hero_visible_left.jpg"
    alt="Visible Manga Left"
    className={styles.heroImageLeft}
    width={180}
    height={260}
  />
  <Image
    src="/hero_visible_right.jpg"
    alt="Visible Manga Right"
    className={styles.heroImageRight}
    width={180}
    height={260}
  />
<section className={styles['how-to-generate-section']}>
      <h2 className={styles['section-title']}>How to Generate Manga with Mangafy.ai</h2>
      <div className={styles['steps-container']}>
        
        <div className={styles['step-card']}>
          <img src="/steps/daichi.jpeg" alt="Step 1" className={styles['step-image']} />
          <h3 className={styles['step-title']}>Step 1: Get Your Character</h3>
          <p className={styles['step-description']}>Use a reference or image for your character idea.</p>
        </div>

        <div className={styles['step-card']}>
          <img src="/steps/step2.png" alt="Step 2" className={styles['step-image']} />
          <h3 className={styles['step-title']}>Step 2: Upload Character</h3>
          <p className={styles['step-description']}>Upload it, name it, and describe the physical features, role (e.g., protagonist).</p>
        </div>

        <div className={styles['step-card']}>
          <img src="/steps/step3.png" alt="Step 3" className={styles['step-image']} />
          <h3 className={styles['step-title']}>Step 3: Write Your Story</h3>
          <p className={styles['step-description']}>Describe each panel with characters, background, and camera angle.</p>
        </div>

        <div className={styles['step-card']}>
          <div className="image-wrapper">
          <img src="/steps/step4.png" alt="Step 4" className={styles['step-image']} />
          <img src="/icons/mouse.png" alt="Mouse icon" className={styles['mouse-icon']} />
          </div>
          <h3 className={styles['step-title']}>Step 4: Choose Style & Generate</h3>
          <p className={styles['step-description']}>Pick art style, color or B&W, and hit generate!</p>
        </div>

      </div>
    </section>

      {/* SAMPLES */}
      <section className={styles.samplesSection}>
        <h2 className={styles.sectionTitle}>See Mangafy-Ai in Action</h2>
        <div className={styles.samplesWrapper}>
          {MANGA_SAMPLES.map((sample : { pages: string[] }, i: number) => (
            <div key={i} className={styles.sampleRow}>
              {sample.pages.map((page: string, idx: number) => (
                <div key={idx} className={styles.samplePage}>
                  <Image
                    src={page}
                    alt={`Sample manga page ${idx + 1}`}
                    width={600}
                    height={850}
                    className={styles.sampleImage}
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.ctaRowCenter}>
          <Link href="/splash-screen" legacyBehavior>
            <a className={styles.ctaButton}>Try Mangafy Now For Free</a>
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.featuresSection}>
        <h2 className={styles.sectionTitleFeatures}>Features</h2>
        {FEATURES.map(({ title, description, media,}, i) => (
          <div key={i} className={styles.featureItem}>
            <div className={styles.featureText}>
              <h3 className={styles.featureTitle}>{title}</h3>
              <p className={styles.featureDescription}>{description}</p>
              <div className={styles.ctaRow}>
                <Link href="/splash-screen" legacyBehavior>
                  <a className={styles.ctaButton}>Try Mangafy Now For Free</a>
                </Link>
              </div>
            </div>
            <div className={styles.featureMedia}>
              {Array.isArray(media) ? (
                <div className={styles.featureMediaGrid}>
                  {media.map((imgSrc, idx) => (
                    <div key={`${title}-${idx}`} className={styles.featureMediaItem}>
                      <Image
                        src={imgSrc}
                        alt={`${title} preview ${idx + 1}`}
                        width={420}
                        height={280}
                        className={styles.featureImage}
                      />
                    </div>
                  ))}
                </div>
              ) : typeof media === "string" && (media.endsWith(".mp4") || media.endsWith(".webm")) ? (
                <video
                  src={media}
                  width={500}
                  height={350}
                  className={styles.featureImage}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <Image
                  src={media}
                  alt={title}
                  width={500}
                  height={350}
                  className={styles.featureImage}
                />
              )}
            </div>
          </div>
        ))}
      </section>

      {/* PRICING */}
      <section className={styles.pricingSection}>
        <h2 className={styles.sectionTitlePricing}>Pricing</h2>
        <div className={styles.pricingWrapper}>
          {PRICING.map(({ plan, price, perks }) => (
            <div key={plan} className={styles.pricingCard}>
              <h3 className={styles.pricingPlan}>{plan}</h3>
              <p className={styles.pricingPrice}>{price}</p>
              <ul className={styles.pricingPerks}>
                {perks.map((perk, idx) => (
                  <li key={idx}>{perk}</li>
                ))}
              </ul>
              <button
                className={styles.pricingButton}
                onClick={plan === 'Free' ? handleChooseFree : handleChoosePro}
              >
                Choose {plan}
              </button>
            </div>
          ))}
        </div>
      </section>

      {!isElectron && (
        <section className={styles.downloadSection}>
          <div className={styles.downloadContent}>
            <h2 className={styles.downloadTitle}>Get Mangafy.ai for Your Desktop</h2>
            <p className={styles.downloadSubtitle}>
              Enjoy faster performance, offline capabilities, and a smoother manga creation experience
              with our desktop app.
            </p>
            <div className={styles.ctaRowCenter}>
              <Link href="/splash-screen" legacyBehavior>
                <a className={styles.ctaButton}>Try Mangafy Now For Free</a>
              </Link>
            </div>
            <div className={styles.downloadButtons}>
              <a href="/dist/Mangafy.Ai Setup 0.1.0.exe" className={styles.downloadButtonWindows}>
                <img src="/icons/windows3.svg" alt="Windows" /> Download for Windows
              </a>
            </div>
          </div>
        </section>
      )}
      
            {/* RECOMMENDATION FOR NEW USERS */}
            <section className={styles.recommendationSection}>
        <h2 className={styles.sectionTitle}>New to Mangafy.ai?</h2>
        <p className={styles.recommendationText}>
          For new users, we recommend you read our documentation pages on how to{" "}
          <Link href="/documentation-project-management" className={styles.docLink}>
            create projects
          </Link>{" "}
          and{" "}
          <Link href="/documentation" className={styles.docLink}>
            generate images
          </Link>.
        </p>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <h2 className={styles.sectionTitleFaq}>FAQ</h2>
        {FAQ.map(({ question, answer }, i) => (
          <div key={i} className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>{question}</h4>
            <p className={styles.faqAnswer}>{answer}</p>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <p>
          Contact us: <a href="mailto:mangaficustomercare@gmail.com" className={styles.footerLink}>mangaficustomercare@gmail.com</a>
        </p>
        <p>
          Follow us on{' '}
          <a
            href="https://www.instagram.com/mangafy.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            Instagram
          </a>
        </p>
        <p className={styles.footerCopy}>© 2025 Mangafy.ai</p>
      </footer>
    </main>
  );
}
