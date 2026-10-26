import React, { useState, useEffect } from 'react';
import { Plus, Tag, ArrowRight, Sparkles } from 'lucide-react';
import api from '../utils/api';
import AddEditProductModal from '../components/AddEditProductModal';
import ConfirmModal from '../components/ConfirmModal';
import PageWrapper from '../components/PageWrapper';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const Offers = () => {
  const [products, setProducts] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  
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
    try {
      const { data } = await api.get('/products');
      setProducts(data);
      setOfferProducts(data.filter(p => p.isOffer));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    }
  };

  const handleMakeOffer = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !discountPrice) return;
    
    const product = products.find(p => p._id === selectedProductId);
    if (!product) return;

    try {
      await api.put(`/products/${selectedProductId}`, {
        price: Number(discountPrice),
        originalPrice: product.price,
        isOffer: true
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
        isOffer: false
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

  const nonOfferProducts = products.filter(p => !p.isOffer);

  return (
    <PageWrapper>
      <PageHeader
        title="Special Offers & Deals"
        subtitle="Manage promotional discounts, festive prices, and highlighted deals on storefront."
        badge={`${offerProducts.length} Active Deals`}
        actions={
          <button 
            onClick={() => { setEditingProductId(null); setIsModalOpen(true); }}
            className="btn-primary"
          >
            <Plus size={16} />
            <span>Add Custom Offer</span>
          </button>
        }
      />

      {/* Convert Existing Product into Offer */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(236, 22, 140, 0.05) 0%, rgba(229, 178, 93, 0.05) 100%)',
          border: '1px solid var(--card-border)',
          borderRadius: 20,
          padding: '28px 32px',
          marginBottom: 40,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Tag size={20} color="var(--accent-pink)" />
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>
            Convert Existing Product to Offer
          </h3>
        </div>
        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
          Select any live product from catalog and assign a discounted sale price.
        </p>

        <form onSubmit={handleMakeOffer} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 260 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="admin-input"
              required
              style={{ height: 44 }}
            >
              <option value="">-- Choose a product from catalog --</option>
              {nonOfferProducts.map(p => (
                <option key={p._id} value={p._id}>{p.name} (Current: ₹{p.price})</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
              Promotional Offer Price (₹)
            </label>
            <input
              type="number"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              placeholder="e.g. 499"
              className="admin-input"
              required
              min="0"
              style={{ height: 44 }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ height: 44, padding: '0 24px' }}>
            <span>Apply Deal</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Active Storefront Deals
        </h2>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {offerProducts.length} deal{offerProducts.length !== 1 ? 's' : ''} currently live
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {offerProducts.map(product => {
          const discountPct = product.originalPrice && product.originalPrice > product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : null;

          return (
            <div
              key={product._id}
              className="stat-card"
              style={{ 
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'rgba(236,22,140,0.1)',
                      border: '1px solid rgba(236,22,140,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-pink)',
                    }}
                  >
                    <Tag size={22} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {discountPct && (
                      <span className="badge-pill badge-danger" style={{ fontSize: '0.72rem' }}>
                        {discountPct}% OFF
                      </span>
                    )}
                    <button
                      onClick={() => setRemoveTarget(product)}
                      className="btn-danger"
                      style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                <h3 style={{ margin: '0 0 10px', color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 700 }}>
                  {product.name}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, paddingTop: 14, borderTop: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-pink)', fontFamily: 'Outfit, sans-serif' }}>
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 500 }}>
                    ₹{product.originalPrice}
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {product.category}
                </span>
              </div>
            </div>
          );
        })}

        {offerProducts.length === 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={Sparkles}
              title="No Active Offers Found"
              description="Convert existing products into promotional deals using the form above."
            />
          </div>
        )}
      </div>

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
        message="This will restore the product to its original price and remove the offer tag from storefront."
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
