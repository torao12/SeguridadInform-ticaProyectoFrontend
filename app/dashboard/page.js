"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAlerts = async () => {
      const token = localStorage.getItem("jwt_token");
      if (!token) {
        router.push("/"); // Si no hay token, lo expulsa al login
        return;
      }

      try {
        const res = await fetch("http://localhost:3001/api/alerts", {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("jwt_token");
          router.push("/");
          return;
        }

        const data = await res.json();
        setAlerts(data);
      } catch (error) {
        console.error("Error obteniendo alertas", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    router.push("/");
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400">Cargando telemetría...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-500">Panel de Amenazas Globales</h1>
          <p className="text-slate-400 text-sm">Monitoreo de red en tiempo real</p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors border border-slate-700">
          Cerrar Sesión
        </button>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm">
              <th className="p-4 font-medium">Severidad</th>
              <th className="p-4 font-medium">Tipo de Evento</th>
              <th className="p-4 font-medium">IP Origen</th>
              <th className="p-4 font-medium">Descripción</th>
              <th className="p-4 font-medium">Fecha/Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {alerts.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center text-slate-500">No hay alertas registradas.</td></tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                      'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-sky-400">{alert.event_type}</td>
                  <td className="p-4 font-mono text-sm">{alert.source_ip}</td>
                  <td className="p-4 text-sm text-slate-300">{alert.description}</td>
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(alert.detected_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}