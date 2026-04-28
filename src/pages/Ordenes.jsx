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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Órdenes Manuales</h2>
        <Link to="/ordenes/nueva" style={{ padding: '10px 20px', background: 'var(--primary-color, #007bff)', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
          + Crear Orden
        </Link>
      </div>

      {loading ? (
        <p>Cargando órdenes...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
              <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Código</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Cliente</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Fecha Visita</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Pax</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Total</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Estado</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map(o => (
              <tr key={o.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>{o.codigo}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  {o.cliente_nombre}<br/>
                  <small style={{ color: '#666' }}>{o.cliente_email}</small>
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{o.fecha_visita}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{o.cantidad_personas}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>${Number(o.total).toLocaleString()}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.85em', 
                    background: estadoColors[o.estado] || '#ccc',
                    color: 'white',
                    textTransform: 'uppercase'
                  }}>
                    {o.estado.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  <Link to={`/ordenes/${o.id}`} style={{ color: 'var(--primary-color, #007bff)', textDecoration: 'none', fontWeight: 'bold' }}>Ver Detalle</Link>
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
  );
};

export default Ordenes;
