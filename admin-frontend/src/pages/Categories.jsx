import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import {
  Pencil,
  Trash2,
  Plus,
  Sparkles,
  X,
  GripVertical,
  Layers
} from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import ConfirmModal from '../components/ConfirmModal';
import PageWrapper from '../components/PageWrapper';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { SkeletonCategories } from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

const luxuryGradients = [
  { from: 'rgba(196, 56, 108, 0.22)', to: 'rgba(201, 168, 76, 0.08)', accent: '#C4386C', ring: '#C9A84C' },
  { from: 'rgba(138, 43, 226, 0.22)', to: 'rgba(201, 168, 76, 0.08)', accent: '#8A2BE2', ring: '#C9A84C' },
  { from: 'rgba(201, 168, 76, 0.26)', to: 'rgba(184, 134, 11, 0.1)', accent: '#C9A84C', ring: '#E5C378' },
  { from: 'rgba(16, 185, 129, 0.22)', to: 'rgba(201, 168, 76, 0.08)', accent: '#10B981', ring: '#C9A84C' },
  { from: 'rgba(236, 72, 153, 0.22)', to: 'rgba(138, 43, 226, 0.08)', accent: '#EC4899', ring: '#C9A84C' },
  { from: 'rgba(168, 85, 247, 0.22)', to: 'rgba(196, 56, 108, 0.08)', accent: '#A855F7', ring: '#C9A84C' },
];

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
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
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
      toast.success('Collection order updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reorder: ' + (err.response?.data?.message || err.message));
      fetchCategories();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
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
    <PageWrapper>
      <PageHeader
        title="Category Collections"
        subtitle="Drag and reorder collection cards to customize their exact appearance and hierarchy on your storefront."
        badge={`${categories.length} Collections`}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
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
            <span>Add Category</span>
          </button>
        }
      />

      {/* Sync Status Info Banner */}
      <div
        style={{
          maxWidth: 960,
          margin: '0 0 24px 0',
          padding: '14px 20px',
          background: 'rgba(201, 168, 76, 0.08)',
          border: '1px solid rgba(201, 168, 76, 0.22)',
          borderRadius: 14,
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={16} color="var(--accent-gold)" />
          <span>Drag horizontal cards up and down to customize collection hierarchy and storefront sequence.</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold-light)', fontWeight: 600 }}>
          Auto-Saved
        </div>
      </div>

      {/* Content State: Skeleton vs Empty vs DragDrop Grid */}
      {loading ? (
        <SkeletonCategories count={6} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Categories Found"
          message="Create your first collection category to showcase bangles, flowers, and jewellery on the storefront."
          action={{
            label: 'Add First Category',
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="categories-list" direction="vertical">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxWidth: 960,
                  width: '100%',
                  margin: 0,
                }}
              >
                {categories.map((category, index) => {
                  const col = {
                    name: category.name,
                    bannerImage: category.bannerImage,
                    gradient: luxuryGradients[index % luxuryGradients.length],
                  };

                  return (
                    <Draggable key={category._id} draggableId={category._id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                          }}
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03, duration: 0.2 }}
                            style={{
                              cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                              borderRadius: 14,
                              background: snapshot.isDragging
                                ? 'linear-gradient(135deg, rgba(201, 168, 76, 0.15), rgba(30, 27, 45, 0.95))'
                                : 'var(--surface-primary, #14131E)',
                              border: snapshot.isDragging
                                ? '1px solid var(--accent-gold)'
                                : '1px solid var(--card-border, rgba(201, 168, 76, 0.12))',
                              boxShadow: snapshot.isDragging
                                ? '0 16px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(201, 168, 76, 0.25)'
                                : '0 4px 16px rgba(0, 0, 0, 0.15)',
                              padding: '12px 18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 16,
                              transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                              transform: snapshot.isDragging ? 'scale(1.015)' : undefined,
                            }}
                            onMouseEnter={(e) => {
                              if (!snapshot.isDragging) {
                                e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.35)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!snapshot.isDragging) {
                                e.currentTarget.style.borderColor = 'var(--card-border, rgba(201, 168, 76, 0.12))';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
                              }
                            }}
                          >
                            {/* Left Group: Drag handle & Rank, Image Thumbnail, Title */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
                              {/* Drag Handle & Order Rank */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  padding: '6px 10px',
                                  borderRadius: 8,
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  userSelect: 'none',
                                  flexShrink: 0,
                                }}
                              >
                                <GripVertical size={16} color="var(--accent-gold)" />
                                <span>#{index + 1}</span>
                              </div>

                              {/* Banner / Category Thumbnail */}
                              <div
                                style={{
                                  width: 72,
                                  height: 52,
                                  borderRadius: 10,
                                  overflow: 'hidden',
                                  background: 'var(--surface-secondary, #1a1829)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <img
                                  src={col.bannerImage ? optimizeImageUrl(col.bannerImage, 200) : '/pretty-glitz-logo.png'}
                                  alt={col.name}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/pretty-glitz-logo.png';
                                    e.currentTarget.style.objectFit = 'contain';
                                    e.currentTarget.style.padding = '8px';
                                  }}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: col.bannerImage ? 'cover' : 'contain',
                                    padding: col.bannerImage ? 0 : 8,
                                  }}
                                />
                              </div>

                              {/* Category Info */}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <h3
                                  style={{
                                    fontFamily: 'Outfit, sans-serif',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    color: 'var(--text-primary)',
                                    margin: 0,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {col.name}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-gold-light)', fontWeight: 500 }}>
                                    Storefront Rank: #{index + 1}
                                  </span>
                                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                                    • Synced with Navbar & Homepage
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right Group: Direct Actions (Edit & Delete) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(category);
                                }}
                                title="Edit Category"
                                style={{
                                  background: 'rgba(201, 168, 76, 0.1)',
                                  border: '1px solid rgba(201, 168, 76, 0.25)',
                                  color: 'var(--accent-gold)',
                                  cursor: 'pointer',
                                  padding: '8px 14px',
                                  borderRadius: 8,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  transition: 'all 0.18s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(201, 168, 76, 0.22)';
                                  e.currentTarget.style.borderColor = 'var(--accent-gold)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(201, 168, 76, 0.1)';
                                  e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.25)';
                                }}
                              >
                                <Pencil size={14} />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(category._id);
                                }}
                                title="Delete Category"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#EF4444',
                                  cursor: 'pointer',
                                  padding: '8px 12px',
                                  borderRadius: 8,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  transition: 'all 0.18s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)';
                                  e.currentTarget.style.borderColor = '#EF4444';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                                }}
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
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
      )}

      {/* Add / Edit Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(7, 6, 11, 0.78)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 24,
            }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #181726 0%, #12111A 100%)',
                border: '1px solid rgba(201, 168, 76, 0.25)',
                borderRadius: 22,
                padding: '32px 30px',
                width: '100%',
                maxWidth: 480,
                boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
                position: 'relative',
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  position: 'absolute',
                  top: 18,
                  right: 18,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(201, 168, 76, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-gold)',
                  }}
                >
                  <Layers size={18} />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'Outfit, sans-serif',
                    color: 'var(--text-primary)',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                  }}
                >
                  {editId ? 'Edit Collection' : 'Create New Collection'}
                </h3>
              </div>

              <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                {editId
                  ? 'Update collection name or showcase banner for the storefront.'
                  : 'Add a new collection to feature in customer navigation and catalog.'}
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="admin-input"
                    placeholder="e.g. Silk Thread Bangles, Temple Jewels..."
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
                    Collection Banner Image
                  </label>
                  <ImageUpload value={bannerImage} onChange={setBannerImage} placeholder="Upload High-Res Banner" />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button type="button" onClick={closeModal} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1.5, justifyContent: 'center', gap: 8 }}>
                    {editId ? 'Save Changes' : <><Plus size={16} /> Create Collection</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Category Collection?"
        message="Are you sure you want to remove this category? Products previously categorized under this name will remain in the catalog as unassigned."
        itemName={categories.find((c) => c._id === deleteConfirm)?.name}
        confirmText="Delete Category"
        cancelText="Keep Category"
        type="danger"
      />
    </PageWrapper>
  );
};

export default Categories;
