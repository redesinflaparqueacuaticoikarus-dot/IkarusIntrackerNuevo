import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navItems = [
    { to: '/', label: 'INICIO' },
    { to: '/registro', label: 'AGREGAR / IMPORTAR' },
    { to: '/duplicados', label: 'DUPLICADOS' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          {/* We mimic the logo text since we don't have the exact image asset */}
          <span className="logo-ikarus">Ikarus</span>
          <span className="logo-sub">INFLAPARQUE ACUÁTICO</span>
        </div>

        <nav className="navbar-links">
          {navItems.map((item) => (
            <NavLink 
              key={item.to}
              to={item.to} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-actions">
          {/* Simulating the COMPRAR button from the image but we keep it administrative or just an admin indicator */}
          <div className="admin-badge">Admin Panel</div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
