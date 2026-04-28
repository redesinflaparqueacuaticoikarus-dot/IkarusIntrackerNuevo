import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordenesService } from '../services/ordenes';
import QRCodeView from '../components/QRCodeView';
import { emailService } from '../services/email';

const OrdenDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChangingDate, setIsChangingDate] = useState(false);
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    fetchOrden();
  }, [id]);

  const fetchOrden = async () => {
    try {
      setLoading(true);
      const data = await ordenesService.getOrdenCompleta({ id });
      setOrden(data);
    } catch (error) {
      console.error(error);
      alert("Error al cargar la orden");
      navigate('/ordenes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (confirm('¿Seguro que deseas cancelar esta orden? Esta acción no se puede deshacer.')) {
      try {
        await ordenesService.cancelarOrden(id);
        fetchOrden();
      } catch (error) {
        alert("Error al cancelar: " + error.message);
      }
    }
  };

  const handleChangeDate = async (e) => {
    e.preventDefault();
    try {
      await ordenesService.updateFechaVisita(id, newDate);
      setIsChangingDate(false);
      fetchOrden();
    } catch (error) {
      alert("Error al cambiar fecha: " + error.message);
    }
  };

  const handleReenviarEmail = async () => {
    try {
      const itemsResumen = {};
      orden.orden_items.forEach(item => {
        const key = `${item.producto_nombre}_${item.lugar_validacion}`;
        if (!itemsResumen[key]) {
          itemsResumen[key] = {
            producto: item.producto_nombre,
            cantidad: 0,
            lugar: item.lugar_validacion,
            proteinas: { pollo: 0, cerdo: 0 }
          };
        }
        itemsResumen[key].cantidad++;
        if (item.proteina) itemsResumen[key].proteinas[item.proteina]++;
      });

      const emailPayload = {
        tipo: 'orden_creada',
        orden: {
          codigo: orden.codigo,
          cliente_nombre: orden.cliente_nombre,
          cliente_email: orden.cliente_email,
          fecha_visita: orden.fecha_visita,
          cantidad_personas: orden.cantidad_personas,
          total: orden.total,
          items_resumen: Object.values(itemsResumen)
        },
        qr_url: `${window.location.origin}/scanner?code=${orden.codigo}`
      };

      const result = await emailService.sendOrderEmail(emailPayload);
      if (result.success && result.message !== "Skipped (no webhook URL)") {
        await ordenesService.markEmailSent(orden.id);
        alert("Email reenviado correctamente");
      } else {
        alert("Resultado: " + (result.message || "Email reenviado"));
      }
    } catch (error) {
      alert("Error reenviando email: " + error.message);
    }
  };

  if (loading || !orden) return <div style={{ padding: '20px' }}>Cargando orden...</div>;

  const estadoColors = {
    activa: '#28a745',
    usada_parcial: '#fd7e14',
    usada_total: '#6c757d',
    cancelada: '#dc3545'
  };

  // Group items by lugar_validacion
  const groupedItems = orden.orden_items.reduce((acc, item) => {
    const lugar = item.lugar_validacion || 'desconocido';
    if (!acc[lugar]) acc[lugar] = [];
    acc[lugar].push(item);
    return acc;
  }, {});

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>
      
      {/* LEFT COLUMN: Data and items */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Orden: {orden.codigo}</h2>
          <span style={{ 
            padding: '6px 12px', 
            borderRadius: '20px', 
            fontWeight: 'bold',
            background: estadoColors[orden.estado] || '#ccc',
            color: 'white',
            textTransform: 'uppercase'
          }}>
            {orden.estado.replace('_', ' ')}
          </span>
        </div>

        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #eee', marginBottom: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div><strong>Cliente:</strong> {orden.cliente_nombre}</div>
            <div><strong>CC:</strong> {orden.cliente_cc}</div>
            <div><strong>Email:</strong> {orden.cliente_email}</div>
            <div><strong>Teléfono:</strong> {orden.cliente_telefono || '-'}</div>
            <div><strong>Personas:</strong> {orden.cantidad_personas}</div>
            <div><strong>Total:</strong> ${Number(orden.total).toLocaleString()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong>Fecha Visita:</strong> {orden.fecha_visita}
              {orden.estado !== 'cancelada' && orden.estado !== 'usada_total' && (
                <button onClick={() => setIsChangingDate(true)} style={smallBtn}>Cambiar</button>
              )}
            </div>
            <div><strong>Email Enviado:</strong> {orden.email_enviado ? 'Sí' : 'No'}</div>
          </div>
          {orden.observaciones && (
            <div style={{ marginTop: '15px' }}><strong>Observaciones:</strong> <br/>{orden.observaciones}</div>
          )}
        </div>

        {isChangingDate && (
          <form onSubmit={handleChangeDate} style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba' }}>
            <h4>Cambiar Fecha de Visita</h4>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="date" required value={newDate} min={new Date().toISOString().split('T')[0]} onChange={e => setNewDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              <button type="submit" style={primaryBtn}>Guardar</button>
              <button type="button" onClick={() => setIsChangingDate(false)} style={secondaryBtn}>Cancelar</button>
            </div>
          </form>
        )}

        <h3>Ítems de la Orden</h3>
        {Object.entries(groupedItems).map(([lugar, items]) => (
          <div key={lugar} style={{ marginBottom: '20px' }}>
            <h4 style={{ background: '#e9ecef', padding: '10px', borderRadius: '4px 4px 0 0', margin: 0, textTransform: 'capitalize' }}>
              Lugar: {lugar}
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Producto</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Proteína</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Estado</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Uso</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6', opacity: item.estado === 'used' ? 0.6 : 1 }}>
                    <td style={{ padding: '8px' }}>{item.producto_nombre}</td>
                    <td style={{ padding: '8px', textTransform: 'capitalize' }}>{item.proteina || '-'}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ color: item.estado === 'used' ? 'gray' : 'green', fontWeight: 'bold' }}>
                        {item.estado === 'used' ? 'Usado' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '8px', fontSize: '0.8em', color: '#666' }}>
                      {item.usado_at ? new Date(item.usado_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* RIGHT COLUMN: QR and Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0 }}>Código QR</h3>
          <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '20px' }}>Escanea este código para validar la entrada o el consumo.</p>
          <div style={{ display: 'inline-block', padding: '10px', background: 'white', border: '1px solid #eee', borderRadius: '8px' }}>
            <QRCodeView data={orden.codigo} size={220} />
          </div>
          <div style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '1.2em', letterSpacing: '2px' }}>
            {orden.codigo}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleReenviarEmail} style={actionBtn}>
            ✉️ Reenviar Email
          </button>
          {orden.estado !== 'cancelada' && (
            <button onClick={handleCancelar} style={{ ...actionBtn, color: 'red', borderColor: 'red' }}>
              ❌ Cancelar Orden
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

const actionBtn = {
  padding: '12px',
  background: 'white',
  border: '1px solid #ccc',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1em',
  textAlign: 'left'
};

const primaryBtn = { padding: '8px 16px', background: 'var(--primary-color, #007bff)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const secondaryBtn = { padding: '8px 16px', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const smallBtn = { padding: '4px 8px', background: '#e9ecef', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' };

export default OrdenDetalle;
