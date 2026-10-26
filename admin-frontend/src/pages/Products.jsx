import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import { optimizeImageUrl } from '../utils/cloudinary';
import { Plus, GripVertical, Pencil, Trash2, ShoppingBag, Search, X } from 'lucide-react';
import AddEditProductModal from '../components/AddEditProductModal';
import ConfirmModal from '../components/ConfirmModal';
import PageWrapper from '../components/PageWrapper';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'new') {
      setEditingProductId(null);
      setIsModalOpen(true);
      // Remove action from URL
      navigate('/products', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data.sort((a,b) => (a.order||0) - (b.order||0)));
      } catch (err) { console.error(err); }
    };
    const fetchSubcategories = async () => {
      try {
        const { data } = await api.get('/subcategories');
        setSubcategories(data.sort((a,b) => (a.order||0) - (b.order||0)));
      } catch (err) { console.error(err); }
    };
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const url = '/products';
      const { data } = await api.get(url);
      setProducts(data);
    } catch (err) { console.error(err); }
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



  return (
    <PageWrapper>
      {/* Page Header */}
      <PageHeader
        title="Products"
        subtitle={`${products.length} product${products.length !== 1 ? 's' : ''} total in catalog`}
        badge="Inventory"
        actions={
          <button
            onClick={() => { setEditingProductId(null); setIsModalOpen(true); }}
            className="btn-primary"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        }
      />

      {/* Quick Search & Summary Bar */}
      <div
        className="products-search-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          background: 'var(--surface-primary)',
          border: '1px solid var(--card-border)',
          borderRadius: 16,
          padding: '14px 20px',
          marginBottom: 32,
        }}
      >
        <div className="products-search-wrapper" style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 440 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name..."
            className="admin-input"
            style={{
              paddingLeft: 42,
              paddingRight: searchQuery ? 40 : 16,
              height: 42,
              fontSize: '0.88rem',
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

        <div className="products-summary-pills" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span className="badge-pill badge-success">
            {products.filter(p => p.isActive).length} Live
          </span>
          <span className="badge-pill badge-danger">
            {products.filter(p => !p.inStock).length} Out of Stock
          </span>
          <span className="badge-pill badge-warning">
            {products.filter(p => p.isOffer).length} Offers
          </span>
        </div>
      </div>

      {/* Categories / Products Lists */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>


        {categories.map(category => {
          if (category.name === 'Artificial Flowers') {
            return subcategories.map(subcat => {
              const catProducts = products.filter(p => {
                const pSubcatId = typeof p.subcategoryId === 'object' && p.subcategoryId ? p.subcategoryId._id : p.subcategoryId;
                const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
                return p.category === category.name && pSubcatId === subcat._id && matchesSearch;
              }).sort((a,b) => (a.order||0) - (b.order||0));

              if (catProducts.length === 0) return null;

              const onDragEndCategory = async (result) => {
                if (!result.destination) return;
                const reordered = Array.from(catProducts);
                const [moved] = reordered.splice(result.source.index, 1);
                reordered.splice(result.destination.index, 0, moved);
                
                const updatedWithOrder = reordered.map((p, index) => ({ ...p, order: index }));
                
                setProducts(prev => prev.map(p => {
                  const found = updatedWithOrder.find(up => up._id === p._id);
                  return found ? found : p;
                }));

                try {
                  const items = updatedWithOrder.map(p => ({ id: p._id, order: p.order }));
                  await api.put('/products/reorder', { items });
                } catch (err) {
                  console.error(err);
                  fetchProducts();
                }
              };

              return (
                <div key={`sub-${subcat._id}`}>
                  <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {category.name} - {subcat.name}
                    </h2>
                    <span style={{ background: 'var(--surface-elevated)', border: '1px solid var(--card-border)', padding: '2px 10px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {catProducts.length} items
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                      <GripVertical size={14} />
                      Drag rows to reorder
                    </span>
                  </div>

                  <div style={{
                    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                    borderRadius: 16, overflowX: 'auto',
                  }}>
                    <div style={{ minWidth: 800 }}>
                      <div style={{
                        display: 'grid', 
                        gridTemplateColumns: '40px 64px 1fr 180px 100px 110px 130px',
                        gap: 16, padding: '16px 24px',
                        borderBottom: '1px solid var(--card-border)',
                        fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        <span></span>
                        <span>Image</span>
                        <span>Product</span>
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
                                        gridTemplateColumns: '40px 64px 1fr 180px 100px 110px 130px',
                                        gap: 16, padding: '16px 24px',
                                        alignItems: 'center',
                                        background: snapshot.isDragging ? 'var(--surface-elevated)' : 'transparent',
                                        ...provided.draggableProps.style
                                      }}
                                    >
                                      <div {...provided.dragHandleProps}
                                        style={{ color: 'var(--text-muted)', cursor: 'grab', display: 'flex', justifyContent: 'center' }}>
                                        <GripVertical size={18} />
                                      </div>
                                      
                                      <div style={{
                                        width: 52, height: 52, borderRadius: 8,
                                        background: 'var(--surface-secondary)', border: '1px solid var(--card-border)',
                                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                      }}>
                                        {product.images?.[0]
                                          ? <img src={optimizeImageUrl(product.images[0].url, 100)} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          : <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No img</span>
                                        }
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{product.name}</div>
                                      </div>
                                      <div>
                                        <span style={{
                                          background: 'rgba(155,61,255,0.1)', border: '1px solid rgba(155,61,255,0.2)',
                                          color: 'var(--accent-purple)', borderRadius: 999, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600,
                                          whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}>
                                          {product.category}
                                        </span>
                                      </div>
                                      <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                                        ₹{product.price}
                                        {product.originalPrice && (
                                          <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', marginLeft: 6, textDecoration: 'line-through' }}>
                                            ₹{product.originalPrice}
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {(product.isBestseller || product.isFlagship) && <span style={{ background: 'rgba(214,168,95,0.1)', border: '1px solid rgba(214,168,95,0.2)', color: 'var(--accent-gold)', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>★ Best Seller</span>}
                                        <span style={{
                                          background: product.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                          border: `1px solid ${product.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                          color: product.isActive ? '#10b981' : '#ef4444',
                                          borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                                        }}>
                                          {product.isActive ? 'Live' : 'Off'}
                                        </span>
                                        {!product.inStock && (
                                          <span style={{
                                            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
                                            color: '#ef4444', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                                          }}>
                                            Out of Stock
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <button onClick={() => { setEditingProductId(product._id); setIsModalOpen(true); }}
                                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontSize: '0.85rem', fontWeight: 600 }}
                                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-pink)'; e.currentTarget.style.background = 'rgba(236,22,140,0.1)'; }}
                                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                                        >
                                          <Pencil size={15} /> Edit
                                        </button>
                                        <button onClick={() => setDeleteTarget({ id: product._id, name: product.name })}
                                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontSize: '0.85rem', fontWeight: 600 }}
                                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                                        >
                                          <Trash2 size={15} /> Delete
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

          const catProducts = products.filter(p => {
            const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return p.category === category.name && matchesSearch;
          }).sort((a,b) => (a.order||0) - (b.order||0));
          if (catProducts.length === 0) return null; // Only show categories that have products

          const onDragEndCategory = async (result) => {
            if (!result.destination) return;
            const reordered = Array.from(catProducts);
            const [moved] = reordered.splice(result.source.index, 1);
            reordered.splice(result.destination.index, 0, moved);
            
            const updatedWithOrder = reordered.map((p, index) => ({ ...p, order: index }));
            
            // Optimistic UI update
            setProducts(prev => prev.map(p => {
              const found = updatedWithOrder.find(up => up._id === p._id);
              return found ? found : p;
            }));

            try {
              const items = updatedWithOrder.map(p => ({ id: p._id, order: p.order }));
              await api.put('/products/reorder', { items });
            } catch (err) {
              console.error(err);
              fetchProducts();
            }
          };

          return (
            <div key={category._id}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {category.name}
                </h2>
                <span style={{ background: 'var(--surface-elevated)', border: '1px solid var(--card-border)', padding: '2px 10px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {catProducts.length} items
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                  <GripVertical size={14} />
                  Drag rows to reorder
                </span>
              </div>

              <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: 16, overflowX: 'auto',
              }}>
                <div style={{ minWidth: 800 }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid', 
                    gridTemplateColumns: '40px 64px 1fr 180px 100px 110px 130px',
                    gap: 16, padding: '16px 24px',
                    borderBottom: '1px solid var(--card-border)',
                    fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    <span></span>
                    <span>Image</span>
                    <span>Product</span>
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
                                    gridTemplateColumns: '40px 64px 1fr 180px 100px 110px 130px',
                                    gap: 16, padding: '16px 24px',
                                    alignItems: 'center',
                                    background: snapshot.isDragging ? 'var(--surface-elevated)' : 'transparent',
                                    ...provided.draggableProps.style
                                  }}
                                >
                                  <div {...provided.dragHandleProps}
                                    style={{ color: 'var(--text-muted)', cursor: 'grab', display: 'flex', justifyContent: 'center' }}>
                                    <GripVertical size={18} />
                                  </div>
                                  
                                  {/* Image */}
                                  <div style={{
                                    width: 52, height: 52, borderRadius: 8,
                                    background: 'var(--surface-secondary)', border: '1px solid var(--card-border)',
                                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}>
                                    {product.images?.[0]
                                      ? <img src={optimizeImageUrl(product.images[0].url, 100)} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      : <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No img</span>
                                    }
                                  </div>
                                  {/* Name */}
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{product.name}</div>
                                  </div>
                                  {/* Category */}
                                  <div>
                                    <span style={{
                                      background: 'rgba(155,61,255,0.1)', border: '1px solid rgba(155,61,255,0.2)',
                                      color: 'var(--accent-purple)', borderRadius: 999, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600,
                                      whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                      {product.category}
                                    </span>
                                  </div>
                                  {/* Price */}
                                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                                    ₹{product.price}
                                    {product.originalPrice && (
                                      <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', marginLeft: 6, textDecoration: 'line-through' }}>
                                        ₹{product.originalPrice}
                                      </span>
                                    )}
                                  </div>
                                  {/* Status */}
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {(product.isBestseller || product.isFlagship) && <span style={{ background: 'rgba(214,168,95,0.1)', border: '1px solid rgba(214,168,95,0.2)', color: 'var(--accent-gold)', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>★ Best Seller</span>}
                                    <span style={{
                                      background: product.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                      border: `1px solid ${product.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                      color: product.isActive ? '#10b981' : '#ef4444',
                                      borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                                    }}>
                                      {product.isActive ? 'Live' : 'Off'}
                                    </span>
                                    {!product.inStock && (
                                      <span style={{
                                        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
                                        color: '#ef4444', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                                      }}>
                                        Out of Stock
                                      </span>
                                    )}
                                  </div>
                                  {/* Actions */}
                                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button onClick={() => { setEditingProductId(product._id); setIsModalOpen(true); }}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontSize: '0.85rem', fontWeight: 600 }}
                                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-pink)'; e.currentTarget.style.background = 'rgba(236,22,140,0.1)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                                    >
                                      <Pencil size={15} /> Edit
                                    </button>
                                    <button onClick={() => setDeleteTarget({ id: product._id, name: product.name })}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontSize: '0.85rem', fontWeight: 600 }}
                                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                                    >
                                      <Trash2 size={15} /> Delete
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

        {(() => {
          const catProducts = products.filter(p => {
            const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return !categories.find(c => c.name === p.category) && matchesSearch;
          }).sort((a,b) => (a.order||0) - (b.order||0));
          if (catProducts.length === 0) return null;

          const onDragEndCategory = async (result) => {
            if (!result.destination) return;
            const reordered = Array.from(catProducts);
            const [moved] = reordered.splice(result.source.index, 1);
            reordered.splice(result.destination.index, 0, moved);
            
            const updatedWithOrder = reordered.map((p, index) => ({ ...p, order: index }));
            
            setProducts(prev => prev.map(p => {
              const found = updatedWithOrder.find(up => up._id === p._id);
              return found ? found : p;
            }));

            try {
              const items = updatedWithOrder.map(p => ({ id: p._id, order: p.order }));
              await api.put('/products/reorder', { items });
            } catch (err) {
              console.error(err);
              fetchProducts();
            }
          };

          return (
            <div key="uncategorized">
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Uncategorized
                </h2>
                <span style={{ background: 'var(--surface-elevated)', border: '1px solid var(--card-border)', padding: '2px 10px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {catProducts.length} items
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                  <GripVertical size={14} />
                  Drag rows to reorder
                </span>
              </div>

              <div style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: 16, overflowX: 'auto',
              }}>
                <div style={{ minWidth: 800 }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid', 
                    gridTemplateColumns: '40px 64px 1fr 180px 100px 110px 130px',
                    gap: 16, padding: '16px 24px',
                    borderBottom: '1px solid var(--card-border)',
                    fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    <span></span>
                    <span>Image</span>
                    <span>Product</span>
                    <span>Category</span>
                    <span>Price</span>
                    <span>Status</span>
                    <span style={{ textAlign: 'right' }}>Actions</span>
                  </div>

                  <DragDropContext onDragEnd={onDragEndCategory}>
                    <Droppable droppableId={`droppable-uncategorized`}>
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
                                    gridTemplateColumns: '40px 64px 1fr 180px 100px 110px 130px',
                                    gap: 16, padding: '16px 24px',
                                    alignItems: 'center',
                                    background: snapshot.isDragging ? 'var(--surface-elevated)' : 'transparent',
                                    ...provided.draggableProps.style
                                  }}
                                >
                                  <div {...provided.dragHandleProps}
                                    style={{ color: 'var(--text-muted)', cursor: 'grab', display: 'flex', justifyContent: 'center' }}>
                                    <GripVertical size={18} />
                                  </div>
                                  
                                  {/* Image */}
                                  <div style={{
                                    width: 52, height: 52, borderRadius: 8,
                                    background: 'var(--surface-secondary)', border: '1px solid var(--card-border)',
                                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}>
                                    {product.images?.[0]
                                      ? <img src={optimizeImageUrl(product.images[0].url, 100)} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      : <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No img</span>
                                    }
                                  </div>
                                  {/* Name */}
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{product.name}</div>
                                  </div>
                                  {/* Category */}
                                  <div>
                                    <span style={{
                                      background: 'rgba(155,61,255,0.1)', border: '1px solid rgba(155,61,255,0.2)',
                                      color: 'var(--accent-purple)', borderRadius: 999, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600,
                                      whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                      {product.category || 'None'}
                                    </span>
                                  </div>
                                  {/* Price */}
                                  <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                                    ₹{product.price}
                                    {product.originalPrice && (
                                      <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem', marginLeft: 6, textDecoration: 'line-through' }}>
                                        ₹{product.originalPrice}
                                      </span>
                                    )}
                                  </div>
                                  {/* Status */}
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {(product.isBestseller || product.isFlagship) && <span style={{ background: 'rgba(214,168,95,0.1)', border: '1px solid rgba(214,168,95,0.2)', color: 'var(--accent-gold)', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>★ Best Seller</span>}
                                    <span style={{
                                      background: product.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                      border: `1px solid ${product.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                      color: product.isActive ? '#10b981' : '#ef4444',
                                      borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                                    }}>
                                      {product.isActive ? 'Live' : 'Off'}
                                    </span>
                                    {!product.inStock && (
                                      <span style={{
                                        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
                                        color: '#ef4444', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                                      }}>
                                        Out of Stock
                                      </span>
                                    )}
                                  </div>
                                  {/* Actions */}
                                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button onClick={() => { setEditingProductId(product._id); setIsModalOpen(true); }}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontSize: '0.85rem', fontWeight: 600 }}
                                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-pink)'; e.currentTarget.style.background = 'rgba(236,22,140,0.1)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                                    >
                                      <Pencil size={15} /> Edit
                                    </button>
                                    <button onClick={() => setDeleteTarget({ id: product._id, name: product.name })}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontSize: '0.85rem', fontWeight: 600 }}
                                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                                    >
                                      <Trash2 size={15} /> Delete
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
        })()}

        {products.length === 0 && (
          <EmptyState
            icon={ShoppingBag}
            title="No Products in Catalog"
            description="Start building your storefront by adding your first product to the catalog."
            action={{
              label: 'Add First Product',
              onClick: () => { setEditingProductId(null); setIsModalOpen(true); },
              icon: Plus,
            }}
          />
        )}
      </div>
      <AddEditProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={editingProductId}
        onSuccess={fetchProducts}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to permanently delete this product? It will be removed immediately from your storefront."
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
