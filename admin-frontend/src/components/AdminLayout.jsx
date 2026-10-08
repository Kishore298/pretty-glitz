import React, { useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import Sidebar from './Sidebar';

const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--panel-bg)' }}>
      {/* Mobile Header */}
      <div className="admin-mobile-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '16px 24px', background: 'var(--sidebar-bg)', 
        borderBottom: '1px solid var(--card-border)',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={16} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            PrettyGlitz
          </span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 4 }}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
        
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="admin-mobile-overlay"
            onClick={() => setIsMobileMenuOpen(false)} 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90, backdropFilter: 'blur(2px)' }} 
          />
        )}

        <div className="admin-content-area" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '40px' }}>
          <div style={{ maxWidth: 1400, width: '100%', margin: '0 auto', flex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
