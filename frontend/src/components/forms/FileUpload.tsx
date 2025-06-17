/**
 * File Upload Component
 * Handles file uploads with drag & drop, validation, and progress tracking
 */

import React, { useState, useRef, useCallback } from 'react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadDate?: string;
}

interface FileUploadProps {
  questionId: string;
  onFileUpload?: (questionId: string, files: FileList) => void;
  existingFiles?: UploadedFile[];
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  questionId,
  onFileUpload,
  existingFiles = [],
  accept = '*/*',
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  disabled = false,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFiles = (files: FileList): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    // Check if we would exceed max files
    if (existingFiles.length + files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed. You currently have ${existingFiles.length} files.`);
      return { valid, errors };
    }

    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}.`);
        return;
      }

      // Check file type if specified
      if (accept !== '*/*') {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const isValidType = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type.match(type.replace('*', '.*'));
        });

        if (!isValidType) {
          errors.push(`${file.name} is not an accepted file type. Accepted types: ${accept}`);
          return;
        }
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  const handleFileSelect = useCallback((files: FileList) => {
    if (disabled || !onFileUpload) return;

    const { valid, errors } = validateFiles(files);
    setErrors(errors);

    if (valid.length > 0) {
      setIsUploading(true);
      
      // Simulate upload progress (replace with actual upload logic)
      valid.forEach((file, index) => {
        const fileId = `${file.name}_${Date.now()}_${index}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        
        // Simulate progress
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[fileId] || 0;
            if (currentProgress >= 100) {
              clearInterval(interval);
              return prev;
            }
            return { ...prev, [fileId]: currentProgress + 10 };
          });
        }, 200);
      });

      // Call the actual upload handler
      const fileList = new DataTransfer();
      valid.forEach(file => fileList.items.add(file));
      onFileUpload(questionId, fileList.files);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress({});
      }, 2000);
    }
  }, [questionId, onFileUpload, disabled, maxSize, maxFiles, accept, existingFiles.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [disabled, handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  const handleRemoveFile = (fileId: string) => {
    // This would typically call an API to remove the file
    console.log('Remove file:', fileId);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`file-upload ${className} ${disabled ? 'disabled' : ''}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Drop zone */}
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="drop-zone-content">
          {isUploading ? (
            <>
              <div className="upload-icon">⏳</div>
              <div className="upload-text">Uploading files...</div>
            </>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <strong>Click to browse</strong> or drag and drop files here
              </div>
              <div className="upload-info">
                {accept !== '*/*' && <div>Accepted types: {accept}</div>}
                <div>Max size: {formatFileSize(maxSize)} per file</div>
                <div>Max files: {maxFiles}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upload progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="upload-progress">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="progress-item">
              <div className="progress-info">
                <span>{fileId.split('_')[0]}</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="upload-errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              ⚠️ {error}
            </div>
          ))}
        </div>
      )}

      {/* Existing files */}
      {existingFiles.length > 0 && (
        <div className="existing-files">
          <h4>Uploaded Files</h4>
          <div className="file-list">
            {existingFiles.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    {file.uploadDate && (
                      <span className="file-date">
                        {new Date(file.uploadDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="file-actions">
                  {file.url && (
                    <button 
                      type="button"
                      className="btn-download"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      📥
                    </button>
                  )}
                  <button 
                    type="button"
                    className="btn-remove"
                    onClick={() => handleRemoveFile(file.id)}
                    disabled={disabled}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;