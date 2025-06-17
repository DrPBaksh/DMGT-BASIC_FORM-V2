import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Simple components for initial deployment
const WelcomePage: React.FC = () => (
  <div className="page welcome-page">
    <h1>DMGT Assessment Platform</h1>
    <p>Welcome to the DMGT Data & AI Readiness Assessment Tool</p>
    <div className="assessment-options">
      <a href="/company" className="assessment-link">
        <h3>Company Assessment</h3>
        <p>Evaluate your organization's data and AI readiness</p>
      </a>
      <a href="/employee" className="assessment-link">
        <h3>Employee Assessment</h3>
        <p>Individual skills and knowledge evaluation</p>
      </a>
    </div>
  </div>
);

const CompanyAssessment: React.FC = () => (
  <div className="page assessment-page">
    <h1>Company Assessment</h1>
    <p>Company assessment functionality will be implemented here.</p>
    <a href="/">← Back to Home</a>
  </div>
);

const EmployeeAssessment: React.FC = () => (
  <div className="page assessment-page">
    <h1>Employee Assessment</h1>
    <p>Employee assessment functionality will be implemented here.</p>
    <a href="/">← Back to Home</a>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <h1>DMGT Assessment Platform</h1>
            <nav>
              <a href="/">Home</a>
              <a href="/company">Company</a>
              <a href="/employee">Employee</a>
            </nav>
          </div>
        </header>
        
        <main className="app-main">
          <div className="container">
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/company" element={<CompanyAssessment />} />
              <Route path="/employee" element={<EmployeeAssessment />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        
        <footer className="app-footer">
          <div className="container">
            <p>&copy; 2025 DMGT Assessment Platform. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
