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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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

      {/* KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Total Products */}
        <div
          onClick={() => {
            setSelectedStatus('ALL');
            setPage(1);
          }}
          title="Click to view all products"
          style={{
            background: 'var(--surface-primary, #14131E)',
            border: selectedStatus === 'ALL'
              ? '1px solid var(--accent-gold, #C9A84C)'
              : '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
            boxShadow: selectedStatus === 'ALL' ? '0 0 16px rgba(201, 168, 76, 0.15)' : 'none',
            borderRadius: 16,
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold, #C9A84C)',
            }}
          >
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Products
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', marginTop: 2 }}>
              {kpis.totalProducts}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              All catalog items
            </div>
          </div>
        </div>

        {/* In-Stock & Available */}
        <div
          onClick={() => {
            setSelectedStatus('IN_STOCK');
            setPage(1);
          }}
          title="Click to view in-stock products"
          style={{
            background: 'var(--surface-primary, #14131E)',
            border: selectedStatus === 'IN_STOCK'
              ? '1px solid #10B981'
              : '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: selectedStatus === 'IN_STOCK' ? '0 0 16px rgba(16, 185, 129, 0.2)' : 'none',
            borderRadius: 16,
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#6EE7B7', fontWeight: 600, textTransform: 'uppercase' }}>
              In Stock & Ready
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10B981', marginTop: 2 }}>
              {kpis.inStockCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {kpis.inStockRate || (kpis.totalProducts > 0 ? Math.round(((kpis.inStockCount + (kpis.untrackedCount || 0)) / kpis.totalProducts) * 100) : 0)}% healthy availability
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => {
            setSelectedStatus('LOW_STOCK');
            setPage(1);
          }}
          title="Click to view low-stock products"
          style={{
            background: 'var(--surface-primary, #14131E)',
            border: selectedStatus === 'LOW_STOCK'
              ? '1px solid #F59E0B'
              : '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: selectedStatus === 'LOW_STOCK' ? '0 0 16px rgba(245, 158, 11, 0.2)' : 'none',
            borderRadius: 16,
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#FCD34D', fontWeight: 600, textTransform: 'uppercase' }}>
              Low Stock (≤{threshold})
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F59E0B', marginTop: 2 }}>
              {kpis.lowStockCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Requires replenishment
            </div>
          </div>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => {
            setSelectedStatus('OUT_OF_STOCK');
            setPage(1);
          }}
          title="Click to view out-of-stock products"
          style={{
            background: 'var(--surface-primary, #14131E)',
            border: selectedStatus === 'OUT_OF_STOCK'
              ? '1px solid #EF4444'
              : '1px solid rgba(239, 68, 68, 0.25)',
            boxShadow: selectedStatus === 'OUT_OF_STOCK' ? '0 0 16px rgba(239, 68, 68, 0.2)' : 'none',
            borderRadius: 16,
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#FCA5A5', fontWeight: 600, textTransform: 'uppercase' }}>
              Out of Stock
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#EF4444', marginTop: 2 }}>
              {kpis.outOfStockCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Zero units available
            </div>
          </div>
        </div>

        {/* Inactive / Hidden */}
        <div
          onClick={() => {
            setSelectedStatus('INACTIVE');
            setPage(1);
          }}
          title="Click to view inactive/hidden products"
          style={{
            background: 'var(--surface-primary, #14131E)',
            border: selectedStatus === 'INACTIVE'
              ? '1px solid #8B5CF6'
              : '1px solid rgba(139, 92, 246, 0.25)',
            boxShadow: selectedStatus === 'INACTIVE' ? '0 0 16px rgba(139, 92, 246, 0.2)' : 'none',
            borderRadius: 16,
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A78BFA',
            }}
          >
            <EyeOff size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', color: '#DDD6FE', fontWeight: 600, textTransform: 'uppercase' }}>
              Inactive / Drafts
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#A78BFA', marginTop: 2 }}>
              {kpis.inactiveCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Hidden from storefront
            </div>
          </div>
        </div>
      </div>

      {/* Control & Filter Center */}
      <div
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
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 420 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--accent-gold)',
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
              className="admin-input"
              style={{
                paddingLeft: 40,
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

          {/* Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Filter size={15} color="var(--accent-gold)" />
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
                padding: '0 36px 0 14px',
                fontSize: '0.84rem',
                borderRadius: 12,
                minWidth: 160,
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
            <select
              value={selectedSubcategory}
              onChange={(e) => {
                setSelectedSubcategory(e.target.value);
                setPage(1);
              }}
              className="admin-input"
              style={{
                height: 40,
                padding: '0 36px 0 14px',
                fontSize: '0.84rem',
                borderRadius: 12,
                minWidth: 160,
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
          )}

          {/* Threshold Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Low Stock Alert:</span>
            <select
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="admin-input"
              style={{
                height: 40,
                padding: '0 28px 0 10px',
                fontSize: '0.82rem',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              <option value={3}>≤ 3 units</option>
              <option value={5}>≤ 5 units (Default)</option>
              <option value={10}>≤ 10 units</option>
              <option value={15}>≤ 15 units</option>
              <option value={20}>≤ 20 units</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {[
            { id: 'ALL', label: `All (${kpis.totalProducts})` },
            { id: 'IN_STOCK', label: `In Stock (${kpis.inStockCount})`, color: '#34D399' },
            { id: 'LOW_STOCK', label: `Low Stock (${kpis.lowStockCount})`, color: '#FBBF24' },
            { id: 'OUT_OF_STOCK', label: `Out of Stock (${kpis.outOfStockCount})`, color: '#F87171' },
            { id: 'UNTRACKED', label: `Untracked (${kpis.untrackedCount})`, color: '#C084FC' },
            { id: 'INACTIVE', label: `Inactive (${kpis.inactiveCount})`, color: '#9CA3AF' },
          ].map((pill) => {
            const isActive = selectedStatus === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setSelectedStatus(pill.id);
                  setPage(1);
                }}
                style={{
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isActive ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid var(--card-border)',
                  color: isActive ? '#FFFFFF' : pill.color || 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                {pill.label}
              </button>
            );
          })}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
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
                  <th style={{ padding: '14px 18px', width: '38%' }}>Product Details</th>
                  <th style={{ padding: '14px 18px', width: '22%' }}>Stock Health</th>
                  <th style={{ padding: '14px 18px', width: '28%' }}>Stock Level / Variants</th>
                  <th style={{ padding: '14px 18px', width: '12%', textAlign: 'right' }}>Actions</th>
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
                      <td style={{ padding: '14px 18px' }}>
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
                                justifyContent: 'center',
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
                                <span style={{ color: 'var(--accent-gold)' }}>({prod.packagingType})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stock Health */}
                      <td style={{ padding: '14px 18px' }}>
                        {health.status === 'INACTIVE' ? (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Inactive
                          </span>
                        ) : health.status === 'OUT_OF_STOCK' ? (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#F87171',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                            }}
                          >
                            ● Out of Stock (0)
                          </span>
                        ) : health.status === 'LOW_STOCK' ? (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#FBBF24',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                            }}
                          >
                            ▲ Low Stock ({health.totalTrackedStock} units)
                          </span>
                        ) : health.status === 'UNTRACKED' ? (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: 'rgba(192, 132, 252, 0.15)',
                              color: '#C084FC',
                              border: '1px solid rgba(192, 132, 252, 0.25)',
                            }}
                          >
                            ⚪ Untracked (Available)
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34D399',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                            }}
                          >
                            ✓ In Stock ({health.totalTrackedStock} units)
                          </span>
                        )}
                      </td>

                      {/* Stock Level & Inline Controls */}
                      <td style={{ padding: '14px 18px' }}>
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
