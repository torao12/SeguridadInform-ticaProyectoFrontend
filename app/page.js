"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (res.ok) {
        if (!data.token) {
          setError("El servidor respondio sin un token de sesion.");
          return;
        }
        localStorage.setItem("jwt_token", data.token);
        router.push("/dashboard");
      } else if (res.status === 401) {
        setError(data.error || "El usuario o la contrasena son incorrectos.");
      } else if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        setError(data.error || `Demasiados intentos. Espera ${retryAfter || "unos minutos"} antes de volver a intentarlo.`);
      } else if (res.status >= 500) {
        setError(data.error || "El servicio de autenticacion fallo. Intentalo de nuevo mas tarde.");
      } else {
        setError(data.error || `No se pudo iniciar sesion (HTTP ${res.status}).`);
      }
    } catch {
      setError(`No se pudo conectar con ${API_URL}. Comprueba NEXT_PUBLIC_API_URL, CORS y que Render tenga el backend disponible.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950"></div>
      
      <form onSubmit={handleLogin} className="relative z-10 bg-slate-900/80 p-8 rounded-2xl shadow-[0_0_40px_rgba(8,145,178,0.1)] w-full max-w-md border border-slate-800 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-500">
            NetSentinel
          </h2>
          <p className="text-sm text-slate-400 mt-2">Monitoreo SIEM & Control de Accesos</p>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Usuario Analista</label>
            <input 
              type="text" 
              required
                maxLength={100}
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Contraseña</label>
            <input 
              type="password" 
              required
                maxLength={128}
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 disabled:cursor-wait disabled:opacity-60 text-white p-3 rounded-lg font-bold shadow-lg shadow-teal-900/20 transition-all transform hover:scale-[1.02]"
          >
            {isSubmitting ? "Conectando..." : "Acceder al Sistema"}
          </button>
        </div>
        
        {error && (
          <div className="mt-5 p-3 rounded-lg bg-red-900/30 border border-red-800 text-center text-sm text-red-400">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
