"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [apiError, setApiError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("alerts"); // 'alerts' o 'audit'
  const router = useRouter();

  const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(date);
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    router.push("/login");
  };

  const resetDemo = async () => {
    if (!window.confirm("¿Limpiar las alertas y los registros de auditoría de esta demo?")) return;
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/telemetry/reset`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("jwt_token");
        router.push("/login");
        return;
      }
      if (!response.ok) throw new Error("No se pudo limpiar la telemetría.");
      setAlerts([]);
      setAuditLogs([]);
    } catch (error) {
      console.error("Error limpiando la demo", error);
      window.alert("No se pudo limpiar la demo. Inténtalo de nuevo.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("jwt_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Llamadas simultáneas a Alertas y Auditoría
        const [resAlerts, resAudit] = await Promise.all([
          fetch(`${API_URL}/api/alerts`, { headers }),
          fetch(`${API_URL}/api/audit`, { headers })
        ]);
        
        if (resAlerts.ok && resAudit.ok) {
          setApiError("");
          setAlerts(await resAlerts.json());
          setAuditLogs(await resAudit.json());
        } else if ([resAlerts.status, resAudit.status].some((status) => status === 401 || status === 403)) {
          localStorage.removeItem("jwt_token");
          router.push("/login");
        } else {
          const status = !resAlerts.ok ? resAlerts.status : resAudit.status;
          setApiError(status === 429
            ? "Demasiadas solicitudes. Espera un momento y vuelve a intentarlo."
            : status >= 500
              ? "La API tuvo un error al cargar la telemetria. Intentalo de nuevo en unos segundos."
              : `No se pudo cargar la telemetria (HTTP ${status}).`);
        }
      } catch (error) {
        console.error("Error fetching data", error);
        setApiError(`No se pudo conectar con la API (${API_URL}). Comprueba la URL y la disponibilidad del backend.`);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Refresco en vivo
    return () => clearInterval(interval);
  }, [router]);

  // Cálculos para KPIs (basados en alertas)
  const totalAlerts = alerts.length;
  const criticalAlerts = alerts.filter(a => a.severity === "CRITICAL").length;
  const highAlerts = alerts.filter(a => a.severity === "HIGH").length;

  // Filtrado de tablas
  const filteredAlerts = alerts.filter(alert => 
    (alert.event_type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (alert.source_ip || "").includes(searchTerm)
  );

  const filteredAudit = auditLogs.filter(log => 
    (log.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.ip_address || "").includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8 font-sans selection:bg-teal-900">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-500">
            NetSentinel
          </h1>
          <p className="text-sm text-slate-500 mt-1">Plataforma de Defensa y Gestión de Incidentes</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center space-x-3 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700 shadow-inner">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-400 font-bold tracking-widest uppercase">Motor WAF Activo</span>
          </div>
          <button onClick={resetDemo} className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold">Limpiar demo</button>
          <button onClick={logout} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700">Cerrar sesión</button>
        </div>
      </div>

      {/* KPI Widgets (Solo visibles en pestaña de Alertas para no saturar) */}
      {apiError && (
        <div role="alert" className="mb-6 rounded-lg border border-red-800 bg-red-900/30 p-4 text-sm text-red-300">
          {apiError}
        </div>
      )}

      {activeTab === "alerts" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-lg border-t-4 border-t-sky-500">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Eventos Totales</h3>
            <p className="text-4xl font-bold text-sky-400 mt-2">{totalAlerts}</p>
          </div>
          <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-lg border-t-4 border-t-red-500">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Amenazas Críticas</h3>
            <p className="text-4xl font-bold text-red-400 mt-2 animate-pulse">{criticalAlerts}</p>
          </div>
          <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-lg border-t-4 border-t-orange-500">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Riesgo Alto</h3>
            <p className="text-4xl font-bold text-orange-400 mt-2">{highAlerts}</p>
          </div>
        </div>
      )}

      {/* Controles de Navegación y Búsqueda */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center bg-slate-900/40 p-2 rounded-lg border border-slate-800">
        <div className="flex space-x-2 mb-4 md:mb-0 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab("alerts")}
            className={`px-6 py-2 rounded-md font-semibold transition-all ${
              activeTab === "alerts" 
              ? "bg-teal-600 text-white shadow-lg shadow-teal-900/30" 
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            🛡️ WAF Alertas
          </button>
          <button 
            onClick={() => setActiveTab("audit")}
            className={`px-6 py-2 rounded-md font-semibold transition-all ${
              activeTab === "audit" 
              ? "bg-sky-600 text-white shadow-lg shadow-sky-900/30" 
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            📝 Auditoría (Logins)
          </button>
        </div>

        <input 
          type="text" 
          placeholder={activeTab === "alerts" ? "Buscar ataque o IP..." : "Buscar usuario o IP..."} 
          className="w-full md:w-1/3 p-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLA DE ALERTAS WAF */}
      {activeTab === "alerts" && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-2xl bg-slate-900/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-slate-800">Severidad</th>
                <th className="px-6 py-4 border-b border-slate-800">Fecha / Hora</th>
                <th className="px-6 py-4 border-b border-slate-800">Tipo de Evento</th>
                <th className="px-6 py-4 border-b border-slate-800">IP Origen</th>
                <th className="px-6 py-4 border-b border-slate-800">Descripción / Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Sin telemetría reciente. El perímetro está seguro.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert, index) => (
                  <tr key={index} className="transition-all duration-200 hover:bg-slate-800/80">
                    <td className="px-6 py-4 font-bold">
                      <span className={`px-3 py-1 rounded-full border text-[11px] uppercase tracking-wider ${
                        alert.severity === "CRITICAL" ? "border-red-500/50 text-red-400 bg-red-500/10" :
                        alert.severity === "HIGH" ? "border-orange-500/50 text-orange-400 bg-orange-500/10" :
                        "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">{formatDateTime(alert.detected_at || alert.created_at)}</td>
                    <td className="px-6 py-4 font-medium text-teal-400">{alert.event_type}</td>
                    <td className="px-6 py-4 font-mono text-slate-300">{alert.source_ip}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs leading-relaxed">{alert.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLA DE AUDITORÍA (LOGINS) */}
      {activeTab === "audit" && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-2xl bg-slate-900/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-slate-800">ID</th>
                <th className="px-6 py-4 border-b border-slate-800">Fecha / Hora</th>
                <th className="px-6 py-4 border-b border-slate-800">Usuario</th>
                <th className="px-6 py-4 border-b border-slate-800">IP de Conexión</th>
                <th className="px-6 py-4 border-b border-slate-800">Estado de Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAudit.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No hay registros de auditoría disponibles.
                  </td>
                </tr>
              ) : (
                filteredAudit.map((log, index) => (
                  <tr key={index} className="transition-all duration-200 hover:bg-slate-800/80">
                    <td className="px-6 py-4 font-mono text-slate-400 text-xs">#{log.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">{formatDateTime(log.detected_at || log.created_at)}</td>
                    <td className="px-6 py-4 font-medium text-sky-400">{log.username || "Desconocido"}</td>
                    <td className="px-6 py-4 font-mono text-slate-300">{log.ip_address}</td>
                    <td className="px-6 py-4 font-bold">
                      <span className={`px-3 py-1 rounded-full border text-[11px] uppercase tracking-wider ${
                        log.status === "SUCCESS" 
                        ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" 
                        : "border-red-500/50 text-red-400 bg-red-500/10"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
