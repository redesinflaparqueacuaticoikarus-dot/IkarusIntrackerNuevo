import React, { useState, useEffect } from 'react';
import { productosService } from '../services/productos';

const ProductoForm = ({ tipo, initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    lugar_validacion: 'puerta',
    requiere_proteina: false,
    componentes: { items: [] }
  });

  const [allConsumibles, setAllConsumibles] = useState([]);

  useEffect(() => {
    if (tipo === 'paquete') {
      productosService.getConsumibles(false).then(setAllConsumibles);
    }
    
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        precio: initialData.precio || 0,
        lugar_validacion: initialData.lugar_validacion || 'puerta',
        requiere_proteina: initialData.requiere_proteina || false,
        componentes: initialData.componentes || { items: [] }
      });
    }
  }, [initialData, tipo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addComponente = () => {
    if (allConsumibles.length === 0) return;
    setFormData(prev => ({
      ...prev,
      componentes: {
        items: [...prev.componentes.items, { producto_id: allConsumibles[0].id, cantidad: 1 }]
      }
    }));
  };

  const updateComponente = (index, field, value) => {
    const newItems = [...formData.componentes.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, componentes: { items: newItems } }));
  };

  const removeComponente = (index) => {
    const newItems = formData.componentes.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, componentes: { items: newItems } }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tipo === 'paquete' && formData.componentes.items.length === 0) {
      alert("Un paquete debe tener al menos un componente.");
      return;
    }
    
    const payload = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: formData.precio,
    };

    if (tipo === 'consumible') {
      payload.lugar_validacion = formData.lugar_validacion;
      payload.requiere_proteina = formData.requiere_proteina;
    } else {
      payload.componentes = formData.componentes;
    }

    onSave(payload);
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3>{initialData ? 'Editar' : 'Nuevo'} {tipo === 'paquete' ? 'Paquete' : 'Consumible'}</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input required name="nombre" value={formData.nombre} onChange={handleChange} style={inputStyle} />
          </div>
          
          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} style={inputStyle} rows="3" />
          </div>

          <div>
            <label style={labelStyle}>Precio ($) *</label>
            <input required type="number" name="precio" value={formData.precio} onChange={handleChange} style={inputStyle} />
          </div>

          {tipo === 'consumible' && (
            <>
              <div>
                <label style={labelStyle}>Lugar de Validación</label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {['puerta', 'restaurante', 'otro'].map(lugar => (
                    <label key={lugar} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input 
                        type="radio" 
                        name="lugar_validacion" 
                        value={lugar} 
                        checked={formData.lugar_validacion === lugar} 
                        onChange={handleChange} 
                      />
                      <span style={{ textTransform: 'capitalize' }}>{lugar}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" name="requiere_proteina" checked={formData.requiere_proteina} onChange={handleChange} />
                  <strong>Requiere elección de Proteína (Ej. Almuerzo)</strong>
                </label>
              </div>
            </>
          )}

          {tipo === 'paquete' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={labelStyle}>Componentes (Consumibles)</label>
                <button type="button" onClick={addComponente} style={{ padding: '4px 8px', cursor: 'pointer' }}>+ Agregar</button>
              </div>
              
              {formData.componentes.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                  <select 
                    value={item.producto_id} 
                    onChange={(e) => updateComponente(index, 'producto_id', e.target.value)}
                    style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                  >
                    {allConsumibles.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} (${Number(c.precio).toLocaleString()})</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    min="1" 
                    value={item.cantidad} 
                    onChange={(e) => updateComponente(index, 'cantidad', parseInt(e.target.value))}
                    style={{ ...inputStyle, width: '80px', marginBottom: 0 }}
                  />
                  <button type="button" onClick={() => removeComponente(index)} style={{ color: 'red', cursor: 'pointer' }}>X</button>
                </div>
              ))}
              {formData.componentes.items.length === 0 && <p style={{ fontSize: '0.9em', color: '#666' }}>No hay componentes asignados.</p>}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ padding: '8px 16px', background: 'var(--primary-color, #007bff)', color: 'white', border: 'none', cursor: 'pointer' }}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  background: 'white',
  padding: '30px',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
};

const labelStyle = {
  display: 'block',
  fontWeight: '600',
  marginBottom: '5px',
  fontSize: '0.9em',
  color: '#333'
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  boxSizing: 'border-box'
};

export default ProductoForm;
