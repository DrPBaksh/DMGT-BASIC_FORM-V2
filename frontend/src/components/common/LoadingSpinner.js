import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...', className = '' }) => {
  const sizeClass = `spinner-${size}`;
  
  return (
    <div className={`loading-spinner-container ${className}`}>
      <div className={`loading-spinner ${sizeClass}`}>
        <div className="spinner-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
      {message && (
        <div className="loading-message">
          {message}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
