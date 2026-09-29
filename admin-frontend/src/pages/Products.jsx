import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import { Plus, GripVertical, Pencil, Trash2, ShoppingBag } from 'lucide-react';
import AddEditProductModal from '../components/AddEditProductModal';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

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
  }, [categoryFilter]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data);
      } catch (err) { console.error(err); }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const url = categoryFilter === 'All' ? '/products' : `/products?category=${encodeURIComponent(categoryFilter)}`;
      const { data } = await api.get(url);
      setProducts(data);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) { console.error(err); }
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(products);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updatedWithOrder = reordered.map((p, index) => ({ ...p, order: index }));
    setProducts(updatedWithOrder);
    try {
      const items = updatedWithOrder.map(p => ({ id: p._id, order: p.order }));
      await api.put('/products/reorder', { items });
    } catch (err) {
      console.error(err);
      fetchProducts();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0b0e' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
              Products
            </h1>
            <p style={{ color: '#4a4a60', fontSize: '0.85rem', marginTop: 6 }}>
              {products.length} product{products.length !== 1 ? 's' : ''} {categoryFilter !== 'All' ? `in ${categoryFilter}` : 'total'}
            </p>
          </div>
          <button onClick={() => { setEditingProductId(null); setIsModalOpen(true); }} className="btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
            <Plus size={16} />
            Add Product
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: '#141419', border: '1px solid #1e1e28', borderRadius: 12,
          padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#8a8aa0', fontWeight: 500 }}>
            Filter & Reorder:
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['All', ...categories.map(c => c.name)].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '6px 16px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 500,
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                  background: categoryFilter === cat
                    ? 'linear-gradient(135deg, #FF1493, #8A2BE2)'
                    : 'rgba(255,255,255,0.05)',
                  color: categoryFilter === cat ? '#fff' : '#8a8aa0',
                  boxShadow: categoryFilter === cat ? '0 4px 15px rgba(138,43,226,0.4)' : 'none',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          {categoryFilter !== 'All' && (
            <span style={{ fontSize: '0.75rem', color: '#4a4a60', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <GripVertical size={14} />
              Drag rows to reorder
            </span>
          )}
        </div>

        {/* Products Table */}
        <div style={{
          background: '#141419', border: '1px solid #1e1e28',
          borderRadius: 16, overflow: 'hidden',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 64px 1fr 140px 90px 80px 130px',
            gap: 12, padding: '14px 20px',
            borderBottom: '1px solid #1e1e28',
            fontSize: '0.72rem', color: '#4a4a60', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {categoryFilter !== 'All' && <span></span>}
            <span>Image</span>
            <span style={{ gridColumn: categoryFilter !== 'All' ? undefined : '2' }}>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="products-list" isDropDisabled={categoryFilter === 'All'}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {products.map((product, index) => (
                    <Draggable
                      key={product._id}
                      draggableId={product._id}
                      index={index}
                      isDragDisabled={categoryFilter === 'All'}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="admin-table-row"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: categoryFilter !== 'All'
                              ? '40px 64px 1fr 140px 90px 80px 130px'
                              : '64px 1fr 140px 90px 80px 130px',
                            gap: 12, padding: '16px 20px',
                            alignItems: 'center',
                            background: snapshot.isDragging ? '#1a1a24' : 'transparent',
                            ...provided.draggableProps.style
                          }}
                        >
                          {categoryFilter !== 'All' && (
                            <div {...provided.dragHandleProps}
                              style={{ color: '#2a2a38', cursor: 'grab', display: 'flex', justifyContent: 'center' }}>
                              <GripVertical size={18} />
                            </div>
                          )}
                          {/* Image */}
                          <div style={{
                            width: 52, height: 52, borderRadius: 8,
                            background: '#0f0f14', border: '1px solid #1e1e28',
                            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {product.images?.[0]
                              ? <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ fontSize: '0.65rem', color: '#4a4a60' }}>No img</span>
                            }
                          </div>
                          {/* Name */}
                          <div>
                            <div style={{ fontWeight: 600, color: '#f0f0f5', fontSize: '0.9rem' }}>{product.name}</div>
                          </div>
                          {/* Category */}
                          <div>
                            <span style={{
                              background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.2)',
                              color: '#c084fc', borderRadius: 999, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 500,
                            }}>
                              {product.category}
                            </span>
                          </div>
                          {/* Price */}
                          <div style={{ color: '#f0f0f5', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                            ₹{product.price}
                            {product.originalPrice && (
                              <span style={{ color: '#4a4a60', fontWeight: 400, fontSize: '0.8rem', marginLeft: 6, textDecoration: 'line-through' }}>
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>
                          {/* Status */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {product.isFlagship && <span className="badge-flagship">★ Flag</span>}
                            <span style={{
                              background: product.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              border: `1px solid ${product.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                              color: product.isActive ? '#4ade80' : '#f87171',
                              borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 500,
                            }}>
                              {product.isActive ? 'Live' : 'Off'}
                            </span>
                            {!product.inStock && (
                              <span style={{
                                background: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.2)',
                                color: '#fb923c', borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 500,
                              }}>
                                Out of Stock
                              </span>
                            )}
                          </div>
                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => { setEditingProductId(product._id); setIsModalOpen(true); }} className="btn-edit" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Pencil size={12} /> Edit
                              </span>
                            </button>
                            <button onClick={() => handleDelete(product._id)} className="btn-danger">
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Trash2 size={12} /> Del
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {products.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a4a60' }}>
                      <ShoppingBag size={48} opacity={0.5} />
                      <p style={{ marginTop: 12, fontSize: '0.9rem' }}>No products found.</p>
                      <button onClick={() => { setEditingProductId(null); setIsModalOpen(true); }} className="btn-primary" style={{ display: 'inline-flex', marginTop: 16 }}>
                        <Plus size={14} /> Add your first product
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
      <AddEditProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={editingProductId}
        onSuccess={fetchProducts}
      />
    </div>
  );
};


export default Products;
