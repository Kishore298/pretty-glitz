import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import { Pencil, Trash2, Plus, Sparkles, Gem, Star, Heart, Flower2, Gift, Crown } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const catGradients = [
  { from: 'rgba(255,20,147,0.12)', to: 'rgba(138,43,226,0.04)', accent: '#FF1493', ring: '#FF1493' },
  { from: 'rgba(138,43,226,0.12)', to: 'rgba(99,102,241,0.04)', accent: '#8A2BE2', ring: '#8A2BE2' },
  { from: 'rgba(255,140,0,0.12)', to: 'rgba(255,215,0,0.04)', accent: '#FF8C00', ring: '#FF8C00' },
  { from: 'rgba(255,0,255,0.1)', to: 'rgba(218,112,214,0.04)', accent: '#FF00FF', ring: '#FF00FF' },
  { from: 'rgba(16,185,129,0.1)', to: 'rgba(52,211,153,0.04)', accent: '#10B981', ring: '#10B981' },
  { from: 'rgba(245,158,11,0.1)', to: 'rgba(252,211,77,0.04)', accent: '#F59E0B', ring: '#F59E0B' },
  { from: 'rgba(239,68,68,0.1)', to: 'rgba(252,165,165,0.04)', accent: '#EF4444', ring: '#EF4444' },
  { from: 'rgba(99,102,241,0.1)', to: 'rgba(165,180,252,0.04)', accent: '#6366F1', ring: '#6366F1' },
];

const catIcons = {
  'Bangles': <Sparkles size={24} />,
  'Glass Bangles': <Gem size={24} />,
  'Valaikaappu Bangles': <Star size={24} />,
  'Antique Bangles': <Crown size={24} />,
  'Wedding Bangles': <Heart size={24} />,
  'Artificial Flowers': <Flower2 size={24} />,
  'Gift Box Combo': <Gift size={24} />,
  'Jumkhas': <Star size={24} />,
  'Jewels': <Crown size={24} />,
};

const optimizeImageUrl = (url, opts = {}) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  const transforms = ['f_auto', 'q_auto'];
  if (opts.width) transforms.push(`w_${opts.width}`);
  if (opts.height) transforms.push(`h_${opts.height}`);
  if (opts.crop) transforms.push(`c_${opts.crop}`);
  return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
};


