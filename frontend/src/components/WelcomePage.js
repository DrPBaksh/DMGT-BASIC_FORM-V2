import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';
import { useAssessment } from '../context/AssessmentContext';
import { APIService } from '../services/api';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { state, loadQuestions } = useAssessment();
  const [apiStatus, setApiStatus] = useState('checking');
  const [companyId, setCompanyId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [showEmployeeId, setShowEmployeeId] = useState(false);

  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const isHealthy = await APIService.healthCheck();
        setApiStatus(isHealthy ? 'online' : 'offline');
      } catch (error) {
        console.error('API health check failed:', error);
        setApiStatus('offline');
      }
    };

    checkApiStatus();
  }, []);

  // Preload questions for both assessment types
  useEffect(() => {
    if (apiStatus === 'online') {
      loadQuestions('Company').catch(console.error);
      loadQuestions('Employee').catch(console.error);
    }
  }, [apiStatus, loadQuestions]);

  const features = [
    {
      icon: '🎯',
      title: 'Comprehensive Assessment',
      description: 'Evaluate your organization\'s data and AI readiness across multiple dimensions',
      highlight: true
    },
    {
      icon: '📊',
      title: 'Real-time Analytics',
      description: 'Get instant insights and progress tracking throughout the assessment process'
    },
    {
      icon: '🔒',
      title: 'Enterprise Security',
      description: 'Bank-grade security with encrypted data transmission and secure cloud storage'
    },
    {
      icon: '📱',
      title: 'Multi-device Support',
      description: 'Access your assessments from any device with automatic sync and save'
    },
    {
      icon: '🔄',
      title: 'Auto-save Technology',
      description: 'Never lose your progress with intelligent auto-save every 30 seconds'
    },
    {
      icon: '📈',
      title: 'Detailed Reporting',
      description: 'Comprehensive reports with actionable recommendations and benchmarks'
    }
  ];

  const assessmentOptions = [
    {
      type: 'Company',
      title: 'Company Assessment',
      subtitle: 'Organizational Readiness',
      description: 'Comprehensive evaluation of your organization\'s data infrastructure, AI capabilities, and digital transformation readiness.',
      icon: '🏢',
      color: 'blue',
      features: [
        'Data Infrastructure Analysis',
        'AI/ML Capability Assessment',
        'Digital Transformation Roadmap',
        'Governance & Compliance Review',
        'Technology Stack Evaluation',
        'Strategic Recommendations'
      ],
      estimatedTime: '45-60 minutes'
    },
    {
      type: 'Employee',
      title: 'Employee Assessment',
      subtitle: 'Individual Skills & Knowledge',
      description: 'Evaluate individual employee skills, knowledge gaps, and training needs in data science and AI technologies.',
      icon: '👤',
      color: 'green',
      features: [
        'Technical Skills Assessment',
        'Data Literacy Evaluation',
        'AI/ML Knowledge Testing',
        'Tool Proficiency Check',
        'Learning Path Recommendations',
        'Certification Roadmap'
      ],
      estimatedTime: '30-45 minutes'
    }
  ];

  const handleStartAssessment = (type) => {
    if (!companyId.trim()) {
      alert('Please enter a Company ID to begin the assessment.');
      return;
    }

    if (type === 'Employee' && !employeeId.trim()) {
      alert('Please enter an Employee ID for the employee assessment.');
      return;
    }

    // Navigate to the appropriate assessment
    if (type === 'Company') {
      navigate(`/company/${encodeURIComponent(companyId.trim())}`);
    } else {
      navigate(`/employee/${encodeURIComponent(companyId.trim())}/${encodeURIComponent(employeeId.trim())}`);
    }
  };

  const getApiStatusDisplay = () => {
    switch (apiStatus) {
      case 'checking':
        return <span className="status-checking">🔄 Checking connection...</span>;
      case 'online':
        return <span className="status-online">🟢 All systems operational</span>;
      case 'offline':
        return <span className="status-offline">🔴 Service temporarily unavailable</span>;
    }
  };

  return (
    <div className="welcome-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              DMGT Assessment Platform
              <span className="hero-subtitle">Data & AI Readiness Evaluation</span>
            </h1>
            <p className="hero-description">
              Transform your organization with comprehensive assessments that evaluate data maturity, 
              AI capabilities, and digital readiness. Get actionable insights to drive your 
              transformation journey forward.
            </p>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">Assessment Categories</span>
              </div>
              <div className="stat">
                <span className="stat-number">15min</span>
                <span className="stat-label">Auto-save Intervals</span>
              </div>
              <div className="stat">
                <span className="stat-number">100%</span>
                <span className="stat-label">Secure & Encrypted</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="assessment-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="preview-title">Assessment Dashboard</div>
              </div>
              <div className="preview-content">
                <div className="preview-chart">
                  <div className="chart-bar" style={{ height: '60%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                  <div className="chart-bar" style={{ height: '45%' }}></div>
                  <div className="chart-bar" style={{ height: '90%' }}></div>
                </div>
                <div className="preview-metrics">
                  <div className="metric">
                    <span className="metric-label">Progress</span>
                    <span className="metric-value">87%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Score</span>
                    <span className="metric-value">A+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Status */}
      <section className="status-section">
        <div className="status-container">
          <div className="status-info">
            <span className="status-label">System Status:</span>
            {getApiStatusDisplay()}
          </div>
          <div className="config-info">
            <span className="config-label">Environment:</span>
            <span className={`env-badge env-${state.config.environment}`}>
              {state.config.environment.toUpperCase()}
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Choose DMGT Assessment Platform?</h2>
          <p>Built for enterprise organizations seeking comprehensive data and AI readiness evaluation</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className={`feature-card ${feature.highlight ? 'featured' : ''}`}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Assessment Options */}
      <section className="assessments-section">
        <div className="section-header">
          <h2>Start Your Assessment Journey</h2>
          <p>Choose the assessment type that best fits your evaluation needs</p>
        </div>

        {/* ID Input Section */}
        <div className="id-input-section">
          <div className="input-group">
            <label htmlFor="companyId" className="input-label">
              <span className="label-text">Company ID</span>
              <span className="label-required">*</span>
            </label>
            <input
              id="companyId"
              type="text"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="id-input"
              placeholder="Enter your company identifier (e.g., DMGT-2025)"
              maxLength={50}
              required
            />
          </div>
          
          <div className="employee-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showEmployeeId}
                onChange={(e) => setShowEmployeeId(e.target.checked)}
                className="toggle-input"
              />
              <span className="toggle-text">I need to enter an Employee ID for individual assessment</span>
            </label>
          </div>

          {showEmployeeId && (
            <div className="input-group">
              <label htmlFor="employeeId" className="input-label">
                <span className="label-text">Employee ID</span>
                <span className="label-required">*</span>
              </label>
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="id-input"
                placeholder="Enter employee identifier (e.g., EMP-001)"
                maxLength={50}
              />
            </div>
          )}
        </div>

        {/* Assessment Cards */}
        <div className="assessments-grid">
          {assessmentOptions.map((option) => (
            <div key={option.type} className={`assessment-card assessment-${option.color}`}>
              <div className="assessment-header">
                <div className="assessment-icon">{option.icon}</div>
                <div className="assessment-titles">
                  <h3 className="assessment-title">{option.title}</h3>
                  <p className="assessment-subtitle">{option.subtitle}</p>
                </div>
              </div>
              
              <p className="assessment-description">{option.description}</p>
              
              <div className="assessment-features">
                <h4>What's Included:</h4>
                <ul>
                  {option.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
              
              <div className="assessment-meta">
                <div className="time-estimate">
                  <span className="time-icon">⏱️</span>
                  <span>Estimated time: {option.estimatedTime}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleStartAssessment(option.type)}
                disabled={apiStatus !== 'online' || !companyId.trim() || (option.type === 'Employee' && showEmployeeId && !employeeId.trim())}
                className={`assessment-button assessment-button-${option.color}`}
              >
                {state.loading.questions ? (
                  <>
                    <span className="button-spinner">⏳</span>
                    Loading Questions...
                  </>
                ) : (
                  <>
                    <span>Start {option.title}</span>
                    <span className="button-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="info-section">
        <div className="info-grid">
          <div className="info-card">
            <h3>📋 Before You Begin</h3>
            <ul>
              <li>Ensure you have administrative access to relevant systems</li>
              <li>Gather information about your current data infrastructure</li>
              <li>Set aside dedicated time for uninterrupted assessment</li>
              <li>Have relevant documentation and metrics available</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h3>💾 Auto-save & Security</h3>
            <ul>
              <li>Your progress is automatically saved every 30 seconds</li>
              <li>All data is encrypted in transit and at rest</li>
              <li>You can pause and resume assessments at any time</li>
              <li>No sensitive data is stored in browser memory</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h3>📞 Support & Help</h3>
            <ul>
              <li>Technical support available during business hours</li>
              <li>Comprehensive help documentation included</li>
              <li>Real-time guidance throughout the assessment</li>
              <li>Export capabilities for further analysis</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;
