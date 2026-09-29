import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const Subcategories = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    try {
      const { data } = await api.get('/subcategories');
      setSubcategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        // Not implementing PUT for simplicity, let's just do add/delete
      } else {
        await api.post('/subcategories', { name, category: 'artifical flowers' });
      }
      setName('');
      setEditId(null);
      fetchSubcategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this subcategory?')) {
      try {
        await api.delete(`/subcategories/${id}`);
        fetchSubcategories();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0b0e' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#f0f0f5', margin: '0 0 8px' }}>
              Flower Subcategories
            </h1>
            <p style={{ color: '#8a8aa0', fontSize: '0.9rem', margin: 0 }}>
              Manage subcategories for Artificial Flowers
            </p>
          </div>
        </div>

      <div style={{ background: '#141419', border: '1px solid #1e1e28', borderRadius: 16, padding: 32, marginBottom: 32 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 16 }}>
          <input
            type="text"
            placeholder="Subcategory Name (e.g. Rose, Jasmine)"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="admin-input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="admin-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} />
            {editId ? 'Update' : 'Add Subcategory'}
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {subcategories.map(sub => (
          <div key={sub._id} style={{ background: '#141419', border: '1px solid #1e1e28', borderRadius: 16, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#f0f0f5', fontSize: '1.1rem', fontWeight: 600 }}>{sub.name}</h3>
            <button onClick={() => handleDelete(sub._id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {subcategories.length === 0 && (
          <div style={{ color: '#8a8aa0', gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
            No subcategories found. Add one above.
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Subcategories;
