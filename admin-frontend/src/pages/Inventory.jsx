import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { optimizeImageUrl } from '../utils/cloudinary';
import {
  Search,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Package,
  History,
  Download,
  Upload,
  Save,
  ChevronRight,
  Pencil,
  Sparkles,
  EyeOff,
  Layers,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { SkeletonTable } from '../components/SkeletonLoader';
import InventoryVariantDrawer from '../components/InventoryVariantDrawer';
import InventoryAuditHistoryModal from '../components/InventoryAuditHistoryModal';
import InventoryCSVModal from '../components/InventoryCSVModal';
import toast from 'react-hot-toast';

const Inventory = () => {
  const navigate = useNavigate();

  // Catalog & Filter States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalProducts: 0,
    totalTrackedUnits: 0,
    untrackedCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inStockCount: 0,
    inactiveCount: 0,
  });

  // Filter Bar States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [threshold, setThreshold] = useState(5);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Staged inline modifications dock: { [productId]: { value, inStock, expectedVersion } }
  const [stagedChanges, setStagedChanges] = useState({});
  const [savingBatch, setSavingBatch] = useState(false);

  // Modals & Drawers
  const [activeDrawerProduct, setActiveDrawerProduct] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [savingDrawer, setSavingDrawer] = useState(false);

  // Fetch Categories & Subcategories on Mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          api.get('/categories'),
          api.get('/subcategories'),
        ]);
        setCategories(catRes.data || []);
        setSubcategories(subRes.data || []);
      } catch (err) {
        console.error('Failed to load categories/subcategories:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Inventory Catalog
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 50,
        threshold,
        stockStatus: selectedStatus,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedSubcategory) params.subcategoryId = selectedSubcategory;

      const res = await api.get('/inventory', { params });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { total: 0, totalPages: 1 });
      if (res.data.kpis) setKpis(res.data.kpis);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      toast.error('Failed to load inventory catalog.');
    } finally {
      setLoading(false);
    }
  }, [page, threshold, selectedStatus, searchQuery, selectedCategory, selectedSubcategory]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle Inline Simple Product Stock Change
  const handleSimpleStockChange = (prod, deltaOrVal, isAbsolute = false) => {
    const currentVal = stagedChanges[prod._id]?.value !== undefined
      ? stagedChanges[prod._id].value
      : (typeof prod.inStockCount === 'number' ? prod.inStockCount : 0);

    let nextVal = isAbsolute ? parseInt(deltaOrVal, 10) : currentVal + deltaOrVal;
    if (isNaN(nextVal)) nextVal = 0;
    nextVal = Math.max(0, nextVal);

    setStagedChanges((prev) => ({
      ...prev,
      [prod._id]: {
        productId: prod._id,
        operation: 'SET_STOCK',
        value: nextVal,
        expectedVersion: prod.stockVersion || 1,
        target: { variantType: 'SIMPLE' },
        productName: prod.name,
      },
    }));
  };

  // Discard All Staged Changes
  const handleDiscardStaged = () => {
    setStagedChanges({});
    toast('All staged stock changes discarded.');
  };

  // Save All Staged Changes (Dock)
  const handleSaveAllStaged = async () => {
    const updates = Object.values(stagedChanges);
    if (updates.length === 0) return;

    try {
      setSavingBatch(true);
      const res = await api.post('/inventory/bulk-update', { updates });

      if (res.data.conflictCount > 0) {
        toast.error(
          `Saved ${res.data.appliedCount} updates. ${res.data.conflictCount} items had version conflicts (modified elsewhere).`,
          { duration: 5000 }
        );
      } else {
        toast.success(`Successfully saved stock for ${res.data.appliedCount} products!`);
      }

      setStagedChanges({});
      fetchInventory();
    } catch (err) {
      console.error('Batch save error:', err);
      toast.error('Failed to save batch updates.');
    } finally {
      setSavingBatch(false);
    }
  };

  // Save from Variant Drawer
  const handleDrawerSave = async (product, updatedVariants) => {
    try {
      setSavingDrawer(true);

      await api.post('/inventory/update-variants', {
        productId: product._id,
        expectedVersion: product.stockVersion,
        tier: updatedVariants.tier,
        colorVariants: updatedVariants.colorVariants,
        sizes: updatedVariants.sizes,
      });

      toast.success(`Stock levels saved for ${product.name}!`);
      setIsDrawerOpen(false);
      setActiveDrawerProduct(null);
      fetchInventory();
    } catch (err) {
      console.error('Failed to save variant stock:', err);
      if (err.response?.status === 409) {
        toast.error('Stock version conflict: Product was modified by another session. Reloading latest stock.', {
          duration: 5000,
        });
        fetchInventory();
      } else {
        toast.error(err.response?.data?.message || 'Failed to update variant stock.');
      }
    } finally {
      setSavingDrawer(false);
    }
  };

  // Export Catalog
  const handleExport = async (format = 'xlsx') => {
    try {
      toast.loading(`Exporting catalog as ${format.toUpperCase()}...`, { id: 'export-dl' });
      const res = await api.get(`/inventory/export?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prettyglitz-inventory.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Catalog exported successfully!', { id: 'export-dl' });
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export catalog.', { id: 'export-dl' });
    }
  };

  const stagedCount = Object.keys(stagedChanges).length;

  return (
    <PageWrapper>
      {/* Top Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          borderBottom: '1px solid var(--card-border, rgba(201, 168, 76, 0.15))',
          paddingBottom: 12,
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/products')}
          style={{
            padding: '8px 18px',
            borderRadius: 12,
            background: 'transparent',
            border: '1px solid transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Catalog Sequencer
        </button>

        <button
          type="button"
          style={{
            padding: '8px 20px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(196, 56, 108, 0.25), rgba(138, 43, 226, 0.2))',
            border: '1px solid var(--accent, #C4386C)',
            color: '#FFFFFF',
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(196, 56, 108, 0.2)',
          }}
        >
          <Sparkles size={15} color="var(--accent-gold, #C9A84C)" />
          <span>★ Quick Inventory Hub</span>
        </button>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Inventory Management Hub"
        subtitle="Centralized stock ledger with variant matrices, optimistic concurrency, and audit trails"
        badge="Stock Control"
        actions={
          <div className="inventory-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              className="btn-secondary"
              style={{
                padding: '9px 16px',
                borderRadius: 12,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Download size={15} />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCSVModalOpen(true)}
              className="btn-secondary"
              style={{
                padding: '9px 16px',
                borderRadius: 12,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Upload size={15} />
              <span>Import CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="btn-secondary"
              style={{
                padding: '9px 16px',
                borderRadius: 12,
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <History size={15} />
              <span>Audit History</span>
            </button>
          </div>
        }
      />

      {/* Symmetrical Responsive KPI Metric Cards Grid (All 8 Metrics) */}
      <div
        className="admin-inventory-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          {
            id: 'ALL',
            status: 'ALL',
            label: 'All Products',
            value: kpis.totalProducts,
            icon: Package,
            iconColor: 'var(--accent-gold, #C9A84C)',
            iconBg: 'rgba(201, 168, 76, 0.12)',
            activeBorder: 'var(--accent-gold, #C9A84C)',
            activeBg: 'rgba(201, 168, 76, 0.14)',
            glow: 'rgba(201, 168, 76, 0.25)',
            valColor: '#FAF9FC',
          },
          {
            id: 'TRACKED',
            status: 'ALL',
            label: 'Tracked Units',
            value: typeof kpis.totalTrackedUnits === 'number' ? kpis.totalTrackedUnits.toLocaleString() : (kpis.totalTrackedUnits || 0),
            icon: Layers,
            iconColor: '#38BDF8',
            iconBg: 'rgba(56, 189, 248, 0.12)',
            activeBorder: '#38BDF8',
            activeBg: 'rgba(56, 189, 248, 0.14)',
            glow: 'rgba(56, 189, 248, 0.25)',
            valColor: '#38BDF8',
          },
          {
            id: 'IN_STOCK',
            status: 'IN_STOCK',
            label: 'In Stock & Ready',
            value: kpis.inStockCount,
            icon: CheckCircle2,
            iconColor: '#10B981',
            iconBg: 'rgba(16, 185, 129, 0.12)',
            activeBorder: '#10B981',
            activeBg: 'rgba(16, 185, 129, 0.14)',
            glow: 'rgba(16, 185, 129, 0.25)',
            valColor: '#34D399',
          },
          {
            id: 'LOW_STOCK',
            status: 'LOW_STOCK',
            label: `Low Stock (≤${threshold})`,
            value: kpis.lowStockCount,
            icon: AlertTriangle,
            iconColor: '#F59E0B',
            iconBg: 'rgba(245, 158, 11, 0.12)',
            activeBorder: '#F59E0B',
            activeBg: 'rgba(245, 158, 11, 0.14)',
            glow: 'rgba(245, 158, 11, 0.25)',
            valColor: '#FBBF24',
          },
          {
            id: 'OUT_OF_STOCK',
            status: 'OUT_OF_STOCK',
            label: 'Out of Stock',
            value: kpis.outOfStockCount,
            icon: AlertCircle,
            iconColor: '#EF4444',
            iconBg: 'rgba(239, 68, 68, 0.12)',
            activeBorder: '#EF4444',
            activeBg: 'rgba(239, 68, 68, 0.14)',
            glow: 'rgba(239, 68, 68, 0.25)',
            valColor: '#F87171',
          },
          {
            id: 'UNTRACKED',
            status: 'UNTRACKED',
            label: 'Untracked Stock',
            value: kpis.untrackedCount || 0,
            icon: HelpCircle,
            iconColor: '#A855F7',
            iconBg: 'rgba(168, 85, 247, 0.12)',
            activeBorder: '#A855F7',
            activeBg: 'rgba(168, 85, 247, 0.14)',
            glow: 'rgba(168, 85, 247, 0.25)',
            valColor: '#C084FC',
          },
          {
            id: 'INACTIVE',
            status: 'INACTIVE',
            label: 'Inactive / Hidden',
            value: kpis.inactiveCount || 0,
            icon: EyeOff,
            iconColor: '#94A3B8',
            iconBg: 'rgba(148, 163, 184, 0.12)',
            activeBorder: '#94A3B8',
            activeBg: 'rgba(148, 163, 184, 0.14)',
            glow: 'rgba(148, 163, 184, 0.25)',
            valColor: '#CBD5E1',
          },
          {
            id: 'HEALTH',
            status: 'ALL',
            label: 'Healthy Stock',
            value: `${kpis.inStockRate || (kpis.totalProducts > 0 ? Math.round(((kpis.inStockCount + (kpis.untrackedCount || 0)) / kpis.totalProducts) * 100) : 0)}%`,
            icon: ShieldCheck,
            iconColor: '#F43F5E',
            iconBg: 'rgba(244, 63, 94, 0.12)',
            activeBorder: '#F43F5E',
            activeBg: 'rgba(244, 63, 94, 0.14)',
            glow: 'rgba(244, 63, 94, 0.25)',
            valColor: '#FB7185',
          },
        ].map((card) => {
          const isActive = selectedStatus === card.status && (card.id === selectedStatus || (card.id === 'ALL' && selectedStatus === 'ALL'));

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                if (card.status) {
                  setSelectedStatus(card.status);
                  setPage(1);
                }
              }}
              className="admin-kpi-card-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 14,
                background: isActive
                  ? card.activeBg
                  : 'var(--surface-primary, #14131E)',
                border: isActive
                  ? `1px solid ${card.activeBorder}`
                  : '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
                boxShadow: isActive ? `0 0 14px ${card.glow}` : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                boxSizing: 'border-box',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                className="admin-kpi-card-icon"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: card.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.iconColor,
                  flexShrink: 0,
                }}
              >
                <card.icon size={16} />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  className="admin-kpi-card-val"
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    fontFamily: 'Outfit, sans-serif',
                    color: card.valColor || '#FFFFFF',
                    lineHeight: 1.1,
                  }}
                >
                  {card.value}
                </div>
                <div
                  className="admin-kpi-card-label"
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary, #ACA6B8)',
                    marginTop: 3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '0.02em',
                  }}
                >
                  {card.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Control & Filter Center */}
      <div
        className="inventory-filter-panel"
        style={{
          background: 'var(--surface-primary, #14131E)',
          border: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
          borderRadius: 18,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Search Box */}
          <div className="inventory-search-wrapper" style={{ position: 'relative', flex: '1 1 280px', minWidth: 240, maxWidth: 440, width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--accent-gold)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by piece name, category, color, size..."
              className="admin-input admin-search-input"
              style={{
                paddingLeft: 44,
                paddingRight: searchQuery ? 36 : 14,
                height: 40,
                fontSize: '0.86rem',
                borderRadius: 12,
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Categories and Stock Alert Filter - Aligned on the exact same line */}
          <div
            className="inventory-filter-selectors-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flex: '1 1 auto',
              justifyContent: 'space-between',
              minWidth: 0,
            }}
          >
            {/* Category Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <Filter size={15} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory('');
                  setPage(1);
                }}
                className="admin-input"
                style={{
                  height: 40,
                  padding: '0 32px 0 12px',
                  fontSize: '0.84rem',
                  borderRadius: 12,
                  width: '100%',
                  minWidth: 0,
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Dropdown (if active category has subcategories) */}
            {subcategories.filter((s) => s.category?.toLowerCase() === selectedCategory.toLowerCase()).length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => {
                    setSelectedSubcategory(e.target.value);
                    setPage(1);
                  }}
                  className="admin-input"
                  style={{
                    height: 40,
                    padding: '0 32px 0 12px',
                    fontSize: '0.84rem',
                    borderRadius: 12,
                    width: '100%',
                    minWidth: 0,
                    cursor: 'pointer',
                  }}
                >
                  <option value="">All Subcategories</option>
                  {subcategories
                    .filter((s) => s.category?.toLowerCase() === selectedCategory.toLowerCase())
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Threshold / Stock Alert Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              <select
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                className="admin-input"
                title="Low Stock Alert Threshold"
                style={{
                  height: 40,
                  padding: '0 28px 0 10px',
                  fontSize: '0.82rem',
                  borderRadius: 12,
                  width: '100%',
                  minWidth: 0,
                  cursor: 'pointer',
                }}
              >
                <option value={3}>Alert: ≤ 3 units</option>
                <option value={5}>Alert: ≤ 5 (Default)</option>
                <option value={10}>Alert: ≤ 10 units</option>
                <option value={15}>Alert: ≤ 15 units</option>
                <option value={20}>Alert: ≤ 20 units</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Master Table */}
      {loading ? (
        <SkeletonTable rows={10} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No Products Found"
          message="No items match your active search and stock status filters."
          actionText="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedSubcategory('');
            setSelectedStatus('ALL');
          }}
        />
      ) : (
        <div
          style={{
            background: 'var(--surface-primary, #14131E)',
            border: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--card-border, rgba(201, 168, 76, 0.15))',
                    background: 'rgba(255, 255, 255, 0.02)',
                    color: 'var(--text-muted)',
                    fontSize: '0.76rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '14px 18px', width: '32%', minWidth: 220 }}>Product Details</th>
                  <th style={{ padding: '14px 18px', width: '28%', minWidth: 200, whiteSpace: 'nowrap' }}>Stock Health</th>
                  <th style={{ padding: '14px 18px', width: '28%', minWidth: 210 }}>Stock Level / Variants</th>
                  <th style={{ padding: '14px 18px', width: '12%', minWidth: 100, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => {
                  const health = prod.health || {};
                  const isModified = stagedChanges[prod._id] !== undefined;
                  const stagedVal = stagedChanges[prod._id]?.value;

                  return (
                    <tr
                      key={prod._id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: isModified ? 'rgba(201, 168, 76, 0.06)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Product Details */}
                      <td style={{ padding: '14px 18px', minWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {prod.images?.[0]?.url ? (
                            <img
                              src={optimizeImageUrl(prod.images[0].url, 90)}
                              alt=""
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 10,
                                objectFit: 'cover',
                                border: '1px solid var(--card-border)',
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 10,
                                background: 'rgba(255, 255, 255, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <Package size={20} />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {prod.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{prod.category}</span>
                              {prod.subcategoryId?.name && <span>• {prod.subcategoryId.name}</span>}
                              {prod.packagingType && (
                                <span style={{ color: 'var(--accent-gold)' }}>
                                  ({prod.packagingQuantity && Number(prod.packagingQuantity) > 1
                                    ? `${prod.packagingQuantity} ${prod.packagingType}${prod.packagingType.toLowerCase() === 'set' ? 's' : ''}`
                                    : `${prod.packagingQuantity ? `${prod.packagingQuantity} ` : ''}${prod.packagingType}`})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stock Health */}
                      <td style={{ padding: '14px 18px', minWidth: 200, whiteSpace: 'nowrap' }}>
                        {health.status === 'INACTIVE' ? (
                          <span
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              padding: '5px 12px',
                              borderRadius: 999,
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'var(--text-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Inactive
                          </span>
                        ) : health.status === 'OUT_OF_STOCK' ? (
                          <span
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              padding: '5px 12px',
                              borderRadius: 999,
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#F87171',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ● Out of Stock (0)
                          </span>
                        ) : health.status === 'LOW_STOCK' ? (
                          <span
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              padding: '5px 12px',
                              borderRadius: 999,
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#FBBF24',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ▲ Low Stock ({health.totalTrackedStock} units)
                          </span>
                        ) : health.status === 'UNTRACKED' ? (
                          <span
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              padding: '5px 12px',
                              borderRadius: 999,
                              background: 'rgba(192, 132, 252, 0.15)',
                              color: '#C084FC',
                              border: '1px solid rgba(192, 132, 252, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ⚪ Untracked (Available)
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              padding: '5px 12px',
                              borderRadius: 999,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34D399',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ✓ In Stock ({health.totalTrackedStock} units)
                          </span>
                        )}
                      </td>

                      {/* Stock Level & Inline Controls */}
                      <td style={{ padding: '14px 18px', minWidth: 210 }}>
                        {prod.tier === 'TIER_1_COLOR_SIZE' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDrawerProduct(prod);
                              setIsDrawerOpen(true);
                            }}
                            className="btn-secondary"
                            style={{
                              padding: '6px 14px',
                              borderRadius: 10,
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <span>Manage {prod.colorVariants?.length || 0} Colors / Sizes</span>
                            <ChevronRight size={14} />
                          </button>
                        ) : prod.tier === 'TIER_2_SIZE' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDrawerProduct(prod);
                              setIsDrawerOpen(true);
                            }}
                            className="btn-secondary"
                            style={{
                              padding: '6px 14px',
                              borderRadius: 10,
                              fontSize: '0.8rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <span>Manage {prod.sizes?.length || 0} Sizes</span>
                            <ChevronRight size={14} />
                          </button>
                        ) : (
                          /* TIER 3: Simple Product Inline Stepper */
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleSimpleStockChange(prod, -1)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid var(--card-border)',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={
                                stagedVal !== undefined
                                  ? stagedVal
                                  : typeof prod.inStockCount === 'number'
                                  ? prod.inStockCount
                                  : ''
                              }
                              placeholder="Untracked"
                              onChange={(e) => handleSimpleStockChange(prod, e.target.value, true)}
                              className="admin-input"
                              style={{
                                width: 75,
                                height: 28,
                                textAlign: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                borderRadius: 6,
                                padding: 0,
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSimpleStockChange(prod, 1)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid var(--card-border)',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              +
                            </button>
                            {isModified && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 700, marginLeft: 4 }}>
                                Staged
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDrawerProduct(prod);
                            setIsDrawerOpen(true);
                          }}
                          className="btn-secondary"
                          style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="Open full variant and stock editor"
                        >
                          <Pencil size={12} />
                          <span>Stock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing page {page} of {pagination.totalPages} ({pagination.total} products total)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 8 }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 8 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Dock for Staged Inline Changes */}
      {stagedCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'var(--surface-primary, #14131E)',
            border: '1px solid var(--accent, #C4386C)',
            borderRadius: 16,
            padding: '12px 24px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(196, 56, 108, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            maxWidth: '90vw',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--accent, #C4386C)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF' }}>
              {stagedCount} product stock {stagedCount === 1 ? 'change' : 'changes'} staged
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleDiscardStaged}
              className="btn-secondary"
              style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: 8 }}
            >
              Discard
            </button>
            <button
              type="button"
              disabled={savingBatch}
              onClick={handleSaveAllStaged}
              className="btn-primary"
              style={{
                padding: '7px 20px',
                fontSize: '0.82rem',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: savingBatch ? 0.6 : 1,
              }}
            >
              <Save size={14} />
              <span>{savingBatch ? 'Saving...' : `Save All Changes (${stagedCount})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Variant Drawer */}
      <InventoryVariantDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setActiveDrawerProduct(null);
        }}
        product={activeDrawerProduct}
        onSave={handleDrawerSave}
        saving={savingDrawer}
      />

      {/* Audit History Slide-over */}
      <InventoryAuditHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* 2-Step CSV Import Modal */}
      <InventoryCSVModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onSuccess={fetchInventory}
      />
    </PageWrapper>
  );
};

export default Inventory;
