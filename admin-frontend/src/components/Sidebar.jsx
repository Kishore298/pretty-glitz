import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useContext(AuthContext);

  const activeStyle = "block py-2.5 px-4 rounded transition duration-200 bg-gray-100 text-gray-900 font-medium";
  const inactiveStyle = "block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-50 text-gray-600 mt-2";

  return (
    <div className="w-64 bg-white shadow-md min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold tracking-widest text-gray-900">PRETTYGLITZ</h1>
        <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Admin Panel</p>
      </div>
      <nav className="mt-6 px-4 flex-1 space-y-1">
        <NavLink to="/dashboard" className={({isActive}) => isActive ? activeStyle : inactiveStyle}>
          Dashboard
        </NavLink>
        <NavLink to="/products" className={({isActive}) => isActive ? activeStyle : inactiveStyle}>
          Products
        </NavLink>
        <NavLink to="/subcategories" className={({isActive}) => isActive ? activeStyle : inactiveStyle}>
          Subcategories
        </NavLink>
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={logout}
          className="w-full text-left block py-2.5 px-4 rounded transition duration-200 hover:bg-red-50 text-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
