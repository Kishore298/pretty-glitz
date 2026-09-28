import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const fetchProducts = async () => {
    try {
      const url = categoryFilter === 'All' ? '/products' : `/products?category=${encodeURIComponent(categoryFilter)}`;
      const { data } = await api.get(url);
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        console.error(err);
      }
    }
  }

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const reordered = Array.from(products);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    
    const updatedWithOrder = reordered.map((p, index) => ({
      ...p,
      order: index
    }));
    
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-10 overflow-y-auto h-screen">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Products</h2>
          <Link to="/products/new" className="bg-gray-900 text-white px-4 py-2 rounded shadow hover:bg-black transition">
            + Add Product
          </Link>
        </div>
        
        <div className="mb-6 flex items-center space-x-4 bg-white p-4 rounded-md shadow-sm border border-gray-200">
          <label className="text-sm font-medium text-gray-700">Filter & Reorder Category:</label>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm"
          >
            <option value="All">All Categories (Read-only Order)</option>
            <option value="Bangles">Bangles</option>
            <option value="Artificial Flowers">Artificial Flowers</option>
            <option value="Hair Accessories">Hair Accessories</option>
          </select>
          {categoryFilter !== 'All' && (
            <span className="text-xs text-gray-500 italic ml-2">Drag and drop to reorder products in this category.</span>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="products-list" isDropDisabled={categoryFilter === 'All'}>
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <Draggable key={product._id} draggableId={product._id} index={index} isDragDisabled={categoryFilter === 'All'}>
                      {(provided, snapshot) => (
                        <li 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${snapshot.isDragging ? 'bg-indigo-50 shadow-lg' : 'hover:bg-gray-50'} transition bg-white`}
                        >
                          <div className="px-4 py-4 flex items-center sm:px-6 justify-between group">
                            <div className="flex items-center">
                              {categoryFilter !== 'All' && (
                                <div {...provided.dragHandleProps} className="mr-4 text-gray-400 cursor-grab active:cursor-grabbing">
                                  ☷
                                </div>
                              )}
                              <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-md object-cover flex items-center justify-center overflow-hidden border border-gray-200">
                                {product.images?.[0] ? (
                                  <img src={product.images[0].url} alt="" className="h-full w-full object-cover"/>
                                ) : (
                                  <span className="text-xs text-gray-400">No Img</span>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {product.category} {product.subcategoryId && `• ${product.subcategoryId.name}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-6">
                              {product.isFlagship && (
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  ★ Flagship
                                </span>
                              )}
                              <div className="text-sm text-gray-900 font-medium">₹{product.price}</div>
                              <Link to={`/products/edit/${product._id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Edit</Link>
                              <button onClick={() => handleDelete(product._id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Delete</button>
                            </div>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {products.length === 0 && (
                    <li className="px-4 py-12 text-center text-gray-500">No products found. Start by adding one.</li>
                  )}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
};

export default Products;
