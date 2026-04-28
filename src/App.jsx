import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Registration from './pages/Registration';
import Duplicates from './pages/Duplicates';
import Catalogo from './pages/Catalogo';
import Ordenes from './pages/Ordenes';
import OrdenNueva from './pages/OrdenNueva';
import OrdenDetalle from './pages/OrdenDetalle';
import Scanner from './pages/Scanner';

const App = () => {
  return (
    <Router>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registro" element={<Registration />} />
          <Route path="/duplicados" element={<Duplicates />} />
          
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/ordenes" element={<Ordenes />} />
          <Route path="/ordenes/nueva" element={<OrdenNueva />} />
          <Route path="/ordenes/:id" element={<OrdenDetalle />} />
          <Route path="/scanner" element={<Scanner />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <footer style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
        Powered by Harmony
      </footer>
    </Router>
  );
};

export default App;
