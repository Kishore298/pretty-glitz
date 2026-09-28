import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const Categories = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const reordered = Array.from(categories);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    
    const updatedWithOrder = reordered.map((c, index) => ({
      ...c,
      order: index
    }));
    
    setCategories(updatedWithOrder);
    
    try {
      const items = updatedWithOrder.map(c => ({ id: c._id, order: c.order }));
      await api.put('/categories/reorder', { items });
    } catch (err) {
      console.error(err);
      fetchCategories();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-10 overflow-y-auto h-screen">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Categories</h2>
        <p className="text-sm text-gray-500 mb-8">Drag and drop to reorder how the main categories appear on the customer storefront.</p>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200 max-w-2xl">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="categories-list">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-gray-200">
                  {categories.map((category, index) => (
                    <Draggable key={category._id} draggableId={category._id} index={index}>
                      {(provided, snapshot) => (
                        <li 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${snapshot.isDragging ? 'bg-indigo-50 shadow-lg' : 'hover:bg-gray-50'} transition bg-white`}
                        >
                          <div className="px-6 py-5 flex items-center">
                            <div {...provided.dragHandleProps} className="mr-6 text-gray-400 cursor-grab active:cursor-grabbing text-xl">
                              ☷
                            </div>
                            <div className="text-lg font-medium text-gray-900">{category.name}</div>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
};

export default Categories;
