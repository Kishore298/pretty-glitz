import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { optimizeImageUrl } from '../utils/cloudinary';

const ImageUpload = ({ value, onChange, placeholder = 'Upload Image' }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange(data.url);
      toast.success('Image uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
        <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 8, overflow: 'hidden', border: '1px solid #1e1e28' }}>
          <img src={optimizeImageUrl(value, 300)} alt="Uploaded" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button
            type="button"
            onClick={handleRemove}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{
            width: '100%', height: 160,
            background: 'rgba(255,255,255,0.02)', border: '1px dashed #1e1e28',
            borderRadius: 8, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            color: '#8a8aa0', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => !loading && (e.currentTarget.style.borderColor = '#FF1493')}
          onMouseLeave={e => !loading && (e.currentTarget.style.borderColor = '#1e1e28')}
        >
          {loading ? (
            <>
              <Loader2 size={24} className="spin" />
              <span style={{ fontSize: '0.85rem' }}>Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={24} />
              <span style={{ fontSize: '0.85rem' }}>{placeholder}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ImageUpload;
