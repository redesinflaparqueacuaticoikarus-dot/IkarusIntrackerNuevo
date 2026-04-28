import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CarritoBuilder from '../components/CarritoBuilder';
import { ordenesService } from '../services/ordenes';
import { emailService } from '../services/email';

const OrdenNueva = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form Data
  const [clienteData, setClienteData] = useState({
    tipo_orden: 'combo',
    cliente_nombre: '',
    cliente_cc: '',
    cliente_telefono: '',
    cliente_email: '',
    fecha_visita: new Date().toISOString().split('T')[0], // Today
    cantidad_personas: 1,
    observaciones: ''
  });

  const [cartState, setCartState] = useState({
    items: {},
    total: 0,
    proteinDetails: [],
    isValid: false,
    rawProducts: [],
    proteinaConfig: {}
  });

  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setClienteData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const explodeCartIntoItems = () => {
    const itemsToInsert = [];
    // Deep clone to track remaining proteins to assign
    const remProteins = JSON.parse(JSON.stringify(cartState.proteinaConfig));

    Object.entries(cartState.items).forEach(([productId, qty]) => {
      if (qty <= 0) return;
      const p = cartState.rawProducts.find(x => x.id === productId);
      if (!p) return;

      for (let i = 0; i < qty; i++) {
        if (p.tipo === 'consumible') {
          let proteinaAsignada = null;
          if (p.requiere_proteina) {
            if (remProteins[p.id]?.pollo > 0) {
              proteinaAsignada = 'pollo';
              remProteins[p.id].pollo--;
            } else if (remProteins[p.id]?.cerdo > 0) {
              proteinaAsignada = 'cerdo';
              remProteins[p.id].cerdo--;
            }
          }
          itemsToInsert.push({
            producto_id: p.id,
            producto_nombre: p.nombre,
            lugar_validacion: p.lugar_validacion,
            proteina: proteinaAsignada,
            estado: 'pending'
          });
        } else if (p.tipo === 'paquete') {
          p.componentes?.items?.forEach(comp => {
            const compProduct = cartState.rawProducts.find(x => x.id === comp.producto_id);
            if (!compProduct) return;
            
            for (let k = 0; k < comp.cantidad; k++) {
              let proteinaAsignada = null;
              if (compProduct.requiere_proteina) {
                if (remProteins[compProduct.id]?.pollo > 0) {
                  proteinaAsignada = 'pollo';
                  remProteins[compProduct.id].pollo--;
                } else if (remProteins[compProduct.id]?.cerdo > 0) {
                  proteinaAsignada = 'cerdo';
                  remProteins[compProduct.id].cerdo--;
                }
              }
              itemsToInsert.push({
                producto_id: compProduct.id,
                producto_nombre: compProduct.nombre,
                lugar_validacion: compProduct.lugar_validacion,
                proteina: proteinaAsignada,
                estado: 'pending'
              });
            }
          });
        }
      }
    });

    return itemsToInsert;
  };

  const buildItemsSummaryForEmail = (explodedItems) => {
    const summaryMap = {};
    explodedItems.forEach(item => {
      const key = `${item.producto_nombre}_${item.lugar_validacion}`;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          producto: item.producto_nombre,
          cantidad: 0,
          lugar: item.lugar_validacion,
          proteinas: { pollo: 0, cerdo: 0 }
        };
      }
      summaryMap[key].cantidad++;
      if (item.proteina) {
        summaryMap[key].proteinas[item.proteina]++;
      }
    });
    return Object.values(summaryMap);
  };

  const handleCreateOrder = async () => {
    setIsLoading(true);
    try {
      const explodedItems = explodeCartIntoItems();
      
      const headerData = {
        ...clienteData,
        total: cartState.total,
        estado: 'activa',
        creada_por: 'Operador Admin' // hardcoded for now, auth later
      };

      const newOrder = await ordenesService.createOrden(headerData, explodedItems);
      
      // Send Email
      const itemsResumen = buildItemsSummaryForEmail(explodedItems);
      const emailPayload = {
        tipo: 'orden_creada',
        orden: {
          codigo: newOrder.codigo,
          cliente_nombre: newOrder.cliente_nombre,
          cliente_email: newOrder.cliente_email,
          fecha_visita: newOrder.fecha_visita,
          cantidad_personas: newOrder.cantidad_personas,
          total: newOrder.total,
          items_resumen: itemsResumen
        },
        qr_url: `${window.location.origin}/scanner?code=${newOrder.codigo}`
      };

      const emailResult = await emailService.sendOrderEmail(emailPayload);
      if (emailResult.success && emailResult.message !== "Skipped (no webhook URL)") {
        await ordenesService.markEmailSent(newOrder.id);
      }

      navigate(`/ordenes/${newOrder.id}`);

    } catch (error) {
      console.error(error);
      alert("Error al crear la orden: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header className="page-header">
          <h1 className="page-title">Crear Nueva Orden</h1>
        </header>
      
      {/* STEPS INDICATOR */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ 
            padding: '8px 16px', 
            borderRadius: '20px', 
            background: step === s ? 'var(--color-brand-pink, #e91e63)' : '#eee',
            color: step === s ? 'white' : '#666',
            fontWeight: 'bold'
          }}>
            Paso {s}
          </div>
        ))}
      </div>

      <div className="admin-card p-6 form-section">
        {/* STEP 1: CLIENT DATA */}
        {step === 1 && (
          <>
            <h2 className="section-title">Datos del Cliente</h2>
            <form onSubmit={handleNextStep1} className="pt-4 grid-form">
              <div className="form-group span-full">
                <label>TIPO DE ORDEN</label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', color: 'var(--text-main)' }}>
                    <input type="radio" name="tipo_orden" value="combo" checked={clienteData.tipo_orden === 'combo'} onChange={handleClienteChange}/> COMBO
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', color: 'var(--text-main)' }}>
                    <input type="radio" name="tipo_orden" value="grupo" checked={clienteData.tipo_orden === 'grupo'} onChange={handleClienteChange}/> GRUPO
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>NOMBRE COMPLETO *</label>
                <input required name="cliente_nombre" value={clienteData.cliente_nombre} onChange={handleClienteChange} placeholder="Ej. Yensy Martinez" />
              </div>
              
              <div className="form-group">
                <label>CÉDULA (CC) *</label>
                <input required name="cliente_cc" value={clienteData.cliente_cc} onChange={handleClienteChange} placeholder="Ej. 1012345678" />
              </div>

              <div className="form-group">
                <label>EMAIL *</label>
                <input required type="email" name="cliente_email" value={clienteData.cliente_email} onChange={handleClienteChange} placeholder="Ej. correo@gmail.com" />
              </div>

              <div className="form-group">
                <label>TELÉFONO</label>
                <input name="cliente_telefono" value={clienteData.cliente_telefono} onChange={handleClienteChange} placeholder="Ej. 3138539653" />
              </div>

              <div className="form-group">
                <label>FECHA DE VISITA *</label>
                <input required type="date" name="fecha_visita" value={clienteData.fecha_visita} min={new Date().toISOString().split('T')[0]} onChange={handleClienteChange} />
              </div>

              <div className="form-group">
                <label>CANT. PERSONAS *</label>
                <input required type="number" min="1" name="cantidad_personas" value={clienteData.cantidad_personas} onChange={handleClienteChange} />
              </div>

              <div className="form-group span-full">
                <label>OBSERVACIONES</label>
                <textarea name="observaciones" value={clienteData.observaciones} onChange={handleClienteChange} rows="3" style={{ width: '100%', padding: '12px', border: '1px solid var(--surface-glass-border)', borderRadius: '8px' }} />
              </div>

              <div className="form-actions span-full mt-4 flex justify-end">
                <button type="submit" className="btn-primary w-full">Siguiente: Seleccionar Productos</button>
              </div>
            </form>
          </>
        )}

        {/* STEP 2: CART BUILDER */}
        {step === 2 && (
          <>
            <h2 className="section-title">Selección de Productos</h2>
            <div className="pt-4">
              <CarritoBuilder onCartChange={setCartState} />
              
              <div style={{ marginTop: '20px', padding: '20px', background: 'var(--surface-glass)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '1.2em' }}>
                  Total: <strong>${Number(cartState.total).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(1)} className="btn-secondary">Atrás</button>
                  <button 
                    onClick={() => setStep(3)} 
                    disabled={!cartState.isValid}
                    className="btn-primary"
                    style={{ opacity: cartState.isValid ? 1 : 0.5, cursor: cartState.isValid ? 'pointer' : 'not-allowed' }}
                  >
                    Revisar y Confirmar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* STEP 3: CONFIRM */}
        {step === 3 && (
          <>
            <h2 className="section-title">Resumen de la Orden</h2>
            <div className="pt-4">
              <div style={{ padding: '20px', border: '1px solid var(--surface-glass-border)', borderRadius: '8px', marginBottom: '20px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <div><strong>Cliente:</strong> {clienteData.cliente_nombre}</div>
                  <div><strong>CC:</strong> {clienteData.cliente_cc}</div>
                  <div><strong>Email:</strong> {clienteData.cliente_email}</div>
                  <div><strong>Fecha Visita:</strong> {clienteData.fecha_visita} ({clienteData.cantidad_personas} pax)</div>
                </div>

                <h4 style={{ marginBottom: '10px', color: 'var(--color-brand-teal)' }}>Productos:</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {Object.entries(cartState.items).map(([id, qty]) => {
                    if (qty === 0) return null;
                    const p = cartState.rawProducts.find(x => x.id === id);
                    return (
                      <li key={id} style={{ padding: '8px 0', borderBottom: '1px solid var(--surface-glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{qty}x {p?.nombre}</span>
                        <span>${(qty * Number(p?.precio)).toLocaleString()}</span>
                      </li>
                    );
                  })}
                </ul>
                
                <div style={{ textAlign: 'right', fontSize: '1.3em', marginTop: '15px' }}>
                  Total a Pagar: <strong>${Number(cartState.total).toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setStep(2)} disabled={isLoading} className="btn-secondary">Atrás</button>
                <button onClick={handleCreateOrder} disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Creando orden y enviando email...' : 'Crear Orden y Enviar QR'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default OrdenNueva;
