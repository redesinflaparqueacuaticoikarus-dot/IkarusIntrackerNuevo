import React, { useEffect, useState } from 'react';
import { getDuplicatesGroups, deleteRecord } from '../services/db';
import { AlertTriangle, Trash2, Eye } from 'lucide-react';
import classNames from 'classnames';

const Duplicates = () => {
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    loadDuplicates();
  }, []);

  const loadDuplicates = async () => {
    setLoading(true);
    const groups = await getDuplicatesGroups();
    setDuplicateGroups(groups);
    setLoading(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      await deleteRecord(id);
      await loadDuplicates();
    }
  };

  const toggleGroup = (cc) => {
    setExpandedGroups(prev => ({ ...prev, [cc]: !prev[cc] }));
  };

  if (loading) {
    return <div className="page-container"><p>Cargando duplicados...</p></div>;
  }

  return (
    <div className="page-container duplicates border-box">
      <header className="page-header">
        <h1 className="page-title flex items-center gap-4">
          <AlertTriangle color="var(--color-warning)" size={32} />
          Revisión de Duplicados
        </h1>
        <p className="page-subtitle">
          Acá se agrupan los clientes que comparten el mismo número de cédula (CC). Revisa si es un familiar usando el mismo ticket o un intento de doble uso.
        </p>
      </header>

      {duplicateGroups.length === 0 ? (
        <div className="admin-card p-6 text-center">
          <CheckCircle className="mx-auto text-success mb-4" size={48} color="var(--color-success)"/>
          <h2 className="text-xl text-blue mb-2">¡Todo limpio!</h2>
          <p className="text-muted">No se encontraron cédulas duplicadas en el sistema.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {duplicateGroups.map((group, idx) => {
            const cc = group[0].CC;
            const isExpanded = expandedGroups[cc];

            return (
              <div key={idx} className="admin-card overflow-hidden">
                <div 
                  className="flex justify-between items-center p-6 cursor-pointer"
                  style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  onClick={() => toggleGroup(cc)}
                >
                  <div>
                    <h3 className="text-lg font-bold text-error">
                      Cédula: {cc}
                    </h3>
                    <p className="text-sm text-muted">{group.length} registros encontrados</p>
                  </div>
                  <button className="btn-secondary">
                    {isExpanded ? 'Ocultar Detalles' : 'Ver Detalles'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-6 border-t" style={{ borderTopColor: 'var(--surface-glass-border)' }}>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Nombre</th>
                            <th>Teléfono</th>
                            <th>Usuario IG</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.map((record) => (
                            <tr key={record.id}>
                              <td>{record.FECHA}</td>
                              <td>{record.NOMBRE}</td>
                              <td>{record['N° TELEFONO']}</td>
                              <td style={{ color: 'var(--color-brand-pink)', fontWeight: 600 }}>@{record.USUARIO?.replace('@', '')}</td>
                              <td>
                                <button 
                                  onClick={(e) => handleDelete(record.id, e)} 
                                  className="btn-danger flex items-center gap-2"
                                  title="Eliminar este registro específico"
                                >
                                  <Trash2 size={16} /> Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Fix missing CheckCircle import locally in case
import { CheckCircle } from 'lucide-react';

export default Duplicates;
