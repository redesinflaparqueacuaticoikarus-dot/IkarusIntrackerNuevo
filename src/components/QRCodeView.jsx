import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const QRCodeView = ({ data, size = 256 }) => {
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!data) return;
    
    QRCode.toDataURL(data, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
    .then(url => {
      setSrc(url);
    })
    .catch(err => {
      console.error(err);
    });
  }, [data, size]);

  if (!src) return <div style={{ width: size, height: size, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando QR...</div>;

  return (
    <img src={src} alt="QR Code" width={size} height={size} style={{ display: 'block', margin: '0 auto' }} />
  );
};

export default QRCodeView;
