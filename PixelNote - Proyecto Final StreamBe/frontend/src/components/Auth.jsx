import { useState } from 'react';

const API_BASE = 'http://localhost:4000/api';  // Cambia a tu URL de producción

function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isRegister ? '/register' : '/login';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!isRegister) {
        onLogin(data.token, data.user);
      } else {
        setIsRegister(false);
        setError('Registro exitoso, ahora inicia sesión');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: 'rgba(255, 255, 255, 0.9)', 
      padding: '20px', 
      borderRadius: '20px' 
    }}>
      <h2>{isRegister ? 'Registro' : 'Iniciar Sesión'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px', background: '#867dc9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {isRegister ? 'Registrar' : 'Iniciar Sesión'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => setIsRegister(!isRegister)} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#867dc9', cursor: 'pointer' }}>
        {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
      </button>
    </div>
  );
}

export default Auth;