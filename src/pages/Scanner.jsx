import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';
import { ordenesService } from '../services/ordenes';
import ItemValidator from '../components/ItemValidator';

const Scanner = () => {
  const [searchParams] = useSearchParams();
  const [operario, setOperario] = useState(localStorage.getItem('ikarus_operario') || '');
  const [isScanning, setIsScanning] = useState(!searchParams.get('code'));
  const [orden, setOrden] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [statusScreen, setStatusScreen] = useState(null); // 'invalid', 'used', 'canceled'

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && operario) {
      handleCode(code);
    }
  }, [searchParams, operario]);

  const handleOperarioSubmit = (e) => {
    e.preventDefault();
    const val = e.target.operario.value.trim();
    if (val) {
      localStorage.setItem('ikarus_operario', val);
      setOperario(val);
    }
  };

  const resetScanner = () => {
    setIsScanning(true);
    setOrden(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setStatusScreen(null);
    // remove query param without reload
    window.history.replaceState(null, '', '/scanner');
  };

  const handleCode = async (codigo) => {
    setIsScanning(false);
    setErrorMsg(null);
    setStatusScreen(null);
    try {
      const data = await ordenesService.getOrdenCompleta({ codigo });
      if (!data) throw new Error("Not found");

      if (data.estado === 'cancelada') {
        setStatusScreen('canceled');
        await ordenesService.logEscaneo({ orden_codigo: codigo, resultado: 'blocked_invalid', escaneado_por: operario, notas: 'Orden Cancelada' });
        return;
      }

      if (data.estado === 'usada_total') {
        setStatusScreen('used');
        await ordenesService.logEscaneo({ orden_id: data.id, orden_codigo: codigo, resultado: 'blocked_used', escaneado_por: operario, notas: 'Orden ya utilizada en su totalidad' });
        setOrden(data); // So we can show original use date
        return;
      }

      setOrden(data);
    } catch (error) {
      console.error(error);
      setStatusScreen('invalid');
      await ordenesService.logEscaneo({ orden_codigo: codigo, resultado: 'blocked_invalid', escaneado_por: operario, notas: 'QR Inválido / No encontrado' });
    }
  };

  const handleValidate = async (selectedIds) => {
    try {
      await ordenesService.consumirItems(orden.id, selectedIds, operario);
      setSuccessMsg(`¡${selectedIds.length} items registrados correctamente! ✓`);
      
      // Reload order to see new status
      const updatedData = await ordenesService.getOrdenCompleta({ id: orden.id });
      setOrden(updatedData);

      setTimeout(() => {
        setSuccessMsg(null);
        if (updatedData.estado === 'usada_total') {
          resetScanner();
        }
      }, 3000);

    } catch (error) {
      alert("Error registrando consumo: " + error.message);
    }
  };

  // 1. Ask for Operario first
  if (!operario) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '40px auto', textAlign: 'center' }}>
        <h2>Bienvenido al Escáner</h2>
        <p>Por favor, ingresa tu nombre o rol para registrar los usos.</p>
        <form onSubmit={handleOperarioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input name="operario" required placeholder="Ej: Juan Puerta 1" style={{ padding: '12px', fontSize: '1.1em', borderRadius: '4px', border: '1px solid #ccc' }} />
          <button type="submit" style={{ padding: '12px', background: 'var(--primary-color, #007bff)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.1em', cursor: 'pointer' }}>Continuar</button>
        </form>
      </div>
    );
  }

  // 2. Full screen alerts
  if (statusScreen === 'invalid') {
    return (
      <div style={{ height: '100vh', background: '#dc3545', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3em', margin: 0 }}>❌</h1>
        <h1 style={{ margin: '10px 0' }}>QR INVÁLIDO</h1>
        <p>Este código no existe en el sistema.</p>
        <button onClick={resetScanner} style={{ marginTop: '30px', padding: '15px 30px', fontSize: '1.2em', borderRadius: '30px', border: 'none', background: 'white', color: '#dc3545', fontWeight: 'bold' }}>Escanear otro</button>
      </div>
    );
  }

  if (statusScreen === 'canceled') {
    return (
      <div style={{ height: '100vh', background: '#dc3545', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3em', margin: 0 }}>🚫</h1>
        <h1 style={{ margin: '10px 0' }}>ORDEN CANCELADA</h1>
        <p>Esta orden fue cancelada y no es válida.</p>
        <button onClick={resetScanner} style={{ marginTop: '30px', padding: '15px 30px', fontSize: '1.2em', borderRadius: '30px', border: 'none', background: 'white', color: '#dc3545', fontWeight: 'bold' }}>Escanear otro</button>
      </div>
    );
  }

  if (statusScreen === 'used') {
    const useDate = orden?.updated_at ? new Date(orden.updated_at).toLocaleString() : 'fecha desconocida';
    return (
      <div style={{ height: '100vh', background: '#dc3545', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3em', margin: 0 }}>⚠️</h1>
        <h1 style={{ margin: '10px 0' }}>QR YA UTILIZADO</h1>
        <p>Esta orden fue utilizada en su totalidad el <br/><strong>{useDate}</strong>.</p>
        <button onClick={resetScanner} style={{ marginTop: '30px', padding: '15px 30px', fontSize: '1.2em', borderRadius: '30px', border: 'none', background: 'white', color: '#dc3545', fontWeight: 'bold' }}>Escanear otro</button>
      </div>
    );
  }

  // 3. Scanning viewport
  if (isScanning) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000' }}>
        <div style={{ padding: '15px', background: '#222', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Scanner Ikarus</h3>
          <span style={{ fontSize: '0.8em', color: '#aaa' }}>👤 {operario}</span>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <QrScanner 
            onScan={(result) => {
              if (result && result.length > 0 && result[0].rawValue) {
                handleCode(result[0].rawValue);
              }
            }} 
            onError={(error) => console.log(error?.message)}
            components={{ tracker: true, audio: false }}
            constraints={{ facingMode: 'environment' }}
          />
        </div>
        <div style={{ padding: '20px', background: '#222', color: 'white', textAlign: 'center' }}>
          Apunta la cámara al código QR
        </div>
      </div>
    );
  }

  // 4. Order view (to validate items)
  if (orden) {
    const today = new Date().toISOString().split('T')[0];
    const isWrongDate = orden.fecha_visita !== today;

    // Group items
    const groupedItems = orden.orden_items.reduce((acc, item) => {
      const lugar = item.lugar_validacion || 'desconocido';
      if (!acc[lugar]) acc[lugar] = [];
      acc[lugar].push(item);
      return acc;
    }, {});

    return (
      <div style={{ background: '#f0f2f5', minHeight: '100vh', paddingBottom: '20px' }}>
        <div style={{ background: 'white', padding: '15px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Orden: {orden.codigo.split('-')[2]}</h3>
          <button onClick={resetScanner} style={{ background: '#eee', border: 'none', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold' }}>Volver</button>
        </div>

        {successMsg && (
          <div style={{ background: '#28a745', color: 'white', padding: '15px', textAlign: 'center', fontWeight: 'bold', position: 'sticky', top: '60px', zIndex: 9 }}>
            {successMsg}
          </div>
        )}

        <div style={{ padding: '15px' }}>
          {isWrongDate && (
            <div style={{ background: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #ffeeba' }}>
              <strong>⚠️ ATENCIÓN:</strong> Esta orden es para el <strong>{orden.fecha_visita}</strong>. Confirmar con supervisor antes de continuar.
            </div>
          )}

          <div style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '5px' }}>{orden.cliente_nombre}</div>
            <div style={{ color: '#666', marginBottom: '10px' }}>CC: {orden.cliente_cc}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
              <div>👥 {orden.cantidad_personas} pax</div>
              <div style={{ fontWeight: 'bold' }}>${Number(orden.total).toLocaleString()}</div>
            </div>
          </div>

          <ItemValidator groupedItems={groupedItems} onValidate={handleValidate} />
        </div>
      </div>
    );
  }

  return null;
};

export default Scanner;
