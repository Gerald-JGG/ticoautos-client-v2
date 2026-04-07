'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Car, CheckCircle } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const token = searchParams.get('token') ?? '';

  const [cedula, setCedula] = useState('');
  const [name, setName] = useState('');
  const [cedulaStatus, setCedulaStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [loading, setLoading] = useState(false);

  const validateCedula = async () => {
    if (!/^\d{9}$/.test(cedula)) return;
    setCedulaStatus('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cedula/${cedula}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setName(`${data.name} ${data.firstLastName} ${data.secondLastName}`.trim());
      setCedulaStatus('valid');
      toast.success('Cédula verificada ✓');
    } catch {
      setCedulaStatus('invalid');
      toast.error('Cédula no encontrada en el padrón');
    }
  };

  const handleSubmit = async () => {
    if (cedulaStatus !== 'valid') return toast.error('Debés validar tu cédula');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cedula, name }),
      });
      if (!res.ok) throw new Error();
      const { user } = await res.json();
      login(user, token);
      toast.success('¡Perfil completado!');
      router.push('/');
    } catch {
      toast.error('Error al guardar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 40% 20%, rgba(245,158,11,0.05) 0%, var(--bg) 60%)',
      padding: '80px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ background: '#f59e0b', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Car size={22} color="#000" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
            Tico<span style={{ color: 'var(--amber)' }}>Autos</span>
          </span>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Un paso más</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 28 }}>
            Para usar TicoAutos necesitamos verificar tu identidad con tu cédula costarricense.
          </p>

          <div className="field">
            <label className="label">Número de cédula *</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                placeholder="000000000 (9 dígitos)"
                value={cedula}
                onChange={(e) => { setCedula(e.target.value); setCedulaStatus('idle'); setName(''); }}
                onBlur={validateCedula}
                maxLength={9}
                inputMode="numeric"
                style={{
                  paddingRight: 40,
                  borderColor: cedulaStatus === 'valid' ? 'var(--success)' : cedulaStatus === 'invalid' ? 'var(--danger)' : undefined,
                }}
              />
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                {cedulaStatus === 'loading' && <div className="spinner" style={{ width: 16, height: 16 }} />}
                {cedulaStatus === 'valid' && <CheckCircle size={16} color="var(--success)" />}
                {cedulaStatus === 'invalid' && <span style={{ color: 'var(--danger)' }}>✕</span>}
              </div>
            </div>
            {cedulaStatus === 'invalid' && (
              <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
                Esta cédula no existe en el padrón electoral
              </p>
            )}
          </div>

          {name && (
            <div style={{ marginTop: 16, background: 'var(--bg-3)', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 2 }}>Nombre verificado</p>
              <p style={{ fontWeight: 600 }}>{name}</p>
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={loading || cedulaStatus !== 'valid'}
            style={{ width: '100%', marginTop: 24 }}
          >
            {loading ? <div className="spinner" /> : 'Confirmar y entrar'}
          </button>
        </div>
      </div>
    </main>
  );
}