"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/auth-api";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { Car, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    cedula: "",
    phone: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Cédula validation state ───────────────────────────────────────────────
  const [cedulaStatus, setCedulaStatus] = useState<
    "idle" | "loading" | "valid" | "invalid"
  >("idle");
  const [cedulaError, setCedulaError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    // Reset cedula state when cedula field changes
    if (field === "cedula") {
      setCedulaStatus("idle");
      setCedulaError("");
    }
  };

  // ── Validate cedula on blur ───────────────────────────────────────────────
  const validateCedula = async () => {
    const cedula = form.cedula.trim();
    if (!/^\d{9}$/.test(cedula)) return; // let backend handle format errors

    setCedulaStatus("loading");
    setCedulaError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cedula/${cedula}`,
      );
      const data = await res.json();

      if (!res.ok) {
        // Backend returns the specific error message (e.g. age restriction)
        const msg =
          data?.message ||
          "Cédula no encontrada o no cumple los requisitos";
        setCedulaStatus("invalid");
        setCedulaError(msg);
        // Clear name in case it was previously autocompleted
        setForm((f) => ({ ...f, name: "" }));
        return;
      }

      // Autocomplete name from padrón
      const fullName =
        `${data.name} ${data.firstLastName} ${data.secondLastName}`.trim();
      setForm((f) => ({ ...f, name: fullName }));
      setCedulaStatus("valid");
      toast.success("Cédula verificada ✓");
    } catch {
      setCedulaStatus("invalid");
      setCedulaError("No se pudo verificar la cédula. Intentá de nuevo.");
      setForm((f) => ({ ...f, name: "" }));
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.cedula) {
      return toast.error("Completá los campos requeridos");
    }
    if (!/^\d{9}$/.test(form.cedula)) {
      return toast.error("La cédula debe tener exactamente 9 dígitos");
    }
    if (cedulaStatus !== "valid") {
      return toast.error("Debés validar tu cédula antes de continuar");
    }
    if (form.password.length < 6) {
      return toast.error("La contraseña debe tener al menos 6 caracteres");
    }

    setLoading(true);
    try {
      const { user, token } = await authApi.register(form);
      login(user, token);
      toast.success("¡Cuenta creada! Bienvenido/a");
      router.push("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    window.location.href = `${apiUrl}/auth/google`;
  };

  // ── Cedula border color helper ────────────────────────────────────────────
  const cedulaBorderColor =
    cedulaStatus === "valid"
      ? "var(--success)"
      : cedulaStatus === "invalid"
        ? "var(--danger)"
        : undefined;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 40% 20%, rgba(245,158,11,0.05) 0%, var(--bg) 60%)",
        padding: "80px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 40,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#f59e0b",
              borderRadius: 8,
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Car size={22} color="#000" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 22,
            }}
          >
            Tico<span style={{ color: "var(--amber)" }}>Autos</span>
          </span>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
            Crear cuenta
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 28 }}>
            Registrate gratis para publicar y comprar
          </p>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn btn-secondary btn-lg"
            style={{
              width: "100%",
              marginBottom: 24,
              background: "white",
              color: "#000",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              border: "1px solid #ddd",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
                fill="#EA4335"
              />
            </svg>
            Continuar con Google
          </button>

          <div className="divider" style={{ margin: "24px 0" }}>
            <span
              style={{
                position: "relative",
                background: "var(--bg-2)",
                padding: "0 12px",
                color: "var(--text-3)",
                fontSize: 13,
              }}
            >
              o con email
            </span>
          </div>

          {/* ── Cédula (first so autocomplete fills name) ── */}
          <div className="field">
            <label className="label">
              Número de cédula *{" "}
              <span style={{ color: "var(--text-3)", fontWeight: 400 }}>
                (9 dígitos)
              </span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                placeholder="000000000"
                value={form.cedula}
                onChange={set("cedula")}
                onBlur={validateCedula}
                maxLength={9}
                inputMode="numeric"
                style={{
                  paddingRight: 40,
                  borderColor: cedulaBorderColor,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                {cedulaStatus === "loading" && (
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                )}
                {cedulaStatus === "valid" && (
                  <CheckCircle size={16} color="var(--success)" />
                )}
                {cedulaStatus === "invalid" && (
                  <span style={{ color: "var(--danger)", fontSize: 16 }}>
                    ✕
                  </span>
                )}
              </div>
            </div>
            {cedulaStatus === "invalid" && (
              <p
                style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}
              >
                {cedulaError}
              </p>
            )}
            {cedulaStatus === "valid" && (
              <p
                style={{ color: "var(--success)", fontSize: 12, marginTop: 4 }}
              >
                Cédula válida · nombre autocompleto ✓
              </p>
            )}
          </div>

          {/* ── Name (autocompleted from padrón) ── */}
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label">
              Nombre completo *{" "}
              {cedulaStatus === "valid" && (
                <span
                  style={{
                    color: "var(--success)",
                    fontSize: 11,
                    fontWeight: 400,
                  }}
                >
                  autocompleto desde el padrón
                </span>
              )}
            </label>
            <input
              className="input"
              placeholder="Se autocompleta al validar la cédula"
              value={form.name}
              onChange={set("name")}
              style={{
                borderColor:
                  cedulaStatus === "valid"
                    ? "var(--success)"
                    : undefined,
              }}
            />
          </div>

          {/* ── Email ── */}
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label">Correo electrónico *</label>
            <input
              className="input"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={set("email")}
              required
            />
          </div>

          {/* ── Password ── */}
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label">Contraseña *</label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showPass ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={set("password")}
                required
                minLength={6}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-3)",
                  padding: 0,
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* ── Phone (optional) ── */}
          <div className="field" style={{ marginTop: 16 }}>
            <label className="label">
              Teléfono{" "}
              <span style={{ color: "var(--text-3)" }}>(opcional)</span>
            </label>
            <input
              className="input"
              placeholder="8888-8888"
              value={form.phone}
              onChange={set("phone")}
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            type="button"
            onClick={handleSubmit}
            disabled={loading || cedulaStatus === "loading"}
            style={{ width: "100%", marginTop: 24 }}
          >
            {loading ? <div className="spinner" /> : "Crear cuenta"}
          </button>

          <div className="divider" />

          <p
            style={{
              textAlign: "center",
              fontSize: 14,
              color: "var(--text-2)",
            }}
          >
            ¿Ya tenés cuenta?{" "}
            <Link
              href="/auth/login"
              style={{ color: "var(--amber)", fontWeight: 600 }}
            >
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}