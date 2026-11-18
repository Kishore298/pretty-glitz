import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Tag, ArrowRight, Sparkles, Percent, Pencil, Trash2, Search, X, Filter, Flame } from 'lucide-react';
import api from '../utils/api';
import AddEditProductModal from '../components/AddEditProductModal';
import ConfirmModal from '../components/ConfirmModal';
import PageWrapper from '../components/PageWrapper';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { SkeletonOfferCards } from '../components/SkeletonLoader';
import AdminOfferCard from '../components/AdminOfferCard';
import toast from 'react-hot-toast';

const Offers = () => {
  const [products, setProducts] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'active' (Live offers) | 'add' (Catalog items to promote)
  const [activeTab, setActiveTab] = useState('active');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [removeTarget, setRemoveTarget] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [addingId, setAddingId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      const prodList = Array.isArray(data) ? data : [];
      setProducts(prodList);
      setOfferProducts(prodList.filter((p) => p.isOffer));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Add a catalog product to offers
  const handleAddOffer = async (product, offerPrice) => {
    if (!product || !offerPrice) return;
    setAddingId(product._id);
    try {
      await api.put(`/products/${product._id}`, {
        price: Number(offerPrice),
        originalPrice: product.originalPrice && product.originalPrice > product.price ? product.originalPrice : product.price,
        isOffer: true,
      });
      toast.success(`Special offer activated for "${product.name}" at ₹${offerPrice}`);
      await fetchProducts();
      setActiveTab('active');
    } catch (err) {
      console.error('Failed to create offer:', err);
      toast.error(err.response?.data?.message || 'Failed to create offer');
    } finally {
      setAddingId(null);
    }
  };

  // Remove offer from product
  const handleRemoveOffer = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await api.put(`/products/${removeTarget._id}`, {
        price: removeTarget.originalPrice || removeTarget.price,
        originalPrice: 0,
        isOffer: false,
      });
      toast.success(`Offer removed for "${removeTarget.name}"`);
      setRemoveTarget(null);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove offer');
    } finally {
      setIsRemoving(false);
    }
  };

  const nonOfferProducts = useMemo(() => {
    return products.filter((p) => !p.isOffer);
  }, [products]);

  // Filtered Active Offers
  const filteredActiveOffers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return offerProducts.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));
      const matchCat =
        selectedCategory === 'all' ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      return matchSearch && matchCat;
    });
  }, [offerProducts, searchQuery, selectedCategory]);

  // Filtered Catalog Candidates (to Add)
  const filteredCatalogCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return nonOfferProducts.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q));
      const matchCat =
        selectedCategory === 'all' ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      return matchSearch && matchCat;
    });
  }, [nonOfferProducts, searchQuery, selectedCategory]);

  return (
    <PageWrapper>
      {/* ── Page Header ────────────────────────────────────────── */}
      <PageHeader
        title="Special Offers & Discounts"
        subtitle="Manage promotional festive discounts, strikethrough pricing, and highlighted deals on the storefront."
        badge={`${offerProducts.length} Active Deals`}
        actions={
          <button
            onClick={() => {
              setEditingProductId(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.88rem',
              fontWeight: 700,
            }}
          >
            <Plus size={16} />
            <span>Create New Offer Piece</span>
          </button>
        }
      />

      {/* ── Tabs Navigation ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          borderBottom: '1px solid var(--card-border, rgba(201, 168, 76, 0.15))',
          paddingBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          style={{
            padding: '9px 20px',
            borderRadius: 12,
            background: activeTab === 'active'
              ? 'linear-gradient(135deg, rgba(196, 56, 108, 0.25), rgba(138, 43, 226, 0.2))'
              : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'active'
              ? '1px solid var(--accent, #C4386C)'
              : '1px solid rgba(255, 255, 255, 0.08)',
            color: activeTab === 'active' ? '#FFFFFF' : 'var(--text-secondary)',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'active' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 'active' ? '0 4px 14px rgba(196, 56, 108, 0.2)' : 'none',
            transition: 'all 0.18s ease',
          }}
        >
          <Flame size={16} color={activeTab === 'active' ? 'var(--accent, #C4386C)' : 'var(--text-muted)'} />
          <span>Active Storefront Deals ({offerProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('add')}
          style={{
            padding: '9px 20px',
            borderRadius: 12,
            background: activeTab === 'add'
              ? 'linear-gradient(135deg, rgba(201, 168, 76, 0.25), rgba(196, 56, 108, 0.18))'
              : 'rgba(255, 255, 255, 0.04)',
            border: activeTab === 'add'
              ? '1px solid var(--accent-gold, #C9A84C)'
              : '1px solid rgba(255, 255, 255, 0.08)',
            color: activeTab === 'add' ? '#FFFFFF' : 'var(--text-secondary)',
            fontSize: '0.88rem',
            fontWeight: activeTab === 'add' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeTab === 'add' ? '0 4px 14px rgba(201, 168, 76, 0.2)' : 'none',
            transition: 'all 0.18s ease',
          }}
        >
          <Plus size={16} color={activeTab === 'add' ? 'var(--accent-gold, #C9A84C)' : 'var(--text-muted)'} />
          <span>Add Products to Offers ({nonOfferProducts.length})</span>
        </button>
      </div>

      {/* ── Control & Filter Center ────────────────────────────── */}
      <div
        style={{
          background: 'var(--surface-primary, #14131E)',
          border: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
          borderRadius: 18,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 440 }}>
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'active'
                ? 'Search active deals by piece name, category...'
                : 'Search catalog pieces to add as an offer...'
            }
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

        {/* Category Dropdown Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={15} color="var(--accent-gold)" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="admin-input"
            style={{
              height: 40,
              padding: '0 36px 0 14px',
              fontSize: '0.84rem',
              borderRadius: 12,
              minWidth: 170,
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
      </div>

      {/* ── TAB 1: ACTIVE STOREFRONT DEALS ─────────────────────── */}
      {activeTab === 'active' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Active Deals on Storefront
              </h2>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(196, 56, 108, 0.18)',
                  color: 'var(--accent, #C4386C)',
                }}
              >
                {filteredActiveOffers.length} Live
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className="btn-secondary"
              style={{ padding: '6px 14px', borderRadius: 10, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} />
              <span>Add More Offers</span>
            </button>
          </div>

          {loading ? (
            <SkeletonOfferCards count={6} />
          ) : filteredActiveOffers.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No Active Offers Found"
              description={
                searchQuery || selectedCategory !== 'all'
                  ? 'No active offers match your current filter criteria.'
                  : 'You do not have any active promotional deals live right now. Add pieces from the catalog to activate deals!'
              }
              actionText="Add Products to Offers"
              onAction={() => setActiveTab('add')}
            />
          ) : (
            /* Responsive Grid of Compact Horizontal Cards */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 16,
              }}
            >
              {filteredActiveOffers.map((product) => (
                <AdminOfferCard
                  key={product._id}
                  product={product}
                  mode="active"
                  onEdit={(id) => {
                    setEditingProductId(id);
                    setIsModalOpen(true);
                  }}
                  onRemove={(prod) => setRemoveTarget(prod)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ADD PRODUCTS TO OFFERS (CATALOG CANDIDATES) ── */}
      {activeTab === 'add' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Select Catalog Products to Promote
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Set your desired offer price and click <b>Add to Offers</b> to instantly activate the promotion.
              </p>
            </div>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {filteredCatalogCandidates.length} eligible piece{filteredCatalogCandidates.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <SkeletonOfferCards count={6} />
          ) : filteredCatalogCandidates.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No Catalog Pieces Available"
              description="All products in this category are already marked as special offers, or none match your search."
              actionText="View Active Deals"
              onAction={() => setActiveTab('active')}
            />
          ) : (
            /* Responsive Grid of Compact Horizontal Cards with Add Button */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 16,
              }}
            >
              {filteredCatalogCandidates.map((product) => (
                <AdminOfferCard
                  key={product._id}
                  product={product}
                  mode="add"
                  onAddOffer={handleAddOffer}
                  adding={addingId === product._id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <AddEditProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={editingProductId}
        onSuccess={fetchProducts}
        isOfferPreset={true}
      />

      {/* Remove Offer Confirmation Modal */}
      <ConfirmModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveOffer}
        title="Remove Special Offer?"
        message="This will restore the product to its original MRP price and remove the promotional ribbon from the customer storefront."
        itemName={removeTarget?.name}
        confirmText="Remove Offer"
        cancelText="Keep Offer"
        type="warning"
        loading={isRemoving}
      />
    </PageWrapper>
  );
};

export default Offers;
