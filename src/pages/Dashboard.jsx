import React, { useEffect, useState, useMemo } from 'react';
import { getAllRecords } from '../services/db';
import { format, isToday } from 'date-fns';
import { Users, Calendar, Award, Search } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    allRecords: []
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const records = await getAllRecords();
    
    let todayCount = 0;
    records.forEach(r => {
      // Check if createdAt is today, tracking actual registration moment
      // We fall back to FECHA if no createdAt but it's new system so it will have it.
      const dateStr = r.createdAt || r.FECHA;
      if (dateStr && new Date(dateStr).toDateString() === new Date().toDateString()) {
        todayCount++;
      }
    });

    // Sort by newest
    const sorted = [...records].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    setStats({
      total: records.length,
      today: todayCount,
      allRecords: sorted
    });
  };

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return stats.allRecords.slice(0, 10);
    const lower = searchTerm.toLowerCase();
    return stats.allRecords.filter(r => 
      (r.NOMBRE && String(r.NOMBRE).toLowerCase().includes(lower)) ||
      (r.CC && String(r.CC).includes(lower)) ||
      (r.USUARIO && String(r.USUARIO).toLowerCase().includes(lower))
    );
  }, [stats.allRecords, searchTerm]);

  return (
    <div className="page-container dashboard">
      <header className="page-header">
        <h1 className="page-title">Bienvenido</h1>
        <p className="page-subtitle">Sistema de Control de Bonos 2x1 - Ikarus</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card admin-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-brand-teal)' }}>
            <Calendar color="white" />
          </div>
          <div className="stat-info">
            <h3>Hoy Registrados</h3>
            <p className="stat-value">{stats.today}</p>
          </div>
        </div>

        <div className="stat-card admin-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-brand-light-blue)' }}>
            <Users color="white" />
          </div>
          <div className="stat-info">
            <h3>Total Histórico</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        
        <div className="stat-card admin-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-brand-pink)' }}>
            <Award color="white" />
          </div>
          <div className="stat-info">
            <h3>Últimos Canjes</h3>
            <p className="stat-value">{stats.allRecords.length ? 'Activo' : 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 admin-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
          <h2 className="text-xl text-blue m-0">{searchTerm ? 'Resultados de Búsqueda' : 'Últimas 10 Entradas'}</h2>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por Nombre, CC o Usuario..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px', width: '100%' }}
            />
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <p className="text-muted">No hay registros que coincidan con la búsqueda.</p>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>CC (Cédula)</th>
                  <th>Usuario Instagram</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, i) => (
                  <tr key={record.id || i}>
                    <td>{record.FECHA}</td>
                    <td>{record.NOMBRE}</td>
                    <td>{record.CC}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-brand-pink)' }}>
                      @{record.USUARIO?.replace('@', '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
