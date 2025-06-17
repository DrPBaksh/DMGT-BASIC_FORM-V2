/**
 * Save Indicator Component
 * Shows save status and last saved time
 */

import React from 'react';

interface SaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError?: string | null;
  className?: string;
  showLastSaved?: boolean;
}

const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  isSaving,
  lastSaved,
  saveError = null,
  className = '',
  showLastSaved = true
}) => {
  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 30) {
      return 'Just now';
    } else if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  const getSaveStatus = () => {
    if (saveError) {
      return {
        icon: '⚠️',
        text: 'Save failed',
        className: 'save-error'
      };
    }

    if (isSaving) {
      return {
        icon: '⏳',
        text: 'Saving...',
        className: 'save-saving'
      };
    }

    if (lastSaved) {
      return {
        icon: '✓',
        text: 'Saved',
        className: 'save-success'
      };
    }

    return {
      icon: '○',
      text: 'Not saved',
      className: 'save-pending'
    };
  };

  const status = getSaveStatus();

  return (
    <div className={`save-indicator ${status.className} ${className}`}>
      <div className="save-status">
        <span className="save-icon">{status.icon}</span>
        <span className="save-text">{status.text}</span>
      </div>

      {showLastSaved && lastSaved && !isSaving && (
        <div className="save-time">
          Last saved: {formatLastSaved(lastSaved)}
        </div>
      )}

      {saveError && (
        <div className="save-error-details">
          {saveError}
        </div>
      )}

      {isSaving && (
        <div className="save-spinner">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default SaveIndicator;