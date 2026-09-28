import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-bold tracking-widest text-gray-900 mb-4">PRETTYGLITZ</h3>
          <p className="text-gray-500 text-sm">Beauty in Every Detail. Premium accessories for your special moments.</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Shop</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/category/Bangles" className="hover:text-black transition">Bangles</Link></li>
            <li><Link to="/category/Artificial Flowers" className="hover:text-black transition">Artificial Flowers</Link></li>
            <li><Link to="/category/Hair Accessories" className="hover:text-black transition">Hair Accessories</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Help</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/account" className="hover:text-black transition">My Account</Link></li>
            <li><Link to="/cart" className="hover:text-black transition">Cart</Link></li>
            <li><a href="#" className="hover:text-black transition">Contact Us</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Follow Us</h4>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><a href="#" className="hover:text-black transition">Instagram</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} PrettyGlitz. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
