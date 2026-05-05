'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Car, Eye, EyeOff, MailCheck, ShieldCheck, ArrowLeft } from 'lucide-react';

type Step = 'credentials' | '2fa';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [userId, setUserId] = useState('');
  const [smsHint, setSmsHint] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');
    const emailParam = searchParams.get('email');
    if (verified === 'true') {
      toast.success('¡Cuenta verificada! Ya podés iniciar sesión.');
      if (emailParam) setEmail(decodeURIComponent(emailParam));
    } else if (verified === 'false' && error) {
      toast.error(decodeURIComponent(error));
    } else if (error === 'google_auth_failed') {
      toast.error('Error al iniciar sesión con Google.');
    }
  }, [searchParams]);

  // ── Paso 1: credenciales ──────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Completá todos los campos');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data;

      if (data.requires2FA) {
        setUserId(data.userId);
        setSmsHint(data.message);
        setStep('2fa');
        toast.success('Código enviado por SMS');
        // Focus primer input
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Credenciales inválidas';
      toast.error(msg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2: 2FA ───────────────────────────────────────────────────────────
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // solo dígitos
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    // Auto-avanzar al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit cuando están los 6 dígitos
    if (newCode.every((d) => d !== '') && newCode.join('').length === 6) {
      verify2FA(newCode.join(''));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      verify2FA(pasted);
    }
    e.preventDefault();
  };

  const verify2FA = async (codeStr: string) => {
    if (verifying) return;
    setVerifying(true);
    try {
      const res = await api.post('/auth/verify-2fa', { userId, code: codeStr });
      const { user, token } = res.data;
      login(user, token);
      toast.success(`¡Bienvenido, ${user.name.split(' ')[0]}!`);
      router.push('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Código incorrecto';
      toast.error(msg);
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codeStr = code.join('');
    if (codeStr.length !== 6) return toast.error('Ingresá los 6 dígitos');
    verify2FA(codeStr);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/login', { email, password });
      toast.success('Nuevo código enviado');
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      toast.error('No se pudo reenviar el código');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/google`;
  };

  // ── Render 2FA step ───────────────────────────────────────────────────────
  if (step === '2fa') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 60% 20%, rgba(245,158,11,0.05) 0%, var(--bg) 60%)', padding: '80px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
            <div style={{ background: '#f59e0b', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={22} color="#000" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
              Tico<span style={{ color: 'var(--amber)' }}>Autos</span>
            </span>
          </div>

          <div className="card" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShieldCheck size={26} style={{ color: 'var(--amber)' }} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Verificación en dos pasos</h1>
              <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>{smsHint}</p>
            </div>

            <form onSubmit={handleVerifySubmit}>
              {/* Inputs de 6 dígitos */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }} onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    style={{
                      width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700,
                      background: 'var(--bg-3)', border: `2px solid ${digit ? 'var(--amber)' : 'var(--border)'}`,
                      borderRadius: 8, color: 'var(--text)', outline: 'none',
                      transition: 'border-color 0.15s',
                    }}
                  />
                ))}
              </div>

              <button
                className="btn btn-primary btn-lg"
                type="submit"
                disabled={verifying || code.some((d) => !d)}
                style={{ width: '100%', marginBottom: 16 }}
              >
                {verifying ? <div className="spinner" /> : 'Verificar código'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setStep('credentials'); setCode(['', '', '', '', '', '']); }}
                style={{ fontSize: 13 }}
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleResend}
                disabled={resending}
                style={{ fontSize: 13, color: 'var(--amber)' }}
              >
                {resending ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '¿No recibiste el código? Reenviar'}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Render credentials step ───────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 60% 20%, rgba(245,158,11,0.05) 0%, var(--bg) 60%)', padding: '80px 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ background: '#f59e0b', borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Car size={22} color="#000" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
            Tico<span style={{ color: 'var(--amber)' }}>Autos</span>
          </span>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Iniciá sesión</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 28 }}>Ingresá con tu cuenta para continuar</p>

          {searchParams.get('registered') === 'true' && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '14px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <MailCheck size={18} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', marginBottom: 2 }}>Revisá tu correo</p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>Te enviamos un link de activación para poder iniciar sesión.</p>
              </div>
            </div>
          )}

          <button type="button" onClick={handleGoogleLogin} className="btn btn-secondary btn-lg"
            style={{ width: '100%', marginBottom: 24, background: 'white', color: '#000', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, border: '1px solid #ddd' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
              <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <div className="divider" style={{ margin: '24px 0' }}>
            <span style={{ position: 'relative', background: 'var(--bg-2)', padding: '0 12px', color: 'var(--text-3)', fontSize: 13 }}>o con email</span>
          </div>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label className="label">Correo electrónico</label>
              <input className="input" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label className="label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: 24 }}>
              {loading ? <div className="spinner" /> : 'Ingresar'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-2)' }}>
            ¿No tenés cuenta?{' '}
            <Link href="/auth/register" style={{ color: 'var(--amber)', fontWeight: 600 }}>Registrate gratis</Link>
          </p>
        </div>
      </div>
    </main>
  );
}