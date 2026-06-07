import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verificando...');

  useEffect(() => {
    const hash   = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const type   = params.get('type');

    if (type === 'signup' || type === 'recovery') {
      setMessage('Email confirmado. Redirigiendo...');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setTimeout(() => navigate('/'), 1500);
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#09090b',
      color: '#71717a',
      fontSize: '0.9rem',
      letterSpacing: '0.02em',
    }}>
      {message}
    </div>
  );
}
