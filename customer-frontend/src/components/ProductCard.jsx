import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ProductCard = ({ product }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer block"
    >
      <Link to={`/product/${product._id}`}>
        <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden rounded-sm mb-4">
          {product.images && product.images[0] ? (
            <img 
              src={product.images[0].url} 
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-gray-100">No Image</div>
          )}
          {product.isFlagship && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 tracking-widest uppercase text-gray-900">
              Flagship
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm text-gray-900 font-medium truncate group-hover:text-pink-600 transition">{product.name}</h3>
          <p className="text-xs text-gray-500 mt-1 truncate">{product.subcategoryId?.name}</p>
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-900">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
