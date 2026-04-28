import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png'; // Make sure to place the logo here

const Navbar = () => {
  const navItems = [
    { to: '/', label: 'INICIO' },
    { to: '/registro', label: 'AGREGAR / IMPORTAR' },
    { to: '/duplicados', label: 'DUPLICADOS' },
    { to: '/catalogo', label: 'CATÁLOGO' },
    { to: '/ordenes', label: 'ÓRDENES' },
    { to: '/scanner', label: 'SCANNER' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src={logo} alt="Ikarus Logo" className="navbar-logo-img" />
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
