import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { Pencil, Trash2, Plus, Sparkles, Flower2, MoreHorizontal } from 'lucide-react';
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
  'Rose Garlands': <Flower2 size={24} />,
  'Jasmine Strings': <Flower2 size={24} />,
  'Veni': <Flower2 size={24} />,
  'Bridal Gajra': <Flower2 size={24} />
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


const Subcategories = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [name, setName] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => { fetchSubcategories(); }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest('.category-action-menu') && !e.target.closest('.category-menu-btn')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const fetchSubcategories = async () => {
    try {
      const { data } = await api.get('/subcategories');
      setSubcategories(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (err) { console.error(err); }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(subcategories);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updatedWithOrder = reordered.map((c, index) => ({ ...c, order: index }));
    setSubcategories(updatedWithOrder);
    try {
      await api.put('/subcategories/reorder', { items: updatedWithOrder.map(c => ({ id: c._id, order: c.order })) });
    } catch (err) {
      console.error(err);
      toast.error('Failed to reorder: ' + (err.response?.data?.message || err.message));
      fetchSubcategories();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/subcategories/${editId}`, { name, bannerImage, category: 'artifical flowers' });
        toast.success('Subcategory updated successfully');
      } else {
        await api.post('/subcategories', { name, bannerImage, category: 'artifical flowers' });
        toast.success('Subcategory created successfully');
      }
      closeModal();
      fetchSubcategories();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save subcategory');
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
      await api.delete(`/subcategories/${deleteConfirm}`);
      toast.success('Subcategory deleted successfully');
      setDeleteConfirm(null);
      fetchSubcategories();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete subcategory');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Flower Subcategories
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
            Drag and drop to control the order subcategories appear on the customer storefront.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> Add Subcategory
        </button>
      </div>

      <div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="subcategories-list" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="admin-grid"
              >
                {subcategories.map((category, index) => {
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
                          className="admin-category-card-wrapper"
                          style={{
                            ...provided.draggableProps.style,
                          }}
                        >
                          <motion.div
                            className="admin-category-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                            style={{
                              cursor: snapshot.isDragging ? 'grabbing' : 'pointer',
                              border: 'none',
                              borderRadius: 16,
                              overflow: 'hidden',
                              background: 'var(--card-bg)',
                              display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'auto',
                              position: 'relative',
                              boxShadow: snapshot.isDragging ? `0 12px 30px rgba(0,0,0,0.4)` : '0 4px 12px rgba(0,0,0,0.1)',
                              transform: snapshot.isDragging ? 'translateY(-6px)' : undefined,
                            }}
                          >


                          {/* Image Area */}
                          {col.bannerImage ? (
                            <div style={{ aspectRatio: '16/9', width: '100%', overflow: 'hidden', flexShrink: 0 }}>
                              <img src={optimizeImageUrl(col.bannerImage, { width: 400, height: 300, crop: 'fill' })} alt={col.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ) : (
                            <div style={{ aspectRatio: '16/9', width: '100%', background: `linear-gradient(135deg, ${col.gradient.from}, ${col.gradient.to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <div style={{
                                width: 48, height: 48, borderRadius: 12,
                                background: `linear-gradient(135deg, ${col.gradient.accent}, ${col.gradient.accent}80)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white',
                                boxShadow: `0 4px 20px ${col.gradient.accent}40`,
                              }}>
                                {catIcons[col.name] || <Sparkles size={24} />}
                              </div>
                            </div>
                          )}

                          {/* Content Area */}
                          <div className="admin-category-content" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative' }}>
                            <div style={{ minWidth: 0 }}>
                              <h3 style={{
                                fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                                fontSize: '1.1rem', color: 'var(--text-primary)', margin: '0 0 4px',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                              }}>
                                {col.name}
                              </h3>
                            </div>

                            {/* Action Menu */}
                            <div style={{ position: 'relative' }}>
                              <button
                                className="category-menu-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu(activeMenu === category._id ? null : category._id);
                                }}
                                style={{
                                  background: activeMenu === category._id ? 'var(--surface-elevated)' : 'transparent',
                                  border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'background 0.2s, color 0.2s'
                                }}
                              >
                                <MoreHorizontal size={18} />
                              </button>

                              {activeMenu === category._id && (
                                <div className="category-action-menu" style={{
                                  position: 'absolute', bottom: '100%', right: 0, marginBottom: 8,
                                  background: 'var(--surface-elevated)', border: '1px solid var(--card-border)',
                                  borderRadius: 10, padding: 6, minWidth: 140,
                                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)', zIndex: 20
                                }}>
                                  <button onClick={() => { handleEdit(category); setActiveMenu(null); }} style={{
                                    width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)',
                                    padding: '8px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10,
                                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'background 0.15s'
                                  }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <Pencil size={14} style={{ color: 'var(--text-secondary)' }} /> Edit
                                  </button>
                                  <button onClick={() => { setDeleteConfirm(category._id); setActiveMenu(null); }} style={{
                                    width: '100%', background: 'transparent', border: 'none', color: '#ef4444',
                                    padding: '8px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10,
                                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'background 0.15s'
                                  }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          </motion.div>
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

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 24
        }}>
          <div style={{
            background: 'var(--surface-elevated)', border: '1px solid var(--card-border)',
            borderRadius: 16, padding: 32, width: '100%', maxWidth: 440,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ margin: '0 0 24px', color: 'var(--text-primary)', fontSize: '1.2rem' }}>
              {editId ? 'Edit Subcategory' : 'Create Subcategory'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="admin-input" placeholder="e.g. Rose Garlands" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>Banner Image</label>
                <ImageUpload value={bannerImage} onChange={setBannerImage} placeholder="Upload Banner Image" />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={closeModal} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  {editId ? '💾 Save Changes' : <><Plus size={16} /> Create</>}
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
        title="Delete Subcategory"
        message="Are you sure you want to delete this subcategory? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Subcategories;
