import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function FileUpload({ 
  onFileSelect, 
  accept = ".csv,.xlsx,.xls", 
  maxSize = 5 * 1024 * 1024, // 5MB
  className = "",
  disabled = false 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }

    const allowedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setError(`File type not supported. Please upload: ${accept}`);
      return false;
    }

    setError('');
    return true;
  };

  const handleFiles = (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <motion.div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
          ${dragActive 
            ? 'border-sandTan bg-sandTan/10' 
            : 'border-sandTan/30 hover:border-sandTan/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? onButtonClick : undefined}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <p className="text-sandTan font-medium text-lg">
              {dragActive ? 'Drop your file here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-textMuted text-sm mt-2">
              {accept} (max {Math.round(maxSize / 1024 / 1024)}MB)
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}
    </div>
  );
}






