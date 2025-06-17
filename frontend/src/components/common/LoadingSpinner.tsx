// DMGT Assessment Form - Loading Spinner Component
// Premium loading states with exceptional design

import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white' | 'gray';
  message?: string;
  overlay?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  message,
  overlay = false,
  className = ''
}) => {
  const spinnerClasses = [
    'loading-spinner',
    `spinner-${size}`,
    `spinner-${color}`,
    className
  ].filter(Boolean).join(' ');

  const containerClasses = [
    'loading-container',
    overlay && 'loading-overlay'
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className="loading-content">
        <div className={spinnerClasses}>
          <div className="spinner-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        {message && (
          <p className="loading-message">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
