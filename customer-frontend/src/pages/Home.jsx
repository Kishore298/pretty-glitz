import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [flagship, setFlagship] = useState([]);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    fetchFlagship();
    fetchCategories();
  }, []);

  const fetchFlagship = async () => {
    try {
      const { data } = await api.get('/products?isFlagship=true');
      setFlagship(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      // Map generic images/colors for dynamic categories
      const bgs = ['bg-pink-50', 'bg-purple-50', 'bg-yellow-50', 'bg-blue-50', 'bg-green-50'];
      const descs = ['Exquisite traditional and modern designs.', 'Everlasting floral beauty for hair and decor.', 'Premium styling pieces for every occasion.', 'Shop the latest trends.', 'Discover beautiful accessories.'];
      
      const formatted = data.map((c, i) => ({
        name: c.name,
        desc: c.description || descs[i % descs.length],
        img: bgs[i % bgs.length]
      }));
      setCollections(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-white -z-10"></div>
        {/* Subtle background gradient blob */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-prettyglitz rounded-full blur-[120px] opacity-10 pointer-events-none"
        ></motion.div>
        
        <div className="text-center px-4 max-w-4xl mx-auto z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6"
          >
            Beauty in Every Detail
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto"
          >
            Discover beautiful bangles, artificial flowers and stylish hair accessories crafted for your most precious moments.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to={collections.length > 0 ? `/category/${collections[0].name}` : "/"} className="inline-block bg-gray-900 text-white px-10 py-4 text-sm font-medium tracking-widest uppercase hover:bg-black transition rounded-sm shadow-xl shadow-gray-200">
              Explore Collection
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 3 Business Collections */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
          {collections.map((col, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.2, duration: 0.8 }}
              key={col.name} 
              className="text-center group"
            >
              <Link to={`/category/${col.name}`} className="block">
                <div className={`mx-auto w-64 h-64 rounded-full border-[3px] border-transparent bg-clip-padding relative p-1`}>
                  {/* Outer gradient ring mimicking instagram story */}
                  <div className="absolute inset-0 rounded-full bg-prettyglitz -z-10 group-hover:rotate-180 transition duration-1000 ease-in-out"></div>
                  <div className={`w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative`}>
                    <div className={`absolute inset-0 ${col.img} opacity-50`}></div>
                    <span className="text-gray-400 font-medium relative z-10">{col.name}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-2 group-hover:text-pink-600 transition">{col.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{col.desc}</p>
                <span className="inline-block text-xs font-bold uppercase tracking-widest border-b border-gray-900 pb-1 group-hover:border-pink-600 transition">
                  Explore
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Flagship Carousel */}
      {flagship.length > 0 && (
        <section className="py-24 bg-gray-50 overflow-hidden border-t border-gray-100">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-widest text-gray-900 uppercase">Flagship Collection</h2>
            <div className="w-16 h-1 bg-prettyglitz mx-auto mt-6 rounded-full"></div>
          </div>
          
          <div className="relative w-full overflow-hidden flex">
            {/* Infinite scroll track */}
            <div className="flex space-x-8 px-4 scrolling-carousel w-max hover:cursor-grab active:cursor-grabbing">
              {/* Duplicate array to create seamless loop */}
              {[...flagship, ...flagship, ...flagship, ...flagship].map((product, idx) => (
                <div key={idx} className="w-[280px] flex-shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
