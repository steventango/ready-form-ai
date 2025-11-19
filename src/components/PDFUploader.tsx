import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface PDFUploaderProps {
  onUpload: (file: File) => void;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({ onUpload }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      onUpload(file);
    }
  }, [onUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div
      className="glass"
      style={{
        padding: '3rem',
        borderRadius: 'var(--radius-lg)',
        border: '2px dashed var(--border)',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        maxWidth: '600px',
        margin: '0 auto'
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onDragLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        type="file"
        id="file-input"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          background: 'var(--bg-surface)',
          padding: '1.5rem',
          borderRadius: '50%',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Upload size={48} color="var(--primary)" />
        </div>
        <div>
          <h3 style={{ marginBottom: '0.5rem' }}>Upload your Form</h3>
          <p style={{ color: 'var(--text-muted)' }}>Drag & drop or click to browse</p>
        </div>
      </div>
    </div>
  );
};
