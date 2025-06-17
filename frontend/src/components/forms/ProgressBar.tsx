/**
 * Progress Bar Component
 * Shows assessment progress with visual indicators
 */

import React from 'react';
import './forms.css';

interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
}

interface ProgressBarProps {
  progress: ProgressData;
  showDetails?: boolean;
  showPercentage?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'success' | 'warning' | 'error';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showDetails = true,
  showPercentage = true,
  className = '',
  size = 'medium',
  color = 'primary'
}) => {
  const { completed, total, percentage } = progress;

  const getProgressColor = () => {
    if (color !== 'primary') return color;
    
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'primary';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const progressColor = getProgressColor();

  return (
    <div className={`progress-container ${size} ${className}`}>
      {showDetails && (
        <div className="progress-header">
          <div className="progress-info">
            <span className="progress-title">Assessment Progress</span>
            {showPercentage && (
              <span className="progress-percentage">{percentage}%</span>
            )}
          </div>
          <div className="progress-stats">
            <span className="progress-stat">
              {completed} of {total} questions completed
            </span>
          </div>
        </div>
      )}
      
      <div className="progress-bar-container">
        <div 
          className={`progress-bar ${progressColor}`}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percentage}% complete`}
        >
          <div 
            className="progress-fill"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            <div className="progress-shine"></div>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="progress-milestones">
          <div className="milestone-container">
            {[25, 50, 75, 100].map((milestone) => (
              <div
                key={milestone}
                className={`milestone ${percentage >= milestone ? 'completed' : ''}`}
                style={{ left: `${milestone}%` }}
              >
                <div className="milestone-marker"></div>
                <div className="milestone-label">{milestone}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {percentage === 100 && (
        <div className="progress-completion">
          <div className="completion-icon">✓</div>
          <span className="completion-text">Assessment Complete!</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;