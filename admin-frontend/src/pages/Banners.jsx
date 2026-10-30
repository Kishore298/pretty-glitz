import React, { useState, useEffect, useRef } from 'react';
import { Plus, Image, Monitor, Smartphone, Pencil, Trash2, Eye, EyeOff, ChevronDown, Check } from 'lucide-react';
import api from '../utils/api';
import { optimizeImageUrl } from '../utils/cloudinary';
import PageWrapper from '../components/PageWrapper';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import ImageUpload from '../components/ImageUpload';
import toast from 'react-hot-toast';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [desktopImage, setDesktopImage] = useState('');
  const [mobileImage, setMobileImage] = useState('');
  const [linkTo, setLinkTo] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collections for dynamic redirect dropdown
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const getSelectedLabel = () => {
    if (!linkTo) return '-- No CTA Button (Display Image Only) --';
    if (linkTo === '/offers') return 'Special Offers Section (/offers)';
    if (linkTo === '/#bestsellers') return 'Best Sellers Section (/#bestsellers)';
    if (linkTo === '/categories') return 'All Collections Grid (/categories)';
    if (linkTo === '/products') return 'All Products Catalog (/products)';
    const cat = categories.find((c) => `/category/${encodeURIComponent(c.name)}` === linkTo);
    if (cat) return `${cat.name} Collection (/category/${cat.name})`;
    const sub = subcategories.find((s) => `/category/${encodeURIComponent(s.name)}` === linkTo);
    if (sub) return `${sub.name} ${sub.category?.name ? `(${sub.category.name})` : ''}`;
    return linkTo;
  };

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBanners();
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        api.get('/categories').catch(() => ({ data: [] })),
        api.get('/subcategories').catch(() => ({ data: [] })),
      ]);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setSubcategories(Array.isArray(subRes.data) ? subRes.data : []);
    } catch (e) {
      console.warn('Could not load categories for banner destination dropdown', e);
    }
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/banners/all');
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not fetch /banners/all, trying /banners fallback:', err);
      try {
        const fallbackRes = await api.get('/banners');
        setBanners(Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
      } catch (fallbackErr) {
        console.error('Error fetching fallback banners:', fallbackErr);
        toast.error('Failed to load hero banners');
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setTitle('');
    setDesktopImage('');
    setMobileImage('');
    setLinkTo('');
    setOrder(banners.length);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setTitle(banner.title || '');
    setDesktopImage(banner.desktopImage?.url || '');
    setMobileImage(banner.mobileImage?.url || '');
    setLinkTo(banner.linkTo || '');
    setOrder(banner.order || 0);
    setIsActive(banner.isActive !== false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setLinkTo('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!desktopImage && !mobileImage) {
      toast.error('Please upload at least one banner image (Desktop or Mobile)');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim() || 'Homepage Hero Banner',
        desktopImage: desktopImage || mobileImage, // fallback to mobile if desktop not uploaded
        mobileImage: mobileImage || desktopImage,   // fallback to desktop if mobile not uploaded
        linkTo: linkTo || '',
        order: Number(order) || 0,
        isActive,
      };

      if (editingBanner) {
        const { data } = await api.put(`/banners/${editingBanner._id}`, payload);
        toast.success('Hero banner updated successfully');
        setBanners(banners.map(b => b._id === editingBanner._id ? data : b));
      } else {
        const { data } = await api.post('/banners', payload);
        toast.success('New hero banner created successfully');
        setBanners([...banners, data].sort((a, b) => a.order - b.order));
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save banner:', err);
      toast.error('Failed to save banner. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const updated = !banner.isActive;
      const { data } = await api.put(`/banners/${banner._id}`, { isActive: updated });
      setBanners(banners.map(b => b._id === banner._id ? data : b));
      toast.success(`Banner ${updated ? 'activated' : 'deactivated'}`);
    } catch (err) {
      console.error('Failed to toggle banner status:', err);
      toast.error('Failed to update banner status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/banners/${deleteTarget._id}`);
      toast.success('Banner deleted successfully');
      setBanners(banners.filter(b => b._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete banner:', err);
      toast.error('Failed to delete banner');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Hero Banners"
        subtitle="Manage storefront hero carousel slides. Upload dedicated desktop and mobile images for seamless cross-device rendering."
        actions={
          <button
            onClick={openAddModal}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Add Hero Banner
          </button>
        }
      />

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {[1, 2].map(i => (
            <div key={i} className="card-luxury" style={{ height: 260, borderRadius: 14, opacity: 0.5 }} />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <EmptyState
          icon={Image}
          title="No Hero Banners Yet"
          description="Upload your first hero banners for desktop and mobile displays to showcase seasonal offers, bridal collections, and new arrivals."
          actionText="Upload Hero Banner"
          onAction={openAddModal}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
          {banners.map((banner, index) => (
            <div
              key={banner._id}
              className="card-luxury"
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--card-bg, #14131D)',
                border: '1px solid var(--card-border, rgba(201, 168, 76, 0.15))',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              }}
            >
              {/* Dual Breakpoint Previews */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 8, padding: 12, background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border)' }}>
                {/* Desktop Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <Monitor size={12} /> Desktop View
                  </div>
                  <div style={{ aspectRatio: '16/7', borderRadius: 8, overflow: 'hidden', background: '#0A0A0F', border: '1px solid var(--border)' }}>
                    {banner.desktopImage?.url ? (
                      <img
                        src={optimizeImageUrl(banner.desktopImage.url, 600)}
                        alt="Desktop Banner"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        No Desktop Image
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <Smartphone size={12} /> Mobile View
                  </div>
                  <div style={{ aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden', background: '#0A0A0F', border: '1px solid var(--border)' }}>
                    {banner.mobileImage?.url ? (
                      <img
                        src={optimizeImageUrl(banner.mobileImage.url, 400)}
                        alt="Mobile Banner"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        No Mobile Image
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner Info */}
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-gold, #C9A84C)',
                    background: 'rgba(201, 168, 76, 0.1)',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}>
                    Slide #{banner.order !== undefined ? banner.order + 1 : index + 1}
                  </span>

                  <button
                    onClick={() => handleToggleActive(banner)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      background: banner.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: banner.isActive ? '#10B981' : '#EF4444',
                    }}
                  >
                    {banner.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                    {banner.isActive ? 'Active' : 'Hidden'}
                  </button>
                </div>

                <h4 style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 16px',
                  lineHeight: 1.3,
                }}>
                  {banner.title || 'Hero Banner'}
                </h4>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => openEditModal(banner)}
                    className="btn-secondary"
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Pencil size={14} /> Edit Banner
                  </button>
                  <button
                    onClick={() => setDeleteTarget(banner)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#EF4444',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Delete Banner"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="modal-content-luxury"
            style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--modal-bg, #14131D)',
              border: '1px solid var(--card-border, rgba(201, 168, 76, 0.2))',
              borderRadius: 16,
              padding: 28,
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingBanner ? 'Edit Hero Banner' : 'Create New Hero Banner'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Upload separate banner images for desktop and smaller mobile devices.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: 6,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Banner Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Banner Title / Label
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Royal Wedding Bangles Collection"
                  className="input-luxury"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              {/* Banner Destination / CTA Link (Custom Scrollable Half-Height Dropdown) */}
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Explore Collection Destination (CTA Button on Banner)
                </label>

                {/* Dropdown Trigger */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--surface-secondary, #1B1928)',
                    border: `1px solid ${dropdownOpen ? 'var(--accent-gold, #C9A84C)' : 'var(--border)'}`,
                    color: linkTo ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    textAlign: 'left',
                    boxShadow: dropdownOpen ? '0 0 0 2px rgba(201, 168, 76, 0.2)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getSelectedLabel()}
                  </span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                      color: 'var(--accent-gold, #C9A84C)',
                    }}
                  />
                </button>

                {/* Scrollable Half-Height Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      maxHeight: '220px',
                      overflowY: 'auto',
                      background: '#151421',
                      border: '1px solid rgba(201, 168, 76, 0.35)',
                      borderRadius: 10,
                      boxShadow: '0 18px 40px rgba(0, 0, 0, 0.65)',
                      zIndex: 100,
                      padding: '6px 0',
                    }}
                  >
                    {/* No CTA option */}
                    <div
                      onClick={() => { setLinkTo(''); setDropdownOpen(false); }}
                      style={{
                        padding: '9px 14px',
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        color: !linkTo ? 'var(--accent-gold, #C9A84C)' : 'var(--text-muted)',
                        background: !linkTo ? 'rgba(201, 168, 76, 0.12)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = !linkTo ? 'rgba(201, 168, 76, 0.12)' : 'transparent'; }}
                    >
                      <span>-- No CTA Button (Display Image Only) --</span>
                      {!linkTo && <Check size={14} color="var(--accent-gold, #C9A84C)" />}
                    </div>

                    {/* Featured Sections Group */}
                    <div style={{ padding: '8px 14px 4px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-pink, #C4386C)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      ✨ Featured & Storefront Sections
                    </div>
                    {[
                      { val: '/offers', label: 'Special Offers Section (/offers)' },
                      { val: '/#bestsellers', label: 'Best Sellers Section (/#bestsellers)' },
                      { val: '/categories', label: 'All Collections Grid (/categories)' },
                      { val: '/products', label: 'All Products Catalog (/products)' },
                    ].map((item) => (
                      <div
                        key={item.val}
                        onClick={() => { setLinkTo(item.val); setDropdownOpen(false); }}
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          color: linkTo === item.val ? 'var(--accent-gold, #C9A84C)' : 'var(--text-primary)',
                          background: linkTo === item.val ? 'rgba(201, 168, 76, 0.12)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = linkTo === item.val ? 'rgba(201, 168, 76, 0.12)' : 'transparent'; }}
                      >
                        <span>{item.label}</span>
                        {linkTo === item.val && <Check size={14} color="var(--accent-gold, #C9A84C)" />}
                      </div>
                    ))}

                    {/* Dynamic Main Categories */}
                    {categories.length > 0 && (
                      <>
                        <div style={{ padding: '12px 14px 4px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-gold, #C9A84C)', textTransform: 'uppercase', letterSpacing: '0.08em', borderTop: '1px solid rgba(255, 255, 255, 0.06)', marginTop: 4 }}>
                          💎 Main Categories / Collections
                        </div>
                        {categories.map((cat) => {
                          const val = `/category/${encodeURIComponent(cat.name)}`;
                          const isSel = linkTo === val;
                          return (
                            <div
                              key={cat._id}
                              onClick={() => { setLinkTo(val); setDropdownOpen(false); }}
                              style={{
                                padding: '8px 14px',
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                                color: isSel ? 'var(--accent-gold, #C9A84C)' : 'var(--text-primary)',
                                background: isSel ? 'rgba(201, 168, 76, 0.12)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = isSel ? 'rgba(201, 168, 76, 0.12)' : 'transparent'; }}
                            >
                              <span>{cat.name} Collection (/category/{cat.name})</span>
                              {isSel && <Check size={14} color="var(--accent-gold, #C9A84C)" />}
                            </div>
                          );
                        })}
                      </>
                    )}

                    {/* Dynamic Subcategories */}
                    {subcategories.length > 0 && (
                      <>
                        <div style={{ padding: '12px 14px 4px', fontSize: '0.74rem', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.08em', borderTop: '1px solid rgba(255, 255, 255, 0.06)', marginTop: 4 }}>
                          🌸 Subcategories & Lines
                        </div>
                        {subcategories.map((sub) => {
                          const val = `/category/${encodeURIComponent(sub.name)}`;
                          const isSel = linkTo === val;
                          return (
                            <div
                              key={sub._id}
                              onClick={() => { setLinkTo(val); setDropdownOpen(false); }}
                              style={{
                                padding: '8px 14px',
                                fontSize: '0.86rem',
                                cursor: 'pointer',
                                color: isSel ? 'var(--accent-gold, #C9A84C)' : 'var(--text-primary)',
                                background: isSel ? 'rgba(201, 168, 76, 0.12)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = isSel ? 'rgba(201, 168, 76, 0.12)' : 'transparent'; }}
                            >
                              <span>{sub.name} {sub.category?.name ? `(${sub.category.name})` : ''}</span>
                              {isSel && <Check size={14} color="var(--accent-gold, #C9A84C)" />}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}

                <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Selecting a destination automatically adds an "Explore Collection →" button at the bottom centre of this banner. Future categories & subcategories added to your catalog will automatically appear in this list.
                </p>
              </div>

              {/* Two Image Upload Fields: Desktop & Mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {/* 1. Desktop Image Field */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Monitor size={15} color="var(--accent-gold, #C9A84C)" />
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Desktop Banner Image
                    </label>
                  </div>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>
                    Rendered on desktop & tablets (≥ 768px). Recommended ratio 16:6 or 1920×600.
                  </p>
                  <ImageUpload
                    value={desktopImage}
                    onChange={setDesktopImage}
                    placeholder="Upload Desktop Banner"
                  />
                </div>

                {/* 2. Mobile Image Field */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Smartphone size={15} color="var(--accent-pink, #C4386C)" />
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Mobile / Smaller Devices Banner
                    </label>
                  </div>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>
                    Rendered on mobile screens (&lt; 768px). Recommended ratio 4:5, 1:1, or 800×600.
                  </p>
                  <ImageUpload
                    value={mobileImage}
                    onChange={setMobileImage}
                    placeholder="Upload Mobile Banner"
                  />
                </div>
              </div>

              {/* Order & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Carousel Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="input-luxury"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: isActive ? '#10B981' : '#EF4444',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                    {isActive ? 'Active on Storefront' : 'Hidden from Storefront'}
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                  style={{ padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Saving...' : editingBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={Boolean(deleteTarget)}
          title="Delete Hero Banner"
          message={`Are you sure you want to delete the hero banner "${deleteTarget.title || 'Untitled'}"? This action cannot be undone.`}
          confirmText={isDeleting ? 'Deleting...' : 'Delete Banner'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isDanger
        />
      )}
    </PageWrapper>
  );
};

export default Banners;
