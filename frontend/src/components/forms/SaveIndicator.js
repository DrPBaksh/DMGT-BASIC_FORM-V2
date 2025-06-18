// DMGT Assessment Form - Save Indicator Component
// Shows auto-save status and last saved time

import React from 'react';

const SaveIndicator = ({ isSaving = false, lastSaved = null, className = '' }) => {
  
  // Format last saved time
  const formatLastSaved = (timestamp) => {
    if (!timestamp) return null;
    
    const now = new Date();
    const saved = new Date(timestamp);
    const diffMs = now - saved;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffSeconds < 30) {
      return 'just now';
    } else if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else {
      return saved.toLocaleDateString() + ' at ' + saved.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  if (isSaving) {
    return (
      <div className={`save-indicator saving ${className}`}>
        <div className="save-indicator-content">
          <div className="save-spinner">
            <div className="spinner-circle"></div>
          </div>
          <span className="save-text">Saving...</span>
        </div>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className={`save-indicator saved ${className}`}>
        <div className="save-indicator-content">
          <div className="save-icon">✓</div>
          <span className="save-text">
            Saved {formatLastSaved(lastSaved)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`save-indicator unsaved ${className}`}>
      <div className="save-indicator-content">
        <div className="save-icon">○</div>
        <span className="save-text">Not saved</span>
      </div>
    </div>
  );
};

export default SaveIndicator;