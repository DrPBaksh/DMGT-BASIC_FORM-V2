// DMGT Assessment Form - Progress Bar Component
// Shows assessment completion progress with visual indicators

import React from 'react';

const ProgressBar = ({ progress, showDetails = false, className = '' }) => {
  const { completed = 0, total = 0, percentage = 0 } = progress || {};

  return (
    <div className={`progress-bar-container ${className}`}>
      {showDetails && (
        <div className="progress-details">
          <div className="progress-stats">
            <span className="completed-count">{completed}</span>
            <span className="separator">of</span>
            <span className="total-count">{total}</span>
            <span className="progress-label">questions completed</span>
          </div>
          <div className="progress-percentage">
            {percentage}%
          </div>
        </div>
      )}
      
      <div className="progress-bar-track">
        <div 
          className="progress-bar-fill"
          style={{ 
            width: `${Math.min(100, Math.max(0, percentage))}%`,
            transition: 'width 0.3s ease-in-out'
          }}
        />
      </div>

      {showDetails && (
        <div className="progress-milestones">
          <div className={`milestone ${percentage >= 25 ? 'completed' : ''}`}>
            <div className="milestone-marker" />
            <span className="milestone-label">25%</span>
          </div>
          <div className={`milestone ${percentage >= 50 ? 'completed' : ''}`}>
            <div className="milestone-marker" />
            <span className="milestone-label">50%</span>
          </div>
          <div className={`milestone ${percentage >= 75 ? 'completed' : ''}`}>
            <div className="milestone-marker" />
            <span className="milestone-label">75%</span>
          </div>
          <div className={`milestone ${percentage >= 100 ? 'completed' : ''}`}>
            <div className="milestone-marker" />
            <span className="milestone-label">Complete</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;