const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err) { console.error(err); }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(categories);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updatedWithOrder = reordered.map((c, index) => ({ ...c, order: index }));
    setCategories(updatedWithOrder);
    try {
      await api.put('/categories/reorder', { items: updatedWithOrder.map(c => ({ id: c._id, order: c.order })) });
    } catch (err) {
      console.error(err);
      fetchCategories();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, { name, bannerImage });
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', { name, bannerImage });
        toast.success('Category created successfully');
      }
      closeModal();
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (c) => {
    setEditId(c._id);
    setName(c.name);
    setBannerImage(c.bannerImage || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setName('');
    setBannerImage('');
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/categories/${deleteConfirm}`);
      toast.success('Category deleted successfully');
      setDeleteConfirm(null);
      fetchCategories();
    } catch (err) { 
      console.error(err); 
      toast.error('Failed to delete category');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0b0e' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: '#f0f0f5', margin: 0 }}>
              Categories
            </h1>
            <p style={{ color: '#4a4a60', fontSize: '0.85rem', marginTop: 6 }}>
              Drag and drop to control the order collections appear on the customer storefront.
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
            <Plus size={16} /> Add Category
          </button>
        </div>

        <div>
          <div style={{
            marginBottom: 24, padding: '16px 20px',
            background: 'rgba(255,140,0,0.05)', border: '1px solid rgba(255,140,0,0.15)',
            borderRadius: 10, fontSize: '0.8rem', color: '#4a4a60',
          }}>
            💡 Changes take effect immediately on the customer storefront.
          </div>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="categories-list" direction="horizontal">
              {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
                  >
                    {categories.map((category, index) => {
                      const col = {
                        name: category.name,
                        bannerImage: category.bannerImage,
                        gradient: catGradients[index % catGradients.length],
                      };

                      return (
                        <Draggable key={category._id} draggableId={category._id} index={index}>
                          {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              border: '1px solid rgba(255,255,255,0.07)',
                              borderRadius: 20,
                              overflow: 'hidden',
                              background: col.bannerImage ? 'rgba(255,255,255,0.03)' : `linear-gradient(135deg, ${col.gradient.from}, ${col.gradient.to})`,
                              display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'auto',
                              position: 'relative',
                              boxShadow: snapshot.isDragging ? `0 8px 30px ${col.gradient.from.replace('0.12', '0.4')}` : 'none',
                              borderColor: snapshot.isDragging ? col.gradient.ring + '50' : 'rgba(255,255,255,0.07)',
                              transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                              transform: snapshot.isDragging ? 'translateY(-6px)' : 'none',
                              cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                              ...provided.draggableProps.style,
                            }}
                          >
                            {!col.bannerImage && (
                              <>
                                <div style={{
                                  position: 'absolute', top: -40, right: -40,
                                  width: 160, height: 160, borderRadius: '50%',
                                  border: `1px solid ${col.gradient.ring}30`,
                                  pointerEvents: 'none',
                                }} />
                                <div style={{
                                  position: 'absolute', top: -20, right: -20,
                                  width: 100, height: 100, borderRadius: '50%',
                                  border: `1px solid ${col.gradient.ring}20`,
                                  pointerEvents: 'none',
                                }} />
                              </>
                            )}

                            {col.bannerImage ? (
                              <div style={{ height: 180, width: '100%', overflow: 'hidden', flexShrink: 0 }}>
                                <img src={optimizeImageUrl(col.bannerImage, { width: 400, height: 300, crop: 'fill' })} alt={col.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div style={{ padding: '24px 24px 0', flexShrink: 0 }}>
                                <div style={{
                                  width: 40, height: 40, borderRadius: 10,
                                  background: `linear-gradient(135deg, ${col.gradient.accent}, ${col.gradient.accent}80)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'white',
                                  boxShadow: `0 4px 20px ${col.gradient.accent}40`,
                                }}>
                                  {catIcons[col.name] || <Sparkles size={20} />}
                                </div>
                              </div>
                            )}

                            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                              <h3 style={{
                                fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                                fontSize: '1.25rem', color: '#f0f0f8', margin: 0,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                              }}>
                                {col.name}
                              </h3>

                              {/* Actions */}
                              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                <button onClick={() => handleEdit(category)}
                                  style={{ background: 'transparent', border: 'none', color: '#8888a8', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontSize: '0.85rem', fontWeight: 600 }}
                                  onMouseEnter={e => { e.currentTarget.style.color = col.gradient.accent; e.currentTarget.style.background = `${col.gradient.accent}15`; }}
                                  onMouseLeave={e => { e.currentTarget.style.color = '#8888a8'; e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <Pencil size={15} /> Edit
                                </button>
                                <button onClick={() => setDeleteConfirm(category._id)}
                                  style={{ background: 'transparent', border: 'none', color: '#8888a8', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', fontSize: '0.85rem', fontWeight: 600 }}
                                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.color = '#8888a8'; e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <Trash2 size={15} /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                          )}
                        </Draggable>
                      );
                    })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>


        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 24
        }}>
          <div style={{ 
            background: '#141419', border: '1px solid #1e1e28', 
            borderRadius: 16, padding: 32, width: '100%', maxWidth: 440,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <h3 style={{ margin: '0 0 24px', color: '#f0f0f5', fontSize: '1.2rem' }}>
              {editId ? 'Edit Category' : 'Create Category'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8a8aa0', marginBottom: 8 }}>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="admin-input" placeholder="e.g. Glass Bangles" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8a8aa0', marginBottom: 8 }}>Banner Image</label>
                <ImageUpload value={bannerImage} onChange={setBannerImage} placeholder="Upload Banner Image" />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={closeModal} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" style={{
                    flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                    background: 'linear-gradient(135deg, #8A2BE2, #FF1493)',
                    color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px',
                    fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.02em',
                    boxShadow: '0 4px 16px rgba(138,43,226,0.35)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(138,43,226,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(138,43,226,0.35)'; }}
                >
                  {editId ? '💾 Save Changes' : <><Plus size={16} /> Create Category</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Categories;
