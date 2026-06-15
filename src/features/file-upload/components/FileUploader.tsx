import React, { useState, useRef } from 'react';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { useDicomUpload } from '../hooks/useDicomUpload';
import { Upload, FileImage, AlertCircle, Loader } from 'lucide-react';

export function FileUploader() {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguageStore();
  const { handleFilesChange, isLoading, error } = useDicomUpload();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesChange(e.dataTransfer.files);
    }
  };

  const onFilesButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const onFolderButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    folderInputRef.current?.click();
  };

  return (
    <div className="uploader-overlay">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`upload-card ${isDragActive ? 'drag-active' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".dcm,application/dicom"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && e.target.files.length > 0 && handleFilesChange(e.target.files)}
        />

        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is a non-standard standard feature
          webkitdirectory="true"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && e.target.files.length > 0 && handleFilesChange(e.target.files)}
        />
        
        <div style={{ padding: '1.5rem' }}>
          {isLoading ? <Loader size={48} /> : <Upload size={48} />}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 className="upload-title">{t('upload.title')}</h2>
          <p className="upload-desc">
            {isLoading ? t('upload.processing') : t('upload.desc')}
          </p>
        </div>

        {!isLoading && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', width: '100%' }}>
            <button className="upload-button" style={{ flex: 1 }} onClick={onFilesButtonClick}>
              {t('upload.filesBtn')}
            </button>
            <button className="upload-button" style={{ flex: 1 }} onClick={onFolderButtonClick}>
              {t('upload.folderBtn')}
            </button>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
          <FileImage size={16} />
          <span>{t('upload.localPrivacy')}</span>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', marginTop: '1rem' }}>
            <AlertCircle size={20} />
            <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
