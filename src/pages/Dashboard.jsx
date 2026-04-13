import React, { useEffect, useState } from 'react';
import { getAllRecords } from '../services/db';
import { format, isToday } from 'date-fns';
import { Users, Calendar, Award } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    recent: []
  });

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
      recent: sorted.slice(0, 5)
    });
  };

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
            <p className="stat-value">{stats.recent.length ? 'Activo' : 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 admin-card p-6">
        <h2 className="mb-4 text-xl text-blue">Últimas 5 Entradas</h2>
        {stats.recent.length === 0 ? (
          <p className="text-muted">No hay registros aún.</p>
        ) : (
          <div className="table-container">
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
                {stats.recent.map((record, i) => (
                  <tr key={record.id || i}>
                    <td>{record.FECHA}</td>
                    <td>{record.NOMBRE}</td>
                    <td>{record.CC}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-ike-magenta)' }}>
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
