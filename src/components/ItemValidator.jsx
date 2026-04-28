import React, { useState } from 'react';

const ItemValidator = ({ groupedItems, onValidate }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  const handleToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectGroup = (items, select) => {
    const ids = items.filter(i => i.estado === 'pending').map(i => i.id);
    if (select) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {Object.entries(groupedItems).map(([lugar, items]) => {
        const pendingCount = items.filter(i => i.estado === 'pending').length;
        
        return (
          <div key={lugar} style={{ marginBottom: '20px', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#f8f9fa', padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {lugar === 'puerta' ? '🚪' : lugar === 'restaurante' ? '🍴' : '📦'} 
                {lugar} <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'normal' }}>({pendingCount} pendientes)</span>
              </h4>
              {pendingCount > 0 && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleSelectGroup(items, true)} style={textBtn}>Todos</button>
                  <button onClick={() => handleSelectGroup(items, false)} style={textBtn}>Ninguno</button>
                </div>
              )}
            </div>
            
            <div style={{ padding: '10px' }}>
              {items.map(item => {
                const isPending = item.estado === 'pending';
                const isSelected = selectedIds.includes(item.id);
                return (
                  <label 
                    key={item.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '12px', 
                      borderBottom: '1px solid #eee',
                      opacity: isPending ? 1 : 0.5,
                      cursor: isPending ? 'pointer' : 'not-allowed',
                      background: isSelected ? '#f0f8ff' : 'transparent',
                      borderRadius: '4px'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      disabled={!isPending}
                      checked={isSelected}
                      onChange={() => handleToggle(item.id)}
                      style={{ width: '20px', height: '20px', marginRight: '15px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{item.producto_nombre}</div>
                      {item.proteina && <div style={{ color: '#0066cc', fontSize: '0.9em', textTransform: 'capitalize' }}>Proteína: {item.proteina}</div>}
                    </div>
                    {!isPending && (
                      <div style={{ fontSize: '0.8em', color: 'green', fontWeight: 'bold' }}>
                        Usado {new Date(item.usado_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ position: 'sticky', bottom: '20px', marginTop: '30px' }}>
        <button 
          onClick={() => onValidate(selectedIds)}
          disabled={selectedIds.length === 0}
          style={{ 
            width: '100%', 
            padding: '15px', 
            background: selectedIds.length > 0 ? 'var(--primary-color, #007bff)' : '#ccc', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '1.2em',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          Marcar Seleccionados ({selectedIds.length}) como Usados
        </button>
      </div>
    </div>
  );
};

const textBtn = {
  background: 'none',
  border: 'none',
  color: 'var(--primary-color, #007bff)',
  cursor: 'pointer',
  padding: '4px 8px',
  fontWeight: 'bold'
};

export default ItemValidator;
