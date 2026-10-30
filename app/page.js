"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("jwt_token", data.token);
        router.push("/dashboard");
      } else {
        setError(data.error || "Credenciales inválidas");
      }
    } catch (err) {
      setError("Error de conexión con el servidor SIEM.");
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
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white p-3 rounded-lg font-bold shadow-lg shadow-teal-900/20 transition-all transform hover:scale-[1.02]"
          >
            Acceder al Sistema
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