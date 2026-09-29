import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import { GripVertical, Pencil, Trash2, Plus } from 'lucide-react';

const catColors = {
  'Bangles': { accent: '#fb7185', glow: 'rgba(251,113,133,0.3)' },
  'Artificial Flowers': { accent: '#c084fc', glow: 'rgba(192,132,252,0.3)' },
  'Jewels': { accent: '#fb923c', glow: 'rgba(251,146,60,0.3)' },
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        await api.put(`/categories/${editId}`, { name, description, bannerImage });
      } else {
        await api.post('/categories', { name, description, bannerImage });
      }
      closeModal();
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (c) => {
    setEditId(c._id);
    setName(c.name);
    setDescription(c.description || '');
    setBannerImage(c.bannerImage || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setName('');
    setDescription('');
    setBannerImage('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this category?')) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err) { console.error(err); }
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
          {/* Left Column: Drag & Drop List */}
          <div style={{ maxWidth: 640 }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="categories-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  {categories.map((category, index) => {
                    const colors = catColors[category.name] || { accent: '#8a8aa0', glow: 'transparent' };
                    return (
                      <Draggable key={category._id} draggableId={category._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              background: snapshot.isDragging ? '#1a1a28' : '#141419',
                              border: `1px solid ${snapshot.isDragging ? colors.accent + '40' : '#1e1e28'}`,
                              borderRadius: 12, padding: '18px 20px',
                              display: 'flex', alignItems: 'center', gap: 16,
                              boxShadow: snapshot.isDragging ? `0 8px 30px ${colors.glow}` : 'none',
                              transition: 'border-color 0.2s, background 0.2s',
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div {...provided.dragHandleProps} style={{
                              color: '#2a2a38', cursor: 'grab', display: 'flex',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#4a4a60'}
                            onMouseLeave={e => e.currentTarget.style.color = '#2a2a38'}
                            >
                              <GripVertical size={20} />
                            </div>

                            <div style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: colors.accent,
                              boxShadow: `0 0 8px ${colors.glow}`,
                              flexShrink: 0,
                            }} />

                            <div style={{ flex: 1 }}>
                              <div style={{ color: '#f0f0f5', fontWeight: 700, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>
                                {category.name}
                              </div>
                              <div style={{ color: '#4a4a60', fontSize: '0.75rem', marginTop: 2 }}>
                                Position {index + 1}
                              </div>
                            </div>

                            <div style={{
                              padding: '4px 12px', borderRadius: 999,
                              background: colors.accent + '15',
                              border: `1px solid ${colors.accent}30`,
                              color: colors.accent, fontSize: '0.75rem', fontWeight: 600,
                              marginRight: 16
                            }}>
                              #{index + 1}
                            </div>

                            <button onClick={() => handleEdit(category)} style={{ background: 'transparent', border: 'none', color: '#8a8aa0', cursor: 'pointer', padding: 4 }}>
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDelete(category._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                              <Trash2 size={16} />
                            </button>
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

          <div style={{
            marginTop: 24, padding: '16px 20px',
            background: 'rgba(255,140,0,0.05)', border: '1px solid rgba(255,140,0,0.15)',
            borderRadius: 10, fontSize: '0.8rem', color: '#4a4a60',
          }}>
            💡 Changes take effect immediately on the customer storefront.
          </div>
        </div>

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
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8a8aa0', marginBottom: 8 }}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="admin-input" rows="3" placeholder="Category description..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8a8aa0', marginBottom: 8 }}>Banner Image URL</label>
                <input type="url" value={bannerImage} onChange={e => setBannerImage(e.target.value)} className="admin-input" placeholder="https://..." />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={closeModal} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  {editId ? 'Save Changes' : <><Plus size={16} /> Create Category</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
