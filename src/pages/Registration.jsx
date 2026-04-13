import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { addRecord, checkDuplicateCC, importMultipleRecords, getAllRecords } from '../services/db';
import * as XLSX from 'xlsx';
import { UploadCloud, Download, CheckCircle, AlertOctagon, Info } from 'lucide-react';
import './Registration.css';

const Registration = () => {
  const [formData, setFormData] = useState({
    NOMBRE: '',
    CC: '',
    'N° TELEFONO': '',
    USUARIO: '',
    'CORREO ELECTRONICO': ''
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isDuplicate, setIsDuplicate] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Instant duplicate check on CC change
    if (name === 'CC' && value.length >= 5) {
      const existing = await checkDuplicateCC(value);
      if (existing) {
        setIsDuplicate(true);
        setStatus({ type: 'error', message: '¡Cédula ya registrada! Bono no aplicable.' });
      } else {
        setIsDuplicate(false);
        setStatus({ type: 'success', message: 'Cédula nueva. Bono aplicable.' });
      }
    } else if (name === 'CC') {
      setIsDuplicate(false);
      setStatus({ type: '', message: '' });
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (isDuplicate) {
        setStatus({ type: 'error', message: 'No se puede guardar: Cédula duplicada.' });
        return;
    }
    
    if (!formData.NOMBRE || !formData.CC || !formData.USUARIO) {
        setStatus({ type: 'error', message: 'Por favor llene los campos requeridos (Nombre, CC, Usuario).' });
        return;
    }

    const todayDate = format(new Date(), 'dd-MM-yyyy');

    const newRecord = {
      FECHA: todayDate,
      ...formData,
      'FECHA DE USO': todayDate,
    };

    try {
      await addRecord(newRecord);
      setStatus({ type: 'success', message: 'Cliente registrado exitosamente.' });
      setFormData({
        NOMBRE: '',
        CC: '',
        'N° TELEFONO': '',
        USUARIO: '',
        'CORREO ELECTRONICO': ''
      });
      setIsDuplicate(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Error al guardar el registro.' });
    }
  };

  const processExcelFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus({ type: 'info', message: 'Procesando archivo...' });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to JSON
        let data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        
        // Filter out empty rows (checking for CC or NOMBRE)
        data = data.filter(r => r.CC !== "" || r.NOMBRE !== "");

        // Optional standardizations
        const standardizedData = data.map(r => ({
          FECHA: r['FECHA'] instanceof Date ? format(r['FECHA'], 'dd-MM-yyyy') : (r['FECHA'] || ''),
          NOMBRE: String(r['NOMBRE'] || '').trim().toUpperCase(),
          'N° TELEFONO': String(r['N° TELEFONO'] || '').trim(),
          'CORREO ELECTRONICO': String(r['CORREO ELECTRONICO'] || '').trim(),
          CC: String(r['CC'] || '').trim(),
          'FECHA DE USO': r['FECHA DE USO'] instanceof Date ? format(r['FECHA DE USO'], 'dd-MM-yyyy') : (r['FECHA DE USO'] || ''),
          USUARIO: String(r['USUARIO'] || '').trim()
        }));

        const count = await importMultipleRecords(standardizedData);
        setStatus({ type: 'success', message: `¡${count} registros importados exitosamente! Revisa la pestaña de Duplicados.` });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        setStatus({ type: 'error', message: 'Error al procesar el archivo Excel.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadCSV = async () => {
    const records = await getAllRecords();
    if (!records.length) {
      alert("No hay registros para descargar.");
      return;
    }

    // Prepare data (only specific columns)
    const exportData = records.map(r => ({
      'FECHA': r['FECHA'],
      'NOMBRE': r['NOMBRE'],
      'N° TELEFONO': r['N° TELEFONO'],
      'CORREO ELECTRONICO': r['CORREO ELECTRONICO'],
      'CC': r['CC'],
      'FECHA DE USO': r['FECHA DE USO'],
      'USUARIO': r['USUARIO']
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bonos");
    
    // Generate buffer
    const filename = `bonos_ikarus_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="page-container registration">
      <header className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Agregar / Importar</h1>
          <p className="page-subtitle">Registro de clientes para bono 2x1</p>
        </div>
        <button onClick={handleDownloadCSV} className="btn-primary">
          <Download size={18} />
          Descargar XLSX
        </button>
      </header>

      {status.message && (
        <div className={`status-alert alert-${status.type}`}>
          {status.type === 'success' && <CheckCircle size={20} />}
          {status.type === 'error' && <AlertOctagon size={20} />}
          {status.type === 'info' && <Info size={20} />}
          <p>{status.message}</p>
        </div>
      )}

      <div className="registration-grid">
        {/* Manual Form Area */}
        <div className="admin-card p-6 form-section">
          <h2 className="section-title">Registro Manual Taquilla</h2>
          <form onSubmit={handleManualSubmit} className="pt-4 grid-form">
            <div className="form-group span-full">
              <label>Número de Cédula (CC) *</label>
              <input 
                type="text" 
                name="CC" 
                value={formData.CC} 
                onChange={handleInputChange} 
                required
                className={status.type === 'error' && isDuplicate ? 'input-error' : (status.type === 'success' ? 'input-success' : '')}
                placeholder="Ej. 1012345678"
              />
            </div>
            
            <div className="form-group span-full">
              <label>Nombre Completo *</label>
              <input 
                type="text" 
                name="NOMBRE" 
                value={formData.NOMBRE} 
                onChange={handleInputChange} 
                required
                placeholder="Ej. Yensy Martinez"
              />
            </div>

            <div className="form-group">
              <label>Usuario Instagram *</label>
              <input 
                type="text" 
                name="USUARIO" 
                value={formData.USUARIO} 
                onChange={handleInputChange} 
                required
                placeholder="Ej. @yeincypayanene"
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input 
                type="text" 
                name="N° TELEFONO" 
                value={formData['N° TELEFONO']} 
                onChange={handleInputChange} 
                placeholder="Ej. 3138539653"
              />
            </div>

            <div className="form-group span-full">
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                name="CORREO ELECTRONICO" 
                value={formData['CORREO ELECTRONICO']} 
                onChange={handleInputChange} 
                placeholder="Ej. correo@gmail.com"
              />
            </div>

            <div className="form-actions span-full mt-4">
              <button 
                type="submit" 
                className="btn-primary w-full"
                disabled={isDuplicate}
                style={isDuplicate ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                Registrar Cliente
              </button>
            </div>
          </form>
        </div>

        {/* Excel Import Area */}
        <div className="admin-card p-6 import-section flex-col justify-center items-center">
          <UploadCloud size={64} color="var(--color-brand-light-blue)" className="mb-4" />
          <h2 className="section-title text-center">Importar desde Excel</h2>
          <p className="text-center text-muted mb-6 px-4">
            Sube el archivo <strong>Bonos_taquilla.xlsx</strong>. Asegúrate de que las columnas coincidan con el formato estándar.
          </p>
          
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            id="excel-upload"
            className="hidden-input"
            onChange={processExcelFile}
            ref={fileInputRef}
          />
          <label htmlFor="excel-upload" className="btn-secondary">
            Seleccionar Archivo
          </label>
        </div>
      </div>
    </div>
  );
};

export default Registration;
