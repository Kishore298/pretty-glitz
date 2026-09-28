import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = () => {
    if (product.category === 'Bangles' && !selectedSize) {
      setError('Please select a size to continue');
      return;
    }
    setError('');
    
    addToCart(product, selectedSize, quantity);
    
    // Show visual feedback
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* Image Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnails (Left on desktop, bottom on mobile) */}
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0">
              {product.images?.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`flex-shrink-0 w-20 h-24 bg-gray-100 rounded-sm overflow-hidden border-2 transition ${activeImage === idx ? 'border-gray-900' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 aspect-[4/5] bg-gray-50 rounded-sm overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={product.images?.[activeImage]?.url} 
                  alt={product.name} 
                  className="w-full h-full object-cover" 
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Product Info */}
          <div className="w-full lg:w-1/2 pt-4 md:pt-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">{product.subcategoryId?.name || product.category}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="flex items-end space-x-4 mb-10">
                <span className="text-2xl font-semibold text-gray-900">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-lg text-gray-400 line-through mb-0.5">₹{product.originalPrice}</span>
                )}
              </div>

              {/* Bangle Size Selector */}
              {product.category === 'Bangles' && product.sizes?.length > 0 && (
                <div className="mb-10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-semibold tracking-wider text-gray-900 uppercase">Size</span>
                    <a href="#" className="text-xs text-gray-500 underline">Size Guide</a>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedSize(s.size); setError(''); }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-medium border transition-all duration-300 ${
                          selectedSize === s.size 
                            ? 'border-transparent bg-prettyglitz text-white shadow-lg' 
                            : 'border-gray-300 text-gray-700 hover:border-gray-900'
                        }`}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm mt-3 font-medium">{error}</motion.p>}
                </div>
              )}

              {/* Quantity & Add to Cart Row */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <div className="flex items-center border border-gray-300 rounded-sm w-32 h-14">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 h-full text-gray-600 hover:bg-gray-100 transition">-</button>
                  <span className="flex-1 text-center text-sm font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="flex-1 h-full text-gray-600 hover:bg-gray-100 transition">+</button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 h-14 bg-gray-900 text-white rounded-sm uppercase tracking-widest text-sm font-bold hover:bg-black transition shadow-xl shadow-gray-200"
                >
                  {addedFeedback ? 'Added!' : 'Add to Cart'}
                </button>
              </div>

              {/* Description */}
              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-4">Product Details</h3>
                <p className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
