import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [activeSub, setActiveSub] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [categoryName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, subRes] = await Promise.all([
        api.get(`/products?category=${encodeURIComponent(categoryName)}`),
        api.get(`/subcategories?category=${encodeURIComponent(categoryName)}`)
      ]);
      setProducts(prodRes.data);
      setSubcategories(subRes.data);
      setActiveSub('All');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const filteredProducts = activeSub === 'All' 
    ? products 
    : products.filter(p => p.subcategoryId?._id === activeSub);

  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      {/* Category Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 uppercase tracking-widest"
        >
          {categoryName}
        </motion.h1>
      </div>

      {/* Subcategory Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 border-b border-gray-100">
        <div className="flex space-x-10 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center">
          <button 
            onClick={() => setActiveSub('All')}
            className={`whitespace-nowrap text-sm tracking-wider uppercase transition-colors ${activeSub === 'All' ? 'text-gray-900 font-bold border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-900 font-medium'}`}
          >
            All
          </button>
          {subcategories.map(sub => (
            <button 
              key={sub._id}
              onClick={() => setActiveSub(sub._id)}
              className={`whitespace-nowrap text-sm tracking-wider uppercase transition-colors ${activeSub === sub._id ? 'text-gray-900 font-bold border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-900 font-medium'}`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-gray-400 text-lg">
            No products found in this collection.
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-12"
          >
            {filteredProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
