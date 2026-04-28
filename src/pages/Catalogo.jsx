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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Catálogo de Productos</h2>
        <button 
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          style={{ padding: '10px 20px', background: 'var(--primary-color, #007bff)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Nuevo {activeTab === 'consumibles' ? 'Consumible' : 'Paquete'}
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('consumibles')}
            style={{ padding: '8px 16px', border: '1px solid #ccc', background: activeTab === 'consumibles' ? '#eee' : 'white', cursor: 'pointer' }}
          >
            Consumibles
          </button>
          <button 
            onClick={() => setActiveTab('paquetes')}
            style={{ padding: '8px 16px', border: '1px solid #ccc', background: activeTab === 'paquetes' ? '#eee' : 'white', cursor: 'pointer' }}
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

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Nombre</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Precio</th>
            {activeTab === 'consumibles' && <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Lugar Validación</th>}
            {activeTab === 'consumibles' && <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Req. Proteína</th>}
            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Estado</th>
            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map(p => (
            <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.5 }}>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                <strong>{p.nombre}</strong>
                <div style={{ fontSize: '0.8em', color: '#666' }}>{p.descripcion}</div>
              </td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                ${Number(p.precio).toLocaleString()}
              </td>
              {activeTab === 'consumibles' && (
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd', textTransform: 'capitalize' }}>
                  {p.lugar_validacion}
                </td>
              )}
              {activeTab === 'consumibles' && (
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  {p.requiere_proteina ? 'Sí' : 'No'}
                </td>
              )}
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                {p.activo ? 'Activo' : 'Inactivo'}
              </td>
              <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                <button 
                  onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                  style={{ marginRight: '10px', cursor: 'pointer' }}
                >
                  Editar
                </button>
                {p.activo ? (
                  <button onClick={() => handleDelete(p.id)} style={{ color: 'red', cursor: 'pointer' }}>Eliminar</button>
                ) : (
                  <button onClick={() => handleRestore(p.id)} style={{ color: 'green', cursor: 'pointer' }}>Restaurar</button>
                )}
              </td>
            </tr>
          ))}
          {productos.length === 0 && (
            <tr>
              <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No hay productos para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
