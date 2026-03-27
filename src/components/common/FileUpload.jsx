import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import './FileUpload.scss';
import toast from 'react-hot-toast';

const FileUpload = ({ children, onFileLoad, accept = '.json' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast.error('Пожалуйста, загрузите JSON файл');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onFileLoad(e.target.result);
    };
    reader.onerror = () => {
      toast.error('Ошибка чтения файла');
    };
    reader.readAsText(file);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div
      className={`file-upload ${isDragging ? 'file-upload--dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      {children || (
        <div className="file-upload__default">
          <Upload size={32} />
          <span>Нажмите или перетащите файл для загрузки</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;