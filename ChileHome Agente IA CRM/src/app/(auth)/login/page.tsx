"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, justifyContent: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FACC15", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 20, color: "#000" }}>C</div>
          <div>
            <div style={{ fontWeight: 700, color: "#fff", fontSize: 18 }}>ChileHome CRM</div>
            <div style={{ fontSize: 12, color: "#FACC15", opacity: 0.7 }}>Panel administrativo</div>
          </div>
        </div>

        <div style={{ background: "#111", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", padding: 32 }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>📬</div>
              <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 20, margin: "12px 0 8px" }}>Revisa tu correo</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                Enviamos un enlace a <strong style={{ color: "rgba(255,255,255,0.8)" }}>{email}</strong>
              </p>
              <button onClick={() => setSent(false)} style={{ marginTop: 16, background: "none", border: "none", color: "#FACC15", cursor: "pointer", fontSize: 14 }}>
                Volver
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ color: "#fff", fontWeight: 700, fontSize: 24, margin: "0 0 4px" }}>Acceder</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 24px" }}>Te enviamos un enlace mágico al correo.</p>
              <form onSubmit={handleLogin}>
                <label style={{ display: "block", color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 6 }}>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@chilehome.cl"
                  required
                  autoFocus
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
                {error && (
                  <p style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 13, margin: "12px 0 0" }}>{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", marginTop: 16, padding: "12px", background: "#FACC15", color: "#000", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer" }}
                >
                  {loading ? "Enviando…" : "Enviar enlace de acceso"}
                </button>
              </form>
            </>
          )}
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 24 }}>
          ChileHome © {new Date().getFullYear()} · Uso interno
        </p>
      </div>
    </div>
  );
}
