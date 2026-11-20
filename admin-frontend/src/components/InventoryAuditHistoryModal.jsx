import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, History, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import AdminDropdown from './AdminDropdown';

const InventoryAuditHistoryModal = ({ isOpen, onClose, selectedProductId = null }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [operationFilter, setOperationFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 25,
      };
      if (search.trim()) params.search = search.trim();
      if (operationFilter !== 'ALL') params.operation = operationFilter;
      if (sourceFilter !== 'ALL') params.source = sourceFilter;
      if (selectedProductId) params.productId = selectedProductId;

      const res = await api.get('/inventory/logs', { params });
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch inventory logs:', err);
      toast.error('Failed to load audit history.');
    } finally {
      setLoading(false);
    }
  }, [page, search, operationFilter, sourceFilter, selectedProductId]);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, fetchLogs]);

  if (!isOpen) return null;

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
          justifyContent: 'flex-end',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          style={{
            width: '100%',
            maxWidth: 820,
            height: '100%',
            background: 'var(--panel-bg, #0F0E17)',
            borderLeft: '1px solid var(--card-border, rgba(201, 168, 76, 0.2))',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-12px 0 36px rgba(0, 0, 0, 0.7)',
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
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(201, 168, 76, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-gold, #C9A84C)',
                }}
              >
                <History size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Inventory Audit Ledger
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Immutable tracking of all stock edits, customer checkouts, and batch imports.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
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

          {/* Filter Bar */}
          <div
            style={{
              padding: '14px 24px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {/* Search */}
            <div className="admin-search-wrapper" style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by product, admin, order #..."
                className="admin-input admin-search-input"
                style={{ paddingLeft: 42, height: 36, fontSize: '0.82rem', borderRadius: 10 }}
              />
            </div>

            {/* Operation Filter */}
            <AdminDropdown
              value={operationFilter}
              onChange={(val) => {
                setOperationFilter(val);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Operations' },
                { value: 'SET_STOCK', label: 'Set Stock' },
                { value: 'ADJUST_STOCK', label: 'Adjust Stock' },
                { value: 'ORDER_DEDUCTION', label: 'Order Checkout' },
                { value: 'ORDER_CANCEL_RESTORE', label: 'Order Cancelled Restore' },
              ]}
              title="FILTER BY OPERATION"
              style={{ minWidth: 160 }}
            />

            {/* Source Filter */}
            <AdminDropdown
              value={sourceFilter}
              onChange={(val) => {
                setSourceFilter(val);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Sources' },
                { value: 'MANUAL_ADMIN', label: 'Manual Admin' },
                { value: 'DRAWER_ADMIN', label: 'Variant Drawer' },
                { value: 'BULK_ADMIN', label: 'Bulk Dock' },
                { value: 'CSV_IMPORT', label: 'CSV / Excel' },
                { value: 'ORDER_DEDUCTION', label: 'Storefront Order' },
              ]}
              title="FILTER BY SOURCE"
              style={{ minWidth: 160 }}
            />
          </div>

          {/* Logs Table / List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                Loading audit ledger...
              </div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                No audit logs found matching your criteria.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {logs.map((log) => {
                  const isPositive = log.quantityChanged > 0;
                  const isOrder = log.operation === 'ORDER_DEDUCTION';
                  const isRestore = log.operation === 'ORDER_CANCEL_RESTORE';

                  return (
                    <div
                      key={log._id}
                      style={{
                        background: 'var(--surface-primary, #14131E)',
                        border: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                        borderRadius: 14,
                        padding: '14px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {/* Top Row: Date, Operation Badge, Source */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: isOrder
                                ? 'rgba(59, 130, 246, 0.15)'
                                : isRestore
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(201, 168, 76, 0.15)',
                              color: isOrder
                                ? '#60A5FA'
                                : isRestore
                                ? '#34D399'
                                : 'var(--accent-gold, #C9A84C)',
                            }}
                          >
                            {log.operation}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            by <b>{log.adminUsername}</b> via {log.source}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      {/* Middle Row: Product info and delta */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                            {log.productName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {log.category}
                            {log.colorName && ` • Color: ${log.colorName}`}
                            {log.size && ` • Size: ${log.size}`}
                          </div>
                        </div>

                        {/* Transition and Delta */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              {log.previousStock !== null ? log.previousStock : 'Untracked'}
                            </span>
                            <ArrowRight size={14} color="var(--text-muted)" />
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                              {log.updatedStock}
                            </span>
                            <span
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: isPositive
                                  ? 'rgba(16, 185, 129, 0.18)'
                                  : 'rgba(239, 68, 68, 0.18)',
                                color: isPositive ? '#34D399' : '#F87171',
                              }}
                            >
                              {isPositive ? `+${log.quantityChanged}` : log.quantityChanged}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Reason & Reference ID */}
                      {(log.reason || log.referenceId) && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            background: 'rgba(255, 255, 255, 0.02)',
                            padding: '6px 10px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{log.reason}</span>
                          {log.referenceId && (
                            <span style={{ fontFamily: 'monospace', color: 'var(--accent-gold)' }}>
                              Ref: #{log.referenceId}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid var(--card-border, rgba(255, 255, 255, 0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Page {page} of {pagination.totalPages} ({pagination.total} entries)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 8 }}
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 8 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InventoryAuditHistoryModal;
