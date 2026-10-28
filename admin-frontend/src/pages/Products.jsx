import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import { optimizeImageUrl } from '../utils/cloudinary';
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Gem,
  Search,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  Tag,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import AddEditProductModal from '../components/AddEditProductModal';
import ConfirmModal from '../components/ConfirmModal';
import PageWrapper from '../components/PageWrapper';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { SkeletonTable } from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'live' | 'outofstock' | 'offers'
  const [selectedCategory, setSelectedCategory] = useState('all');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'new') {
      setEditingProductId(null);
      setIsModalOpen(true);
      navigate('/products', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, subcatRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories').catch(() => ({ data: [] })),
        api.get('/subcategories').catch(() => ({ data: [] })),
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data.sort((a, b) => (a.order || 0) - (b.order || 0)) : []);
      setSubcategories(Array.isArray(subcatRes.data) ? subcatRes.data.sort((a, b) => (a.order || 0) - (b.order || 0)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      toast.success(`"${deleteTarget.name}" deleted successfully`);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter products by search, status, and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    let matchesStatus = true;
    if (activeFilter === 'live') matchesStatus = p.isActive;
    else if (activeFilter === 'outofstock') matchesStatus = !p.inStock;
    else if (activeFilter === 'offers') matchesStatus = p.isOffer;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <PageWrapper>
      {/* Page Header */}
      <PageHeader
        title="Products & Inventory"
        subtitle={`${products.length} total piece${products.length !== 1 ? 's' : ''} in the master catalog across collections`}
        badge="Catalog"
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
            <span>Add Product</span>
          </button>
        }
      />

      {/* Control & Filter Center */}
      <div
        className="products-filter-panel"
        style={{
          background: 'var(--surface-primary, #14131E)',
          border: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
          borderRadius: 18,
          padding: '16px 22px',
          marginBottom: 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          {/* Search Box */}
          <div className="products-search-wrapper" style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 440 }}>
            <Search
              size={17}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jewels by name, bangles, florals..."
              className="admin-input"
              style={{
                paddingLeft: 42,
                paddingRight: searchQuery ? 40 : 16,
                height: 42,
                fontSize: '0.88rem',
                borderRadius: 12,
              }}
            />
            {searchQuery && (
              <button
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
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
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
                height: 42,
                padding: '0 14px',
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

          {/* Quick Metrics Pills */}
          <div className="products-summary-pills" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeFilter === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: activeFilter === 'all' ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid var(--card-border)',
                color: activeFilter === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setActiveFilter('live')}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeFilter === 'live' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.06)',
                border: activeFilter === 'live' ? '1px solid #10B981' : '1px solid rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <CheckCircle2 size={12} />
              <span>Live ({products.filter((p) => p.isActive).length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('outofstock')}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeFilter === 'outofstock' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.06)',
                border: activeFilter === 'outofstock' ? '1px solid #EF4444' : '1px solid rgba(239, 68, 68, 0.2)',
                color: '#F87171',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <AlertCircle size={12} />
              <span>Out of Stock ({products.filter((p) => !p.inStock).length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('offers')}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeFilter === 'offers' ? 'rgba(201, 168, 76, 0.22)' : 'rgba(201, 168, 76, 0.06)',
                border: activeFilter === 'offers' ? '1px solid var(--accent-gold)' : '1px solid rgba(201, 168, 76, 0.2)',
                color: 'var(--accent-gold-light)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <Tag size={12} />
              <span>Offers ({products.filter((p) => p.isOffer).length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <SkeletonTable rows={7} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Products in Catalog"
          description="Start building your storefront by adding your first product to the catalog."
          action={{
            label: 'Add First Product',
            onClick: () => {
              setEditingProductId(null);
              setIsModalOpen(true);
            },
            icon: Plus,
          }}
        />
      ) : filteredProducts.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'var(--surface-primary)',
            borderRadius: 18,
            border: '1px solid var(--card-border)',
          }}
        >
          <Search size={32} color="var(--accent-gold)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
          <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '1.1rem' }}>No Products Match Your Filter</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 16px' }}>
            Try resetting your search query or filter tags to view all items.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
              setSelectedCategory('all');
            }}
            className="btn-secondary"
            style={{ margin: '0 auto' }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Categorized / Grouped Table Lists */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {categories.map((category) => {
            if (category.name === 'Artificial Flowers') {
              return subcategories.map((subcat) => {
                const catProducts = filteredProducts
                  .filter((p) => {
                    const pSubcatId = typeof p.subcategoryId === 'object' && p.subcategoryId ? p.subcategoryId._id : p.subcategoryId;
                    return p.category === category.name && pSubcatId === subcat._id;
                  })
                  .sort((a, b) => (a.order || 0) - (b.order || 0));

                if (catProducts.length === 0) return null;

                const onDragEndCategory = async (result) => {
                  if (!result.destination) return;
                  const reordered = Array.from(catProducts);
                  const [moved] = reordered.splice(result.source.index, 1);
                  reordered.splice(result.destination.index, 0, moved);

                  const updatedWithOrder = reordered.map((p, index) => ({ ...p, order: index }));

                  setProducts((prev) =>
                    prev.map((p) => {
                      const found = updatedWithOrder.find((up) => up._id === p._id);
                      return found ? found : p;
                    })
                  );

                  try {
                    const items = updatedWithOrder.map((p) => ({ id: p._id, order: p.order }));
                    await api.put('/products/reorder', { items });
                  } catch (err) {
                    console.error(err);
                    fetchProducts();
                  }
                };

                return (
                  <div key={`sub-${subcat._id}`}>
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {category.name} <span style={{ color: 'var(--accent-gold)' }}>—</span> {subcat.name}
                      </h2>
                      <span
                        style={{
                          background: 'rgba(201, 168, 76, 0.1)',
                          border: '1px solid rgba(201, 168, 76, 0.25)',
                          padding: '3px 12px',
                          borderRadius: 999,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--accent-gold-light)',
                        }}
                      >
                        {catProducts.length} items
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                        <GripVertical size={14} color="var(--accent-gold)" />
                        Drag rows to reorder sequence
                      </span>
                    </div>

                    <div
                      style={{
                        background: 'var(--surface-primary, #14131E)',
                        border: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
                        borderRadius: 18,
                        overflowX: 'auto',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <div style={{ minWidth: 840 }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 64px 1fr 180px 110px 130px 140px',
                            gap: 16,
                            padding: '16px 24px',
                            borderBottom: '1px solid var(--card-border)',
                            fontSize: '0.74rem',
                            color: 'var(--text-muted)',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                          }}
                        >
                          <span></span>
                          <span>Image</span>
                          <span>Product Piece</span>
                          <span>Category</span>
                          <span>Price</span>
                          <span>Status</span>
                          <span style={{ textAlign: 'right' }}>Actions</span>
                        </div>

                        <DragDropContext onDragEnd={onDragEndCategory}>
                          <Droppable droppableId={`droppable-${subcat._id}`}>
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef}>
                                {catProducts.map((product, index) => (
                                  <Draggable key={product._id} draggableId={product._id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="admin-table-row"
                                        style={{
                                          display: 'grid',
                                          gridTemplateColumns: '40px 64px 1fr 180px 110px 130px 140px',
                                          gap: 16,
                                          padding: '14px 24px',
                                          alignItems: 'center',
                                          background: snapshot.isDragging ? 'var(--surface-elevated, #222033)' : 'transparent',
                                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                          ...provided.draggableProps.style,
                                        }}
                                      >
                                        <div
                                          {...provided.dragHandleProps}
                                          style={{ color: 'var(--accent-gold)', cursor: 'grab', display: 'flex', justifyContent: 'center', opacity: 0.7 }}
                                        >
                                          <GripVertical size={18} />
                                        </div>

                                        <div
                                          style={{
                                            width: 54,
                                            height: 54,
                                            borderRadius: 12,
                                            background: 'var(--surface-secondary)',
                                            border: '1px solid var(--card-border)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                          }}
                                        >
                                          {product.images?.[0] ? (
                                            <img
                                              src={optimizeImageUrl(product.images[0].url, 150)}
                                              alt={product.name}
                                              loading="lazy"
                                              onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = '/pretty-glitz-logo.png';
                                                e.currentTarget.style.objectFit = 'contain';
                                                e.currentTarget.style.padding = '6px';
                                              }}
                                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                          ) : (
                                            <img
                                              src="/pretty-glitz-logo.png"
                                              alt="PrettyGlitz"
                                              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                                            />
                                          )}
                                        </div>

                                        <div>
                                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{product.name}</div>
                                          {product.sizes?.length > 0 && (
                                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                              {product.sizes.length} sizes available
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          <span
                                            style={{
                                              background: 'rgba(236, 72, 153, 0.1)',
                                              border: '1px solid rgba(236, 72, 153, 0.25)',
                                              color: '#EC4899',
                                              borderRadius: 999,
                                              padding: '4px 12px',
                                              fontSize: '0.74rem',
                                              fontWeight: 600,
                                              whiteSpace: 'nowrap',
                                              display: 'inline-block',
                                              maxWidth: '100%',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                            }}
                                          >
                                            {subcat.name}
                                          </span>
                                        </div>

                                        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.96rem' }}>
                                          ₹{product.price}
                                          {product.originalPrice && (
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem', marginLeft: 6, textDecoration: 'line-through' }}>
                                              ₹{product.originalPrice}
                                            </span>
                                          )}
                                        </div>

                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                          {(product.isBestseller || product.isFlagship) && (
                                            <span style={{ background: 'rgba(201, 168, 76, 0.12)', border: '1px solid rgba(201, 168, 76, 0.3)', color: 'var(--accent-gold-light)', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>
                                              ★ Best
                                            </span>
                                          )}
                                          <span
                                            style={{
                                              background: product.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                              border: `1px solid ${product.isActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                                              color: product.isActive ? '#10B981' : '#EF4444',
                                              borderRadius: 999,
                                              padding: '2px 8px',
                                              fontSize: '0.7rem',
                                              fontWeight: 600,
                                            }}
                                          >
                                            {product.isActive ? 'Live' : 'Off'}
                                          </span>
                                          {!product.inStock && (
                                            <span
                                              style={{
                                                background: 'rgba(239, 68, 68, 0.08)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                color: '#EF4444',
                                                borderRadius: 999,
                                                padding: '2px 8px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                              }}
                                            >
                                              Out of Stock
                                            </span>
                                          )}
                                        </div>

                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                          <button
                                            onClick={() => {
                                              setEditingProductId(product._id);
                                              setIsModalOpen(true);
                                            }}
                                            style={{
                                              background: 'rgba(255, 255, 255, 0.04)',
                                              border: '1px solid var(--card-border)',
                                              color: 'var(--text-secondary)',
                                              cursor: 'pointer',
                                              padding: '6px 12px',
                                              borderRadius: 8,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 6,
                                              transition: 'all 0.15s',
                                              fontSize: '0.82rem',
                                              fontWeight: 600,
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.color = 'var(--accent-gold)';
                                              e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.color = 'var(--text-secondary)';
                                              e.currentTarget.style.borderColor = 'var(--card-border)';
                                            }}
                                          >
                                            <Pencil size={13} />
                                            <span>Edit</span>
                                          </button>
                                          <button
                                            onClick={() => setDeleteTarget({ id: product._id, name: product.name })}
                                            style={{
                                              background: 'rgba(239, 68, 68, 0.04)',
                                              border: '1px solid rgba(239, 68, 68, 0.2)',
                                              color: 'var(--text-secondary)',
                                              cursor: 'pointer',
                                              padding: '6px 10px',
                                              borderRadius: 8,
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 6,
                                              transition: 'all 0.15s',
                                              fontSize: '0.82rem',
                                              fontWeight: 600,
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.color = '#EF4444';
                                              e.currentTarget.style.borderColor = '#EF4444';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.color = 'var(--text-secondary)';
                                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                                            }}
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                      </div>
                    </div>
                  </div>
                );
              });
            }

            const catProducts = filteredProducts
              .filter((p) => p.category === category.name)
              .sort((a, b) => (a.order || 0) - (b.order || 0));

            if (catProducts.length === 0) return null;

            const onDragEndCategory = async (result) => {
              if (!result.destination) return;
              const reordered = Array.from(catProducts);
              const [moved] = reordered.splice(result.source.index, 1);
              reordered.splice(result.destination.index, 0, moved);

              const updatedWithOrder = reordered.map((p, index) => ({ ...p, order: index }));

              setProducts((prev) =>
                prev.map((p) => {
                  const found = updatedWithOrder.find((up) => up._id === p._id);
                  return found ? found : p;
                })
              );

              try {
                const items = updatedWithOrder.map((p) => ({ id: p._id, order: p.order }));
                await api.put('/products/reorder', { items });
              } catch (err) {
                console.error(err);
                fetchProducts();
              }
            };

            return (
              <div key={category._id}>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {category.name}
                  </h2>
                  <span
                    style={{
                      background: 'rgba(201, 168, 76, 0.1)',
                      border: '1px solid rgba(201, 168, 76, 0.25)',
                      padding: '3px 12px',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--accent-gold-light)',
                    }}
                  >
                    {catProducts.length} items
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                    <GripVertical size={14} color="var(--accent-gold)" />
                    Drag rows to reorder sequence
                  </span>
                </div>

                <div
                  style={{
                    background: 'var(--surface-primary, #14131E)',
                    border: '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
                    borderRadius: 18,
                    overflowX: 'auto',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div style={{ minWidth: 840 }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 64px 1fr 180px 110px 130px 140px',
                        gap: 16,
                        padding: '16px 24px',
                        borderBottom: '1px solid var(--card-border)',
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <span></span>
                      <span>Image</span>
                      <span>Product Piece</span>
                      <span>Category</span>
                      <span>Price</span>
                      <span>Status</span>
                      <span style={{ textAlign: 'right' }}>Actions</span>
                    </div>

                    <DragDropContext onDragEnd={onDragEndCategory}>
                      <Droppable droppableId={`droppable-${category._id}`}>
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef}>
                            {catProducts.map((product, index) => (
                              <Draggable key={product._id} draggableId={product._id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="admin-table-row"
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: '40px 64px 1fr 180px 110px 130px 140px',
                                      gap: 16,
                                      padding: '14px 24px',
                                      alignItems: 'center',
                                      background: snapshot.isDragging ? 'var(--surface-elevated, #222033)' : 'transparent',
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                      ...provided.draggableProps.style,
                                    }}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      style={{ color: 'var(--accent-gold)', cursor: 'grab', display: 'flex', justifyContent: 'center', opacity: 0.7 }}
                                    >
                                      <GripVertical size={18} />
                                    </div>

                                    <div
                                      style={{
                                        width: 54,
                                        height: 54,
                                        borderRadius: 12,
                                        background: 'var(--surface-secondary)',
                                        border: '1px solid var(--card-border)',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      {product.images?.[0] ? (
                                        <img
                                          src={optimizeImageUrl(product.images[0].url, 150)}
                                          alt={product.name}
                                          loading="lazy"
                                          onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = '/pretty-glitz-logo.png';
                                            e.currentTarget.style.objectFit = 'contain';
                                            e.currentTarget.style.padding = '6px';
                                          }}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                      ) : (
                                        <img
                                          src="/pretty-glitz-logo.png"
                                          alt="PrettyGlitz"
                                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                                        />
                                      )}
                                    </div>

                                    <div>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{product.name}</div>
                                      {product.sizes?.length > 0 && (
                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                          {product.sizes.length} sizes available
                                        </div>
                                      )}
                                    </div>

                                    <div>
                                      <span
                                        style={{
                                          background: 'linear-gradient(135deg, rgba(196, 56, 108, 0.12), rgba(138, 43, 226, 0.12))',
                                          border: '1px solid rgba(201, 168, 76, 0.25)',
                                          color: 'var(--accent-gold-light)',
                                          borderRadius: 999,
                                          padding: '4px 12px',
                                          fontSize: '0.74rem',
                                          fontWeight: 600,
                                          whiteSpace: 'nowrap',
                                          display: 'inline-block',
                                          maxWidth: '100%',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {product.category}
                                      </span>
                                    </div>

                                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'Outfit, sans-serif', fontSize: '0.96rem' }}>
                                      ₹{product.price}
                                      {product.originalPrice && (
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem', marginLeft: 6, textDecoration: 'line-through' }}>
                                          ₹{product.originalPrice}
                                        </span>
                                      )}
                                    </div>

                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                      {(product.isBestseller || product.isFlagship) && (
                                        <span style={{ background: 'rgba(201, 168, 76, 0.12)', border: '1px solid rgba(201, 168, 76, 0.3)', color: 'var(--accent-gold-light)', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>
                                          ★ Best
                                        </span>
                                      )}
                                      <span
                                        style={{
                                          background: product.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                          border: `1px solid ${product.isActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                                          color: product.isActive ? '#10B981' : '#EF4444',
                                          borderRadius: 999,
                                          padding: '2px 8px',
                                          fontSize: '0.7rem',
                                          fontWeight: 600,
                                        }}
                                      >
                                        {product.isActive ? 'Live' : 'Off'}
                                      </span>
                                      {!product.inStock && (
                                        <span
                                          style={{
                                            background: 'rgba(239, 68, 68, 0.08)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            color: '#EF4444',
                                            borderRadius: 999,
                                            padding: '2px 8px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                          }}
                                        >
                                          Out of Stock
                                        </span>
                                      )}
                                    </div>

                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                      <button
                                        onClick={() => {
                                          setEditingProductId(product._id);
                                          setIsModalOpen(true);
                                        }}
                                        style={{
                                          background: 'rgba(255, 255, 255, 0.04)',
                                          border: '1px solid var(--card-border)',
                                          color: 'var(--text-secondary)',
                                          cursor: 'pointer',
                                          padding: '6px 12px',
                                          borderRadius: 8,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          transition: 'all 0.15s',
                                          fontSize: '0.82rem',
                                          fontWeight: 600,
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = 'var(--accent-gold)';
                                          e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = 'var(--text-secondary)';
                                          e.currentTarget.style.borderColor = 'var(--card-border)';
                                        }}
                                      >
                                        <Pencil size={13} />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={() => setDeleteTarget({ id: product._id, name: product.name })}
                                        style={{
                                          background: 'rgba(239, 68, 68, 0.04)',
                                          border: '1px solid rgba(239, 68, 68, 0.2)',
                                          color: 'var(--text-secondary)',
                                          cursor: 'pointer',
                                          padding: '6px 10px',
                                          borderRadius: 8,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 6,
                                          transition: 'all 0.15s',
                                          fontSize: '0.82rem',
                                          fontWeight: 600,
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color = '#EF4444';
                                          e.currentTarget.style.borderColor = '#EF4444';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = 'var(--text-secondary)';
                                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                                        }}
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <AddEditProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={editingProductId}
        onSuccess={fetchProducts}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product Piece"
        message="Are you sure you want to permanently delete this product? It will be removed immediately from your customer storefront and cart checkouts."
        itemName={deleteTarget?.name}
        confirmText="Delete Product"
        cancelText="Keep Product"
        type="danger"
        loading={isDeleting}
      />
    </PageWrapper>
  );
};

export default Products;
