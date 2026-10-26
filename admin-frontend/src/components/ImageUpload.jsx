import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { optimizeImageUrl } from '../utils/cloudinary';

const ImageUpload = ({ value, onChange, placeholder = 'Upload High-Res Image' }) => {
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('File size exceeds 8MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
      toast.success('Image uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    uploadFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="file"
        accept="image/jpeg, image/png, image/webp, image/avif"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      {value ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 180,
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.1))',
            background: 'var(--surface-primary, #13121A)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
          }}
        >
          <img
            src={optimizeImageUrl(value, 400)}
            alt="Uploaded asset"
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)',
              pointerEvents: 'none',
            }}
          />

          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove image"
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(239, 68, 68, 0.85)',
              border: 'none',
              color: '#FFFFFF',
              width: 32,
              height: 32,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !loading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            width: '100%',
            height: 170,
            background: isDragOver
              ? 'rgba(236, 22, 140, 0.08)'
              : 'rgba(255, 255, 255, 0.02)',
            border: `2px dashed ${
              isDragOver
                ? 'var(--accent-pink, #EC168C)'
                : 'var(--card-border, rgba(255, 255, 255, 0.1))'
            }`,
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: 'var(--text-secondary, #ACA6B8)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
            padding: 16,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.borderColor = 'rgba(236, 22, 140, 0.5)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.035)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && !isDragOver) {
              e.currentTarget.style.borderColor = 'var(--card-border, rgba(255, 255, 255, 0.1))';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            }
          }}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(236, 22, 140, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-pink)',
                }}
              >
                <Loader2 size={22} className="animate-spin" />
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Uploading to cloud...
              </span>
            </>
          ) : (
            <>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-pink)',
                }}
              >
                <Upload size={22} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {placeholder}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Drag & drop or browse image (JPEG, PNG, WebP up to 8MB)
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
