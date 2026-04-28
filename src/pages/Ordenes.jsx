import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordenesService } from '../services/ordenes';

const Ordenes = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const data = await ordenesService.getOrdenes();
      setOrdenes(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const estadoColors = {
    activa: 'green',
    usada_parcial: 'orange',
    usada_total: 'gray',
    cancelada: 'red'
  };

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Órdenes Manuales</h1>
        </div>
        <Link to="/ordenes/nueva" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
          + Crear Orden
        </Link>
      </header>

      <div className="admin-card p-6">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando órdenes...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--color-brand-teal)' }}>
              <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Código</th>
              <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Cliente</th>
              <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Fecha Visita</th>
              <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Pax</th>
              <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Total</th>
              <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Estado</th>
              <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map(o => (
              <tr key={o.id} style={{ transition: 'background 0.2s', ':hover': { background: 'rgba(0,0,0,0.02)' } }}>
                <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)', fontWeight: 'bold', color: 'var(--color-brand-blue)' }}>{o.codigo}</td>
                <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)' }}>
                  <div style={{ fontWeight: '500' }}>{o.cliente_nombre}</div>
                  <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>{o.cliente_email}</div>
                </td>
                <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)' }}>{o.fecha_visita}</td>
                <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)' }}>{o.cantidad_personas}</td>
                <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)', fontWeight: '500' }}>${Number(o.total).toLocaleString()}</td>
                <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '0.80em', 
                    fontWeight: 'bold',
                    background: estadoColors[o.estado] || '#ccc',
                    color: 'white',
                    textTransform: 'uppercase'
                  }}>
                    {o.estado.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)' }}>
                  <Link to={`/ordenes/${o.id}`} style={{ color: 'var(--color-brand-blue)', textDecoration: 'none', fontWeight: 'bold' }}>Ver Detalle</Link>
                </td>
              </tr>
            ))}
            {ordenes.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No hay órdenes registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
};

export default Ordenes;
