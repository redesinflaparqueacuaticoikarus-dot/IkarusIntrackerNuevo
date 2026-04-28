import React, { useState, useEffect } from 'react';
import { productosService } from '../services/productos';

const CarritoBuilder = ({ onCartChange }) => {
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [cartItems, setCartItems] = useState({}); // { producto_id: qty }
  const [proteinaConfig, setProteinaConfig] = useState({}); // { consumible_id: { pollo: 0, cerdo: 0 } }

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const todos = await productosService.getTodos(false);
        setProductosDisponibles(todos);
      } catch (err) {
        console.error("Error fetching products", err);
      }
    };
    fetchProductos();
  }, []);

  // Recalculate everything when cart or protein config changes
  useEffect(() => {
    // 1. Calculate total price and quantity of each product type
    let total = 0;
    const requiredProteins = {}; // { consumible_id: required_qty }

    Object.entries(cartItems).forEach(([productId, qty]) => {
      if (qty === 0) return;
      
      const p = productosDisponibles.find(x => x.id === productId);
      if (!p) return;

      total += Number(p.precio) * qty;

      if (p.tipo === 'consumible' && p.requiere_proteina) {
        requiredProteins[p.id] = (requiredProteins[p.id] || 0) + qty;
      } else if (p.tipo === 'paquete') {
        // Explode components
        p.componentes?.items?.forEach(comp => {
          const c = productosDisponibles.find(x => x.id === comp.producto_id);
          if (c && c.requiere_proteina) {
             requiredProteins[c.id] = (requiredProteins[c.id] || 0) + (comp.cantidad * qty);
          }
        });
      }
    });

    // 2. Validate protein splits
    let isValid = true;
    const proteinDetails = [];
    Object.entries(requiredProteins).forEach(([cId, reqQty]) => {
      const config = proteinaConfig[cId] || { pollo: 0, cerdo: 0 };
      const currentSum = (config.pollo || 0) + (config.cerdo || 0);
      
      const c = productosDisponibles.find(x => x.id === cId);
      proteinDetails.push({
        id: cId,
        nombre: c?.nombre,
        required: reqQty,
        assigned: currentSum,
        pollo: config.pollo || 0,
        cerdo: config.cerdo || 0
      });

      if (currentSum !== reqQty) {
        isValid = false;
      }
    });

    // 3. Output to parent
    onCartChange({
      items: cartItems,
      total,
      proteinDetails,
      isValid: isValid && Object.values(cartItems).some(q => q > 0),
      rawProducts: productosDisponibles,
      proteinaConfig
    });

  }, [cartItems, proteinaConfig, productosDisponibles, onCartChange]);

  const updateCart = (id, delta) => {
    setCartItems(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const updateProteina = (cId, type, delta) => {
    setProteinaConfig(prev => {
      const currentConfig = prev[cId] || { pollo: 0, cerdo: 0 };
      const nextVal = Math.max(0, currentConfig[type] + delta);
      return {
        ...prev,
        [cId]: { ...currentConfig, [type]: nextVal }
      };
    });
  };

  const paquetes = productosDisponibles.filter(p => p.tipo === 'paquete');
  const consumibles = productosDisponibles.filter(p => p.tipo === 'consumible');

  // Need protein requirements calculation for UI
  const requiredProteins = {}; 
  Object.entries(cartItems).forEach(([productId, qty]) => {
    if (qty === 0) return;
    const p = productosDisponibles.find(x => x.id === productId);
    if (!p) return;
    if (p.tipo === 'consumible' && p.requiere_proteina) {
      requiredProteins[p.id] = (requiredProteins[p.id] || 0) + qty;
    } else if (p.tipo === 'paquete') {
      p.componentes?.items?.forEach(comp => {
        const c = productosDisponibles.find(x => x.id === comp.producto_id);
        if (c && c.requiere_proteina) {
           requiredProteins[c.id] = (requiredProteins[c.id] || 0) + (comp.cantidad * qty);
        }
      });
    }
  });

  const renderProductList = (title, products) => (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ marginBottom: '10px', color: '#444' }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {products.map(p => {
          const qty = cartItems[p.id] || 0;
          return (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #eee' }}>
              <div>
                <strong>{p.nombre}</strong> <span style={{ color: '#888' }}>${Number(p.precio).toLocaleString()}</span>
                <div style={{ fontSize: '0.8em', color: '#666' }}>{p.descripcion}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={() => updateCart(p.id, -1)} style={btnQty}>-</button>
                <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{qty}</span>
                <button type="button" onClick={() => updateCart(p.id, 1)} style={btnQty}>+</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {renderProductList('Paquetes', paquetes)}
      {renderProductList('Consumibles Individuales', consumibles)}

      {Object.keys(requiredProteins).length > 0 && (
        <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeeba' }}>
          <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>Selección de Proteínas Requerida</h4>
          {Object.entries(requiredProteins).map(([cId, reqQty]) => {
            const config = proteinaConfig[cId] || { pollo: 0, cerdo: 0 };
            const currentSum = (config.pollo || 0) + (config.cerdo || 0);
            const c = productosDisponibles.find(x => x.id === cId);
            
            return (
              <div key={cId} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <strong>{c?.nombre}</strong>
                  <span style={{ color: currentSum === reqQty ? 'green' : 'red' }}>
                    {currentSum} / {reqQty} asignados
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Pollo:</span>
                    <button type="button" onClick={() => updateProteina(cId, 'pollo', -1)} style={btnQty}>-</button>
                    <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{config.pollo || 0}</span>
                    <button type="button" onClick={() => updateProteina(cId, 'pollo', 1)} style={btnQty} disabled={currentSum >= reqQty}>+</button>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Cerdo:</span>
                    <button type="button" onClick={() => updateProteina(cId, 'cerdo', -1)} style={btnQty}>-</button>
                    <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{config.cerdo || 0}</span>
                    <button type="button" onClick={() => updateProteina(cId, 'cerdo', 1)} style={btnQty} disabled={currentSum >= reqQty}>+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const btnQty = {
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  border: '1px solid #ccc',
  background: 'white',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '16px',
  padding: 0
};

export default CarritoBuilder;
