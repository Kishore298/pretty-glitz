import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const AddEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'Bangles',
    subcategoryId: '',
    isFlagship: false,
    isActive: true,
    sizes: [],
    images: []
  });

  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    fetchSubcategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchSubcategories = async () => {
    const { data } = await api.get('/subcategories');
    setSubcategories(data);
  };

  const fetchProduct = async () => {
    const { data } = await api.get(`/products/${id}`);
    setFormData({
      ...data,
      subcategoryId: data.subcategoryId?._id || ''
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', order: prev.sizes.length }]
    }));
  };

  const handleSizeChange = (index, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index].size = value;
    setFormData({ ...formData, sizes: newSizes });
  };

  const handleRemoveSize = (index) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData({ ...formData, sizes: newSizes });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/products/${id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      navigate('/products');
    } catch (err) {
      console.error(err);
      alert('Error saving product');
    }
  };

  const filteredSubcategories = subcategories.filter(s => s.category === formData.category);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-10 overflow-y-auto h-screen">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
        
        <form onSubmit={handleSubmit} className="bg-white shadow p-8 sm:rounded-md border border-gray-200 max-w-4xl space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-gray-900 focus:border-gray-900 sm:text-sm" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" required rows="4" value={formData.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-gray-900 focus:border-gray-900 sm:text-sm"></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
              <input type="number" name="price" required value={formData.price} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-gray-900 focus:border-gray-900 sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Original Price (₹) <span className="text-gray-400 font-normal">(Optional)</span></label>
              <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-gray-900 focus:border-gray-900 sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Main Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-gray-900 focus:border-gray-900 sm:text-sm">
                <option value="Bangles">Bangles</option>
                <option value="Artificial Flowers">Artificial Flowers</option>
                <option value="Hair Accessories">Hair Accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Subcategory</label>
              <select name="subcategoryId" value={formData.subcategoryId} onChange={handleChange} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-gray-900 focus:border-gray-900 sm:text-sm">
                <option value="">Select Subcategory</option>
                {filteredSubcategories.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            
            <div className="col-span-2 flex items-center space-x-8 pt-4">
              <div className="flex items-center">
                <input id="isFlagship" name="isFlagship" type="checkbox" checked={formData.isFlagship} onChange={handleChange} className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded" />
                <label htmlFor="isFlagship" className="ml-2 block text-sm text-gray-900 font-medium">★ Mark as Flagship Product</label>
              </div>
              <div className="flex items-center">
                <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded" />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 font-medium">Active (Visible on store)</label>
              </div>
            </div>
          </div>

          {/* Dynamic Bangle Sizes Section */}
          {formData.category === 'Bangles' && (
            <div className="col-span-2 border-t border-gray-200 pt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Available Sizes</h3>
                <button type="button" onClick={handleAddSize} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium border border-indigo-600 rounded px-3 py-1 bg-indigo-50 hover:bg-indigo-100 transition">
                  + Add Size
                </button>
              </div>
              
              {formData.sizes.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No sizes added. Customers won't be able to buy this unless sizes are specified.</p>
              ) : (
                <div className="space-y-3">
                  {formData.sizes.map((sizeObj, idx) => (
                    <div key={idx} className="flex items-center space-x-3 bg-gray-50 p-3 rounded border border-gray-100">
                      <span className="text-gray-400 font-medium w-6">{idx + 1}.</span>
                      <input type="text" value={sizeObj.size} onChange={(e) => handleSizeChange(idx, e.target.value)} placeholder="e.g. 2.4" required className="block w-32 border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:ring-gray-900 focus:border-gray-900 sm:text-sm" />
                      <button type="button" onClick={() => handleRemoveSize(idx)} className="text-red-600 hover:text-red-800 text-sm font-medium ml-4">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="col-span-2 border-t border-gray-200 pt-6 flex justify-end space-x-4">
            <button type="button" onClick={() => navigate('/products')} className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-6 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">Cancel</button>
            <button type="submit" className="bg-gray-900 border border-transparent rounded-md shadow-sm py-2 px-8 inline-flex justify-center text-sm font-medium text-white hover:bg-black focus:outline-none">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditProduct;
