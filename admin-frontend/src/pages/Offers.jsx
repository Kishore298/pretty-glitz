import React, { useState, useEffect } from 'react';
import { Plus, Tag, ArrowRight, Sparkles, Percent, Pencil, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { optimizeImageUrl } from '../utils/cloudinary';
import AddEditProductModal from '../components/AddEditProductModal';
import ConfirmModal from '../components/ConfirmModal';
import PageWrapper from '../components/PageWrapper';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { SkeletonGrid } from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

const Offers = () => {
  const [products, setProducts] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    fetchProducts();
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

  const handleMakeOffer = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !discountPrice) return;

    const product = products.find((p) => p._id === selectedProductId);
    if (!product) return;

    try {
      await api.put(`/products/${selectedProductId}`, {
        price: Number(discountPrice),
        originalPrice: product.price,
        isOffer: true,
      });
      toast.success(`Special offer created for "${product.name}"`);
      setSelectedProductId('');
      setDiscountPrice('');
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create offer');
    }
  };

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
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove offer');
    } finally {
      setIsRemoving(false);
    }
  };

  const nonOfferProducts = products.filter((p) => !p.isOffer);

  return (
    <PageWrapper>
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

      {/* Convert Existing Product into Offer */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(196, 56, 108, 0.08) 0%, rgba(201, 168, 76, 0.08) 100%)',
          border: '1px solid rgba(201, 168, 76, 0.22)',
          borderRadius: 20,
          padding: '28px 32px',
          marginBottom: 40,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(201, 168, 76, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold)',
            }}
          >
            <Tag size={18} />
          </div>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
            Quickly Promote an Existing Product
          </h3>
        </div>
        <p style={{ margin: '0 0 22px', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
          Select an active product from the catalog to mark down with a discounted sale price and offer banner.
        </p>

        <form onSubmit={handleMakeOffer} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 260 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
              Select Catalog Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="admin-input"
              required
              style={{ height: 44, borderRadius: 12 }}
            >
              <option value="">-- Choose a product from catalog --</option>
              {nonOfferProducts.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} (Current Price: ₹{p.price})
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
              Promotional Offer Price (₹)
            </label>
            <input
              type="number"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              placeholder="e.g. 799"
              className="admin-input"
              required
              min="0"
              style={{ height: 44, borderRadius: 12 }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ height: 44, padding: '0 24px', borderRadius: 12, gap: 8 }}>
            <span>Activate Offer</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Active Storefront Deals
        </h2>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {offerProducts.length} deal{offerProducts.length !== 1 ? 's' : ''} currently live
        </span>
      </div>

      {/* Content: Skeleton vs Grid */}
      {loading ? (
        <SkeletonGrid count={4} />
      ) : offerProducts.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No Active Offers"
          description="Convert an existing product to an offer or create a promotional item using the form above."
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: 16,
            alignItems: 'start',
          }}
        >
          {offerProducts.map((product) => {
            const discountPct =
              product.originalPrice && product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : null;
            const savings =
              product.originalPrice && product.originalPrice > product.price
                ? product.originalPrice - product.price
                : 0;

            const primaryImg = product.images?.[0]?.url;

            return (
              <div
                key={product._id}
                style={{
                  background: 'var(--surface-primary, #14131E)',
                  border: '1px solid var(--card-border, rgba(201, 168, 76, 0.14))',
                  borderRadius: 14,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(201, 168, 76, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--card-border, rgba(201, 168, 76, 0.14))';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.22)';
                }}
              >
                {/* Media Showcase Area - Compact, Clean & Clear */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 140,
                    background: '#111019',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={primaryImg ? optimizeImageUrl(primaryImg, 400) : '/pretty-glitz-logo.png'}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/pretty-glitz-logo.png';
                      e.currentTarget.style.objectFit = 'contain';
                      e.currentTarget.style.padding = '12px';
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: primaryImg ? 'cover' : 'contain',
                      padding: primaryImg ? '0' : '12px',
                      transition: 'transform 0.35s ease',
                    }}
                  />

                  {/* Floating Category Pill */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      background: 'rgba(10, 10, 15, 0.82)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(201, 168, 76, 0.25)',
                      color: 'var(--accent-gold-light, #E8CE8A)',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 999,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      zIndex: 2,
                    }}
                  >
                    <Sparkles size={9} color="var(--accent-gold)" />
                    {product.category}
                  </span>

                  {/* Floating Discount Badge */}
                  {discountPct && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'linear-gradient(135deg, #C4386C, #8A2BE2)',
                        color: '#FFFFFF',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 999,
                        boxShadow: '0 2px 8px rgba(196, 56, 108, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        letterSpacing: '0.02em',
                        zIndex: 2,
                      }}
                    >
                      <Percent size={9} />
                      {discountPct}% OFF
                    </span>
                  )}
                </div>

                {/* Content Details: Snug, zero dead space, dynamically sizing with text */}
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column' }}>
                  <h3
                    style={{
                      margin: '0 0 4px',
                      color: 'var(--text-primary)',
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '0.94rem',
                      fontWeight: 700,
                      lineHeight: 1.25,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                    }}
                    title={product.name}
                  >
                    {product.name}
                  </h3>

                  {/* Price Section */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8, flexWrap: 'nowrap' }}>
                    <span
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: 'var(--accent-gold, #C9A84C)',
                        fontFamily: 'Outfit, sans-serif',
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ₹{product.price}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            textDecoration: 'line-through',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ₹{product.originalPrice}
                        </span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: '#10B981',
                            fontWeight: 700,
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            padding: '1px 5px',
                            borderRadius: 4,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Save ₹{savings}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Action Footer: Compact, single-line buttons without wrapping */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      paddingTop: 8,
                      borderTop: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditingProductId(product._id);
                        setIsModalOpen(true);
                      }}
                      className="btn-edit"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 8,
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setRemoveTarget(product)}
                      className="btn-danger"
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 8,
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddEditProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={editingProductId}
        onSuccess={fetchProducts}
        isOfferPreset={true}
      />

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
