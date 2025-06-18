// DMGT Assessment Form - Footer Component
// Professional footer with branding and links

import React from 'react';
import './Footer.css';

const Footer = () => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Version information (could be moved to config later)
  const version = process.env.REACT_APP_VERSION || '1.0.0';
  const buildDate = process.env.REACT_APP_BUILD_DATE || new Date().toISOString().split('T')[0];

  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Main Footer Content */}
        <div className="footer-content">
          
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-brand-title">
                DMGT Assessment Platform
              </div>
            </div>
            <p className="footer-brand-subtitle">
              Professional enterprise-grade assessment tool for evaluating organizational 
              data and AI readiness capabilities. Empowering businesses with actionable 
              insights for digital transformation.
            </p>
          </div>

          {/* Links Section */}
          <div className="footer-links">
            
            {/* Platform Links */}
            <div className="footer-column">
              <h3 className="footer-column-title">Platform</h3>
              <ul className="footer-link-list">
                <li><a href="/" className="footer-link">Home</a></li>
                <li><a href="/company" className="footer-link">Company Assessment</a></li>
                <li><a href="/employee" className="footer-link">Employee Assessment</a></li>
                <li><a href="#features" className="footer-link">Features</a></li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="footer-column">
              <h3 className="footer-column-title">Resources</h3>
              <ul className="footer-link-list">
                <li><a href="#documentation" className="footer-link">Documentation</a></li>
                <li><a href="#guides" className="footer-link">User Guides</a></li>
                <li><a href="#best-practices" className="footer-link">Best Practices</a></li>
                <li><a href="#api" className="footer-link">API Reference</a></li>
              </ul>
            </div>

            {/* Support Links */}
            <div className="footer-column">
              <h3 className="footer-column-title">Support</h3>
              <ul className="footer-link-list">
                <li><a href="#help" className="footer-link">Help Center</a></li>
                <li><a href="#contact" className="footer-link">Contact Us</a></li>
                <li><a href="#status" className="footer-link">System Status</a></li>
                <li><a href="#feedback" className="footer-link">Feedback</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="footer-column">
              <h3 className="footer-column-title">Legal</h3>
              <ul className="footer-link-list">
                <li><a href="#privacy" className="footer-link">Privacy Policy</a></li>
                <li><a href="#terms" className="footer-link">Terms of Service</a></li>
                <li><a href="#security" className="footer-link">Security</a></li>
                <li><a href="#compliance" className="footer-link">Compliance</a></li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            
            {/* Copyright */}
            <div className="footer-copyright">
              <p>
                © {currentYear} DMGT Assessment Platform. All rights reserved.
              </p>
              <p className="footer-version">
                Version {version} • Build {buildDate}
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="footer-features">
              <div className="footer-feature">
                <span className="footer-feature-icon">🔒</span>
                <span className="footer-feature-text">Secure</span>
              </div>
              <div className="footer-feature">
                <span className="footer-feature-icon">⚡</span>
                <span className="footer-feature-text">Fast</span>
              </div>
              <div className="footer-feature">
                <span className="footer-feature-icon">📊</span>
                <span className="footer-feature-text">Analytics</span>
              </div>
              <div className="footer-feature">
                <span className="footer-feature-icon">☁️</span>
                <span className="footer-feature-text">Cloud</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;