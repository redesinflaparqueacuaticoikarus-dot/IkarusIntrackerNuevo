import React, { useState, useEffect } from 'react';
import { productosService } from '../services/productos';
import ProductoForm from '../components/ProductoForm';

const Catalogo = () => {
  const [activeTab, setActiveTab] = useState('consumibles');
  const [productos, setProductos] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProductos();
  }, [activeTab, mostrarInactivos]);

  const fetchProductos = async () => {
    try {
      if (activeTab === 'consumibles') {
        setProductos(await productosService.getConsumibles(mostrarInactivos));
      } else {
        setProductos(await productosService.getPaquetes(mostrarInactivos));
      }
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  };

  const handleCreateOrEdit = async (productoData) => {
    try {
      if (editingProduct) {
        await productosService.update(editingProduct.id, productoData);
      } else {
        await productosService.create({ ...productoData, tipo: activeTab === 'paquetes' ? 'paquete' : 'consumible' });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProductos();
    } catch (error) {
      console.error("Error saving producto:", error);
      alert("Error saving: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Seguro que deseas eliminar este producto?')) {
      await productosService.delete(id);
      fetchProductos();
    }
  };

  const handleRestore = async (id) => {
    await productosService.restore(id);
    fetchProductos();
  };

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Catálogo de Productos</h1>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="btn-primary"
        >
          + Nuevo {activeTab === 'consumibles' ? 'Consumible' : 'Paquete'}
        </button>
      </header>

      <div className="admin-card p-6">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '2px solid var(--surface-glass-border)', paddingBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setActiveTab('consumibles')}
              className={activeTab === 'consumibles' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Consumibles
            </button>
            <button 
              onClick={() => setActiveTab('paquetes')}
              className={activeTab === 'paquetes' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Paquetes
            </button>
          </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <input 
            type="checkbox" 
            checked={mostrarInactivos} 
            onChange={(e) => setMostrarInactivos(e.target.checked)} 
          />
          Mostrar Inactivos
        </label>
      </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--color-brand-teal)' }}>
              <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Nombre</th>
              <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Precio</th>
              {activeTab === 'consumibles' && <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Lugar Validación</th>}
              {activeTab === 'consumibles' && <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Req. Proteína</th>}
              <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Estado</th>
              <th style={{ padding: '15px 12px', borderBottom: '2px solid var(--surface-glass-border)', fontWeight: 'bold' }}>Acciones</th>
            </tr>
          </thead>
        <tbody>
            {productos.map(p => (
              <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.5, transition: 'background 0.2s', ':hover': { background: 'rgba(0,0,0,0.02)' } }}>
                <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)' }}>
                  <strong style={{ color: 'var(--color-brand-blue)' }}>{p.nombre}</strong>
                  <div style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: '4px' }}>{p.descripcion}</div>
                </td>
                <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)', fontWeight: '500' }}>
                  ${Number(p.precio).toLocaleString()}
                </td>
                {activeTab === 'consumibles' && (
                  <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)', textTransform: 'capitalize' }}>
                    {p.lugar_validacion}
                  </td>
                )}
                {activeTab === 'consumibles' && (
                  <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)' }}>
                    {p.requiere_proteina ? <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85em', fontWeight: 'bold' }}>Sí</span> : 'No'}
                  </td>
                )}
                <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)' }}>
                  {p.activo ? 
                    <span style={{ color: '#047857', fontWeight: 'bold' }}>Activo</span> : 
                    <span style={{ color: '#b91c1c', fontWeight: 'bold' }}>Inactivo</span>
                  }
                </td>
                <td style={{ padding: '15px 12px', borderBottom: '1px solid var(--surface-glass-border)' }}>
                  <button 
                    onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                    style={{ marginRight: '10px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--color-brand-light-blue)', fontWeight: 'bold' }}
                  >
                    Editar
                  </button>
                  {p.activo ? (
                    <button onClick={() => handleDelete(p.id)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 'bold' }}>Eliminar</button>
                  ) : (
                    <button onClick={() => handleRestore(p.id)} style={{ color: 'green', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 'bold' }}>Restaurar</button>
                  )}
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay productos para mostrar en esta categoría.
                </td>
              </tr>
            )}
        </tbody>
      </table>
      </div>

      {isModalOpen && (
        <ProductoForm 
          tipo={activeTab === 'paquetes' ? 'paquete' : 'consumible'}
          initialData={editingProduct}
          onSave={handleCreateOrEdit}
          onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
};

export default Catalogo;
