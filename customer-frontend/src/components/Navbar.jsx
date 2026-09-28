import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, User, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import api from '../utils/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { getCartCount } = useContext(CartContext);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        const formattedLinks = data.map(c => ({
          name: c.name,
          path: `/category/${c.name}`
        }));
        setLinks(formattedLinks);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if(searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setIsOpen(false);
    }
  }

  return (
    <>
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold tracking-widest text-gray-900">
                PRETTY<span className="text-transparent bg-clip-text bg-prettyglitz">GLITZ</span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {links.map(link => (
                <Link key={link.name} to={link.path} className="text-sm font-medium text-gray-700 hover:text-black transition">
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-5">
              <form onSubmit={handleSearch} className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-1.5 focus-within:ring-1 focus-within:ring-gray-300 transition">
                <Search size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm ml-2 w-32"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              
              <Link to="/account" className="text-gray-700 hover:text-black transition">
                <User size={22} />
              </Link>
              <Link to="/cart" className="text-gray-700 hover:text-black relative transition">
                <ShoppingBag size={22} />
                {getCartCount() > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-2 bg-prettyglitz text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center shadow-md"
                  >
                    {getCartCount()}
                  </motion.span>
                )}
              </Link>
              
              {/* Mobile menu button */}
              <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-700 transition">
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden"
          >
            <form onSubmit={handleSearch} className="flex items-center bg-gray-100 rounded-full px-4 py-3 mb-8">
              <Search size={20} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-base ml-3 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="flex flex-col space-y-6">
              <Link to="/" onClick={() => setIsOpen(false)} className="text-2xl font-semibold text-gray-900">Home</Link>
              {links.map(link => (
                <Link key={link.name} to={link.path} onClick={() => setIsOpen(false)} className="text-2xl font-semibold text-gray-900">
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
