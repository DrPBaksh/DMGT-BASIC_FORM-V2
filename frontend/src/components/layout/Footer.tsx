// DMGT Assessment Form - Footer Component
// Professional footer with branding and information

import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="url(#footerGradient)" />
                <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h12v2H8v-2z" fill="white" />
                <defs>
                  <linearGradient id="footerGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#007AFF" />
                    <stop offset="1" stopColor="#005cbf" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="footer-brand-text">
              <h3 className="footer-brand-title">DMGT Assessment Platform</h3>
              <p className="footer-brand-subtitle">
                Professional Data & AI Readiness Evaluation
              </p>
            </div>
          </div>

          {/* Links Section */}
          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-column-title">Assessment</h4>
              <ul className="footer-link-list">
                <li><a href="#company" className="footer-link">Company Assessment</a></li>
                <li><a href="#employee" className="footer-link">Employee Assessment</a></li>
                <li><a href="#results" className="footer-link">View Results</a></li>
                <li><a href="#reports" className="footer-link">Generate Reports</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Resources</h4>
              <ul className="footer-link-list">
                <li><a href="#guide" className="footer-link">User Guide</a></li>
                <li><a href="#best-practices" className="footer-link">Best Practices</a></li>
                <li><a href="#benchmarks" className="footer-link">Industry Benchmarks</a></li>
                <li><a href="#faq" className="footer-link">FAQ</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Support</h4>
              <ul className="footer-link-list">
                <li><a href="#contact" className="footer-link">Contact Us</a></li>
                <li><a href="#help" className="footer-link">Help Center</a></li>
                <li><a href="#technical" className="footer-link">Technical Support</a></li>
                <li><a href="#feedback" className="footer-link">Feedback</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Legal</h4>
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
            <div className="footer-copyright">
              <p>&copy; {currentYear} DMGT Assessment Platform. All rights reserved.</p>
              <p className="footer-version">Version 1.0 • Built with enterprise security standards</p>
            </div>
            
            <div className="footer-features">
              <div className="footer-feature">
                <span className="footer-feature-icon">🔒</span>
                <span className="footer-feature-text">Enterprise Security</span>
              </div>
              <div className="footer-feature">
                <span className="footer-feature-icon">📊</span>
                <span className="footer-feature-text">Advanced Analytics</span>
              </div>
              <div className="footer-feature">
                <span className="footer-feature-icon">🚀</span>
                <span className="footer-feature-text">Cloud Native</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;