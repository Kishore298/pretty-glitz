import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, FileSpreadsheet, Download, CheckCircle, AlertOctagon, ArrowRight, Check } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const InventoryCSVModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1 = Upload, 2 = Preview & Confirm
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      toast.loading('Generating catalog template...', { id: 'dl-template' });
      const res = await api.get('/inventory/export?format=xlsx', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prettyglitz-inventory-template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Inventory catalog downloaded!', { id: 'dl-template' });
    } catch (err) {
      console.error('Download template error:', err);
      toast.error('Failed to download template.', { id: 'dl-template' });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handlePreviewUpload = async () => {
    if (!file) {
      toast.error('Please select an Excel or CSV file first.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/inventory/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPreviewData(res.data);
      setStep(2);
    } catch (err) {
      console.error('Import preview error:', err);
      toast.error(err.response?.data?.message || 'Failed to parse import spreadsheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData || !previewData.diffs || previewData.diffs.length === 0) {
      toast.error('No valid diffs to apply.');
      return;
    }

    try {
      setConfirming(true);
      const res = await api.post('/inventory/import/confirm', {
        diffs: previewData.diffs,
      });

      if (res.data.conflictCount > 0) {
        toast.error(
          `Applied ${res.data.appliedCount} updates. ${res.data.conflictCount} rows had version conflicts.`
        );
      } else {
        toast.success(`Successfully applied ${res.data.appliedCount} stock updates!`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Confirm import error:', err);
      toast.error(err.response?.data?.message || 'Failed to apply import updates.');
    } finally {
      setConfirming(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setFile(null);
    setPreviewData(null);
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1150,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          style={{
            width: '100%',
            maxWidth: step === 1 ? 520 : 860,
            maxHeight: '90vh',
            background: 'var(--panel-bg, #0F0E17)',
            border: '1px solid var(--card-border, rgba(201, 168, 76, 0.2))',
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(201, 168, 76, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-gold, #C9A84C)',
                }}
              >
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {step === 1 ? 'Import Inventory Spreadsheet' : 'Validate & Preview Updates'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {step === 1 ? 'Step 1 of 2: Upload Excel (.xlsx) or CSV' : `Step 2 of 2: Review ${previewData?.validCount || 0} staged changes`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* STEP 1: UPLOAD SCREEN */}
          {step === 1 && (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Instructions banner */}
              <div
                style={{
                  background: 'rgba(201, 168, 76, 0.08)',
                  border: '1px solid rgba(201, 168, 76, 0.2)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>
                    Need the latest catalog format?
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Download the pre-filled template with all active variants and current counts.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn-secondary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Download size={14} />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--card-border, rgba(201, 168, 76, 0.3))',
                  borderRadius: 16,
                  padding: '36px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: 'rgba(201, 168, 76, 0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-gold)',
                    marginBottom: 12,
                  }}
                >
                  <UploadCloud size={28} />
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FFFFFF' }}>
                  {file ? file.name : 'Click or drag Excel / CSV spreadsheet here'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Supports .xlsx, .xls, and .csv files up to 10MB
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '9px 18px', borderRadius: 10 }}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!file || loading}
                  onClick={handlePreviewUpload}
                  className="btn-primary"
                  style={{
                    padding: '9px 22px',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: !file || loading ? 0.6 : 1,
                  }}
                >
                  <ArrowRight size={16} />
                  <span>{loading ? 'Validating...' : 'Preview Updates'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & CONFIRM SCREEN */}
          {step === 2 && previewData && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              {/* Summary Stats */}
              <div
                style={{
                  padding: '16px 24px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} color="#10B981" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>
                    {previewData.validCount} Valid Updates Ready
                  </span>
                </div>
                {previewData.errorCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertOctagon size={18} color="#EF4444" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F87171' }}>
                      {previewData.errorCount} Rows with Errors (Skipped)
                    </span>
                  </div>
                )}
              </div>

              {/* Error list if any */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div
                  style={{
                    margin: '14px 24px 0',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    maxHeight: 100,
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F87171', marginBottom: 4 }}>
                    Invalid rows found (will not be applied):
                  </div>
                  {previewData.errors.map((e, idx) => (
                    <div key={idx} style={{ fontSize: '0.74rem', color: '#FCA5A5' }}>
                      • Row {e.row}: {e.error}
                    </div>
                  ))}
                </div>
              )}

              {/* Diffs Table */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 10px' }}>Row</th>
                      <th style={{ padding: '8px 10px' }}>Product</th>
                      <th style={{ padding: '8px 10px' }}>Target Variant</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Current</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>New Stock</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.diffs.map((d, idx) => {
                      const isPositive = d.delta > 0;
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            color: '#FFFFFF',
                          }}
                        >
                          <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{d.row}</td>
                          <td style={{ padding: '10px', fontWeight: 600 }}>{d.productName}</td>
                          <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                            {d.target?.variantType === 'COLOR_SIZE'
                              ? `${d.target.colorName} • Size ${d.target.size}`
                              : d.target?.variantType === 'SIZE'
                              ? `Size ${d.target.size}`
                              : 'Simple Item'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-muted)' }}>
                            {d.previousStock !== null ? d.previousStock : 'Untracked'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>
                            {d.newStock}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: isPositive ? '#34D399' : '#F87171',
                                fontWeight: 700,
                              }}
                            >
                              {isPositive ? `+${d.delta}` : d.delta}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--panel-bg, #0F0E17)',
                }}
              >
                <button type="button" onClick={resetModal} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: 8 }}>
                  ← Upload Different File
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: 8 }}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={confirming || previewData.validCount === 0}
                    onClick={handleConfirmImport}
                    className="btn-primary"
                    style={{
                      padding: '8px 22px',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      opacity: confirming || previewData.validCount === 0 ? 0.6 : 1,
                    }}
                  >
                    <Check size={16} />
                    <span>{confirming ? 'Applying...' : `Confirm & Apply ${previewData.validCount} Updates`}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InventoryCSVModal;
