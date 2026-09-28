import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const Subcategories = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('Bangles');

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    const { data } = await api.get('/subcategories');
    setSubcategories(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSubName) return;
    try {
      await api.post('/subcategories', {
        name: newSubName,
        category: newSubCategory,
        order: subcategories.length
      });
      setNewSubName('');
      fetchSubcategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete this subcategory? This might affect products.')) {
      await api.delete(`/subcategories/${id}`);
      fetchSubcategories();
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const reordered = Array.from(subcategories);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    
    // Update local order numbers
    const updatedWithOrder = reordered.map((sub, index) => ({
      ...sub,
      order: index
    }));
    
    setSubcategories(updatedWithOrder);
    
    try {
      const items = updatedWithOrder.map(s => ({ id: s._id, order: s.order }));
      await api.put('/subcategories/reorder', { items });
    } catch (err) {
      console.error(err);
      fetchSubcategories(); // Revert on failure
    }
  };

  const bangles = subcategories.filter(s => s.category === 'Bangles');
  const flowers = subcategories.filter(s => s.category === 'Artificial Flowers');
  const hair = subcategories.filter(s => s.category === 'Hair Accessories');

  const renderDraggableList = (items, droppableId) => (
    <Droppable droppableId={droppableId}>
      {(provided) => (
        <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 mt-4">
          {items.map((item, index) => (
            <Draggable key={item._id} draggableId={item._id} index={subcategories.findIndex(s => s._id === item._id)}>
              {(provided) => (
                <li
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="bg-white border border-gray-200 p-4 rounded-md shadow-sm flex justify-between items-center group hover:border-gray-400 transition"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-300 cursor-grab active:cursor-grabbing">☷</span>
                    <span className="font-medium text-gray-800">{item.name}</span>
                  </div>
                  <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:text-red-700 text-sm opacity-0 group-hover:opacity-100 transition">Delete</button>
                </li>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
          {items.length === 0 && <p className="text-sm text-gray-400 italic pt-2">No subcategories yet.</p>}
        </ul>
      )}
    </Droppable>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-10 overflow-y-auto h-screen">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Subcategories</h2>
        
        <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 mb-10 max-w-3xl">
          <h3 className="text-lg font-medium mb-4 text-gray-900">Add New Subcategory</h3>
          <form onSubmit={handleAdd} className="flex space-x-4">
            <input type="text" placeholder="Subcategory Name" value={newSubName} onChange={e => setNewSubName(e.target.value)} required className="flex-1 border border-gray-300 rounded-md py-2 px-3 focus:ring-gray-900 focus:border-gray-900 sm:text-sm" />
            <select value={newSubCategory} onChange={e => setNewSubCategory(e.target.value)} className="border border-gray-300 rounded-md py-2 px-3 focus:ring-gray-900 focus:border-gray-900 sm:text-sm w-48">
              <option>Bangles</option>
              <option>Artificial Flowers</option>
              <option>Hair Accessories</option>
            </select>
            <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded-md font-medium shadow hover:bg-black transition">Add</button>
          </form>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 uppercase tracking-widest text-sm mb-4 border-b border-gray-200 pb-2">Bangles</h3>
              {renderDraggableList(bangles, 'droppable-bangles')}
            </div>
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 uppercase tracking-widest text-sm mb-4 border-b border-gray-200 pb-2">Artificial Flowers</h3>
              {renderDraggableList(flowers, 'droppable-flowers')}
            </div>
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 uppercase tracking-widest text-sm mb-4 border-b border-gray-200 pb-2">Hair Accessories</h3>
              {renderDraggableList(hair, 'droppable-hair')}
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default Subcategories;
