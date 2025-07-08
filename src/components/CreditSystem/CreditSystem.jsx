"use client";
import React, { useState, useEffect } from 'react';
import './CreditSystem.css';
import { useCredits } from "@/context/CreditContext"; // wherever your CreditContext is

const CreditSystem = () => {
  // User's current token balance
  const [tokens, setTokens] = useState(50); // Starting with 50 for testing
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('features');
const { addCredits } = useCredits();

  // Feature costs
  const featureCosts = {
    manga: 8,
    script: 8,
    character: 10,
    imageToImage: 12,
    coverArt: 10,
    chatbot: 5,
    saveProject: 1,
    mangaPanel: { // Add manga panel costs
      onePanel: 12,
      twoPanels: 22,
      threePanels: 30
    }
  };

  // Credit packages
  const creditPackages = [
    { id: 1, name: "Starter", price: "$5", credits: 500, bonus: 50, popular: false },
    { id: 2, name: "Creator", price: "$15", credits: 1600, bonus: 0, popular: true },
    { id: 3, name: "Enterprise", price: "$50", credits: 6000, bonus: 0, popular: false }
  ];

  // Handle feature usage
  const useFeature = (feature, panelCount = 1) => {
    let cost;
    
    if (feature === 'mangaPanel') {
      cost = featureCosts.mangaPanel[
        panelCount === 1 ? 'onePanel' : 
        panelCount === 2 ? 'twoPanels' : 'threePanels'
      ];
    } else {
      cost = featureCosts[feature];
    }
  
    if (tokens >= cost) {
      setTokens(tokens - cost);
      return true;
    } else {
      alert(`Not enough tokens! You need ${cost - tokens} more tokens for this feature.`);
      return false;
    }
  };

  // Simulate package purchase
  const purchasePackage = async (pkg) => {
    setSelectedPackage(pkg);
    const totalCredits = pkg.credits + pkg.bonus;
    setTokens(tokens + totalCredits);
    await addCredits(totalCredits);
    setShowPurchaseSuccess(true);
    setTimeout(() => setShowPurchaseSuccess(false), 3000);
  };

  return (
    <div className="credit-system">
      <div className="credit-header">
        <h2>Token Credit System</h2>
        <div className="token-balance">
          <span className="token-count">{tokens}</span>
          <span className="token-label">Tokens Available</span>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          Features
        </button>
        <button 
          className={`tab-button ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          Credit Packages
        </button>
      </div>

      {activeTab === 'features' && (
        <div className="features-section">
          <h3>Generate Content</h3>
          <p className="subtext">Each feature consumes tokens based on processing requirements</p>
          
          <div className="feature-grid">
            <div className="feature-card" onClick={() => useFeature('manga')}>
              <div className="feature-icon">🎨</div>
              <h4>Manga Generation</h4>
              <p className="token-cost">{featureCosts.manga} tokens</p>
            </div>

            <div className="feature-card" onClick={() => useFeature('script')}>
              <div className="feature-icon">📜</div>
              <h4>Script Generation</h4>
              <p className="token-cost">{featureCosts.script} tokens</p>
            </div>

            <div className="feature-card" onClick={() => useFeature('character')}>
              <div className="feature-icon">👤</div>
              <h4>Character Generation</h4>
              <p className="token-cost">{featureCosts.character} tokens</p>
            </div>

            <div className="feature-card" onClick={() => useFeature('imageToImage')}>
              <div className="feature-icon">🖼️</div>
              <h4>Image-to-Image</h4>
              <p className="token-cost">{featureCosts.imageToImage} tokens</p>
            </div>

            <div className="feature-card" onClick={() => useFeature('coverArt')}>
              <div className="feature-icon">🖌️</div>
              <h4>Cover Art</h4>
              <p className="token-cost">{featureCosts.coverArt} tokens</p>
            </div>

            <div className="feature-card" onClick={() => useFeature('chatbot')}>
              <div className="feature-icon">💬</div>
              <h4>AI Chatbot (100 messages)</h4>
              <p className="token-cost">{featureCosts.chatbot} tokens</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="packages-section">
          <h3>Credit Packages</h3>
          <p className="subtext">Buy more tokens in bulk for better value</p>
          
          <div className="package-grid">
            {creditPackages.map((pkg) => (
              <div 
                key={pkg.id} 
                className={`package-card ${pkg.popular ? 'popular' : ''}`}
                onClick={() => purchasePackage(pkg)}
              >
                {pkg.popular && <div className="popular-badge">Best Value</div>}
                <h4>{pkg.name}</h4>
                <div className="package-price">{pkg.price}</div>
                <div className="package-credits">
                  <span className="credits-amount">{pkg.credits + pkg.bonus}</span>
                  <span className="credits-label">Tokens</span>
                </div>
                {pkg.bonus > 0 && (
                  <div className="bonus-credits">+ {pkg.bonus} bonus tokens</div>
                )}
                <div className="package-features">
                  {pkg.name === 'Enterprise' && <p>Priority GPU Access</p>}
                  {pkg.name === 'Creator' && <p>Free Project Backups</p>}
                </div>
                <button className="purchase-button">Get Package</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPurchaseSuccess && selectedPackage && (
        <div className="purchase-success">
          Success! Added {selectedPackage.credits + selectedPackage.bonus} tokens to your account.
        </div>
      )}
    </div>
  );
};

export default CreditSystem;