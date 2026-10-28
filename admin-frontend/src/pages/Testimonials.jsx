import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquareQuote,
  Plus,
  Pencil,
  Trash2,
  Star,
  GripVertical,
  Search,
  CheckCircle2,
  XCircle,
  Quote,
  Sparkles,
  MapPin,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../utils/api';
import ImageUpload from '../components/ImageUpload';
import ConfirmModal from '../components/ConfirmModal';
import PageWrapper from '../components/PageWrapper';
import { SkeletonTestimonials } from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [location, setLocation] = useState('');
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [hoverRating, setHoverRating] = useState(0);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/testimonials/all');
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setCustomerName('');
    setLocation('');
    setReview('');
    setRating(5);
    setAvatarUrl('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditId(t._id);
    setCustomerName(t.customerName || '');
    setLocation(t.location || '');
    setReview(t.review || '');
    setRating(t.rating || 5);
    setAvatarUrl(t.avatar?.url || '');
    setIsActive(t.isActive !== false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !review.trim()) {
      toast.error('Customer name and review are required');
      return;
    }

    setSubmitting(true);
    const payload = {
      customerName: customerName.trim(),
      location: location.trim(),
      review: review.trim(),
      rating: Number(rating) || 5,
      avatar: avatarUrl ? { url: avatarUrl } : null,
      isActive: Boolean(isActive),
    };

    try {
      if (editId) {
        const { data } = await api.put(`/testimonials/${editId}`, payload);
        setTestimonials(prev => prev.map(item => item._id === editId ? data : item));
        toast.success('Testimonial updated successfully');
      } else {
        const { data } = await api.post('/testimonials', {
          ...payload,
          order: testimonials.length,
        });
        setTestimonials(prev => [data, ...prev]);
        toast.success('Testimonial added successfully');
      }
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (t) => {
    try {
      const updatedStatus = !t.isActive;
      await api.put(`/testimonials/${t._id}`, { isActive: updatedStatus });
      setTestimonials(prev => prev.map(item => item._id === t._id ? { ...item, isActive: updatedStatus } : item));
      toast.success(updatedStatus ? 'Testimonial activated' : 'Testimonial hidden');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/testimonials/${deleteTarget._id}`);
      setTestimonials(prev => prev.filter(item => item._id !== deleteTarget._id));
      toast.success('Testimonial deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete testimonial');
    } finally {
      setDeleteTarget(null);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;

    const reordered = Array.from(testimonials);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    const updatedWithOrder = reordered.map((item, index) => ({ ...item, order: index }));
    setTestimonials(updatedWithOrder);

    try {
      await api.put('/testimonials/reorder', {
        items: updatedWithOrder.map(item => ({ id: item._id, order: item.order })),
      });
      toast.success('Display order updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save new order');
      fetchTestimonials();
    }
  };

  // Filtered testimonials
  const filteredTestimonials = testimonials.filter(t => {
    const matchesSearch =
      t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.review?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && t.isActive) ||
      (statusFilter === 'inactive' && !t.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalReviews = testimonials.length;
  const activeReviews = testimonials.filter(t => t.isActive).length;
  const inactiveReviews = totalReviews - activeReviews;
  const avgRating = totalReviews > 0
    ? (testimonials.reduce((acc, t) => acc + (t.rating || 5), 0) / totalReviews).toFixed(1)
    : '5.0';

  return (
    <PageWrapper>
      {/* ── Top Header ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(196, 56, 108, 0.2), rgba(138, 43, 226, 0.2))',
              border: '1px solid var(--card-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <MessageSquareQuote size={20} color="var(--accent-gold)" />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Social Proof & Reviews
              </span>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.15 }}>
                Customer Testimonials
              </h1>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 50px' }}>
            Curate customer experiences, ratings, and featured stories showcased across your luxury storefront
          </p>
        </div>

        <button onClick={openAddModal} className="btn-primary" style={{ padding: '10px 22px' }}>
          <Plus size={18} /> Add Testimonial
        </button>
      </div>

      {/* ── Metric Cards ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="stat-card" style={{ padding: 20 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Total Testimonials
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', marginTop: 8 }}>
            {totalReviews}
          </div>
        </div>

        <div className="stat-card" style={{ padding: 20 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} /> Active on Storefront
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#10B981', marginTop: 8 }}>
            {activeReviews}
          </div>
        </div>

        <div className="stat-card" style={{ padding: 20 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <XCircle size={14} /> Hidden / Inactive
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-muted)', marginTop: 8 }}>
            {inactiveReviews}
          </div>
        </div>

        <div className="stat-card" style={{ padding: 20 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={14} fill="var(--accent-gold)" /> Average Rating
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--accent-gold)', marginTop: 8 }}>
            {avgRating} <span style={{ fontSize: '1.1rem', fontWeight: 600, opacity: 0.8 }}>/ 5.0</span>
          </div>
        </div>
      </div>

      {/* ── Search and Filter Controls ────────────────────────── */}
      <div style={{
        background: 'var(--surface-primary)',
        border: '1px solid var(--card-border)',
        borderRadius: 14,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 440 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by customer, city, or review..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: 42 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Filter:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'inactive', label: 'Hidden' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: statusFilter === f.id ? 'var(--accent-pink)' : 'var(--card-border)',
                background: statusFilter === f.id ? 'rgba(236,22,140,0.12)' : 'transparent',
                color: statusFilter === f.id ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Drag & Drop Testimonial List ──────────────────────── */}
      {loading ? (
        <SkeletonTestimonials count={6} />
      ) : filteredTestimonials.length === 0 ? (
        <div style={{
          background: 'var(--surface-primary)',
          border: '1px dashed var(--card-border)',
          borderRadius: 16,
          padding: '64px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(236,22,140,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: 'var(--accent-pink)'
          }}>
            <MessageSquareQuote size={28} />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px' }}>
            {searchQuery || statusFilter !== 'all' ? 'No matching testimonials' : 'No testimonials yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 440, margin: '0 auto 24px' }}>
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Add customer feedback and reviews to highlight social proof on your storefront homepage.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button onClick={openAddModal} className="btn-primary">
              <Plus size={16} /> Add First Testimonial
            </button>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="testimonials-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}
              >
                {filteredTestimonials.map((t, index) => (
                  <Draggable key={t._id} draggableId={t._id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        style={{
                          ...dragProvided.draggableProps.style,
                          opacity: dragSnapshot.isDragging ? 0.9 : 1,
                        }}
                      >
                        <motion.div
                          layout
                          className="stat-card"
                          style={{
                            background: 'var(--surface-primary)',
                            borderRadius: 16,
                            border: `1px solid ${t.isActive ? 'var(--card-border)' : 'rgba(239,68,68,0.2)'}`,
                            padding: 24,
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            boxShadow: dragSnapshot.isDragging ? '0 16px 32px rgba(0,0,0,0.4)' : 'none'
                          }}
                        >
                          {/* Card Header: Drag handle & Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div
                              {...dragProvided.dragHandleProps}
                              style={{
                                cursor: 'grab',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px',
                                borderRadius: 6,
                              }}
                              title="Drag to reorder on storefront"
                            >
                              <GripVertical size={18} />
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                #{index + 1}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {/* Active Status Badge / Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(t)}
                                style={{
                                  background: t.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: t.isActive ? '#10B981' : '#f87171',
                                  border: `1px solid ${t.isActive ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                  borderRadius: 999,
                                  padding: '3px 10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  transition: 'all 0.15s ease'
                                }}
                                title={t.isActive ? 'Click to hide from storefront' : 'Click to show on storefront'}
                              >
                                {t.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                                {t.isActive ? 'Active' : 'Hidden'}
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openEditModal(t)}
                                className="btn-edit"
                                style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                                title="Edit testimonial"
                              >
                                <Pencil size={13} /> Edit
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(t)}
                                className="btn-danger"
                                style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                                title="Delete testimonial"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Star Rating */}
                          <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
                            {Array.from({ length: 5 }).map((_, starIndex) => (
                              <Star
                                key={starIndex}
                                size={15}
                                fill={starIndex < (t.rating || 5) ? 'var(--accent-gold)' : 'transparent'}
                                color={starIndex < (t.rating || 5) ? 'var(--accent-gold)' : 'var(--text-muted)'}
                              />
                            ))}
                          </div>

                          {/* Review Text */}
                          <div style={{ position: 'relative', flex: 1, marginBottom: 20 }}>
                            <Quote size={20} style={{ color: 'var(--accent-pink)', opacity: 0.35, marginBottom: 6 }} />
                            <p style={{
                              color: 'var(--text-secondary)',
                              fontSize: '0.92rem',
                              lineHeight: 1.6,
                              margin: 0,
                              fontStyle: 'italic',
                              wordBreak: 'break-word'
                            }}>
                              “{t.review}”
                            </p>
                          </div>

                          {/* Author Info */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            paddingTop: 14,
                            borderTop: '1px solid var(--card-border)',
                            marginTop: 'auto'
                          }}>
                            {t.avatar?.url ? (
                              <img
                                src={t.avatar.url}
                                alt={t.customerName}
                                loading="lazy"
                                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--card-border)' }}
                              />
                            ) : (
                              <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: 'Outfit, sans-serif'
                              }}>
                                {(t.customerName || '?')[0].toUpperCase()}
                              </div>
                            )}

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {t.customerName}
                              </div>
                              {t.location && (
                                <div style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  marginTop: 2
                                }}>
                                  <MapPin size={12} />
                                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {t.location}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                        </motion.div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                background: 'var(--surface-primary)',
                border: '1px solid var(--card-border)',
                borderRadius: 20,
                width: '100%',
                maxWidth: 540,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                position: 'relative'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '24px 28px 18px',
                borderBottom: '1px solid var(--card-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {editId ? 'Edit Testimonial' : 'Add Testimonial'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
                    {editId ? 'Update customer review and details' : 'Enter details of the customer review'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
                
                {/* Customer Name & Location */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Location / City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chennai, Tamil Nadu"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="admin-input"
                    />
                  </div>
                </div>

                {/* Rating Selector */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Rating ({rating} of 5 Stars)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isFilled = starVal <= (hoverRating || rating);
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => setRating(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 4,
                              transition: 'transform 0.15s ease'
                            }}
                          >
                            <Star
                              size={24}
                              fill={isFilled ? 'var(--accent-gold)' : 'transparent'}
                              color={isFilled ? 'var(--accent-gold)' : 'var(--text-muted)'}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)', marginLeft: 8 }}>
                      {rating === 5 ? '5.0 / 5.0 (Exceptional)' : `${rating}.0 / 5.0 Stars`}
                    </span>
                  </div>
                </div>

                {/* Review Message */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Customer Review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write or paste the customer's review here..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="admin-input"
                    style={{ resize: 'vertical', minHeight: 90 }}
                  />
                </div>

                {/* Avatar Image Upload */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Customer Photo / Avatar (Optional)
                  </label>
                  <ImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    placeholder="Upload Customer Avatar (Square recommended)"
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                    If no photo is uploaded, a monogram avatar with the customer's initial will be used.
                  </span>
                </div>

                {/* Status Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--card-border)',
                  marginBottom: 24
                }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Active on Storefront
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Show this review on the customer homepage testimonials section
                    </div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute', inset: 0, borderRadius: 24,
                      background: isActive ? 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))' : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.2s ease',
                      boxShadow: isActive ? '0 2px 8px rgba(236,22,140,0.3)' : 'none'
                    }}>
                      <span style={{
                        position: 'absolute', top: 3, left: isActive ? 23 : 3,
                        width: 18, height: 18, borderRadius: '50%',
                        background: 'white',
                        transition: 'left 0.2s ease'
                      }} />
                    </span>
                  </label>
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    <Sparkles size={16} />
                    {submitting ? 'Saving...' : (editId ? 'Update Testimonial' : 'Publish Testimonial')}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete Modal ──────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Testimonial?"
        message="Are you sure you want to delete this customer testimonial? This review will be permanently removed from storefront."
        itemName={deleteTarget?.customerName}
        confirmText="Delete Testimonial"
        cancelText="Keep Review"
        type="danger"
      />

    </PageWrapper>
  );
};

export default Testimonials;
