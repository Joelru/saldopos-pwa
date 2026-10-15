import { useState } from 'react';
import { 
  CreditCard, 
  Lock, 
  Receipt, 
  Users, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  Smartphone,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from './lib/formatters';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'flow'>('overview');

  return (
    <div className="min-h-screen bg-cloud-bg text-slate-heading flex flex-col max-w-md mx-auto shadow-2xl border-x border-cloud-border">
      {/* Topbar estilo Datáfono / Nequi */}
      <header className="bg-white border-b border-cloud-border px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white shadow-md">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base tracking-tight text-slate-heading leading-tight">
                SaldoPOS
              </h1>
              <span className="text-[10px] font-semibold bg-brand-pastel text-brand-dark px-1.5 py-0.5 rounded-full">
                BETA
              </span>
            </div>
            <p className="text-xs text-slate-muted">Datáfono Digital de Abonos</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-medium text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>PIN Cajero</span>
          <Lock className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
        {/* Banner de Bienvenida y Estado Arquitectónico */}
        <div className="bg-gradient-to-br from-brand/10 via-brand-pastel/20 to-transparent border border-brand/20 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-brand text-white shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-heading">
                Arquitectura Inicial Inicializada
              </h2>
              <p className="text-xs text-slate-muted mt-0.5 leading-relaxed">
                Micro-SaaS B2B para cobro en mostrador. Velocidad de datáfono (<span className="font-semibold text-brand">5 seg</span>) y tirilla térmica para WhatsApp sin costo de API.
              </p>
            </div>
          </div>
        </div>

        {/* Métrica Rápida de Caja (Preview de Dashboard) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-cloud-border rounded-2xl p-3.5 shadow-pos">
            <div className="flex items-center justify-between text-slate-muted mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Recibido Hoy</span>
              <div className="p-1 rounded-lg bg-emerald-50 text-semantic-abono">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-semantic-abono font-mono tracking-tight">
              {formatCurrency(145000)}
            </div>
            <div className="text-[10px] text-slate-muted mt-1 flex items-center justify-between">
              <span>Efectivo: <b>{formatCurrency(85000)}</b></span>
              <span>Transf: <b>{formatCurrency(60000)}</b></span>
            </div>
          </div>

          <div className="bg-white border border-cloud-border rounded-2xl p-3.5 shadow-pos">
            <div className="flex items-center justify-between text-slate-muted mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Por Cobrar</span>
              <div className="p-1 rounded-lg bg-amber-50 text-semantic-cargo">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-heading font-mono tracking-tight">
              {formatCurrency(1280000)}
            </div>
            <div className="text-[10px] text-slate-muted mt-1">
              <span>18 clientes activos</span>
            </div>
          </div>
        </div>

        {/* Selector de Pestaña para Demostración de Flujo */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-slate-heading shadow-sm'
                : 'text-slate-muted hover:text-slate-heading'
            }`}
          >
            Módulos del Sistema
          </button>
          <button
            onClick={() => setActiveTab('flow')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'flow'
                ? 'bg-white text-slate-heading shadow-sm'
                : 'text-slate-muted hover:text-slate-heading'
            }`}
          >
            Lógica Dual & Seguridad
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-3">
            <div className="bg-white border border-cloud-border rounded-2xl p-4 shadow-pos space-y-3">
              <h3 className="text-xs font-bold text-slate-muted uppercase tracking-wider">
                Las 4 Vistas Nucleares
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-heading">1. Teclado de Bloqueo PIN</p>
                    <p className="text-[11px] text-slate-muted truncate">PIN 4 dígitos (Cajero vs. Maestro) y WebAuthn</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-heading">2. Buscador de Caja en Mostrador</p>
                    <p className="text-[11px] text-slate-muted truncate">Búsqueda reactiva instantánea por cliente o cédula</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-heading">3. Ficha con Píldoras de Abono</p>
                    <p className="text-[11px] text-slate-muted truncate">Abono en 1 toque ($10k, $20k, Todo el saldo)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-heading">4. Tirilla Térmica WhatsApp</p>
                    <p className="text-[11px] text-slate-muted truncate">Renderizado Canvas PNG + Share directo ($0 API)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white border border-cloud-border rounded-2xl p-4 shadow-pos space-y-3">
              <h3 className="text-xs font-bold text-slate-muted uppercase tracking-wider">
                Reglas de Negocio en Base de Datos
              </h3>

              <div className="space-y-2">
                <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50">
                  <span className="text-xs font-bold text-blue-900 block">Plan Separe (Decreciente)</span>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Total $120.000 ➔ Abono $40.000 ➔ Nuevo Saldo $80.000 hasta liquidar en $0.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-amber-100 bg-amber-50/50">
                  <span className="text-xs font-bold text-amber-900 block">Fiado / Cuenta Abierta</span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Saldo $0 ➔ (+ Cargo) mercadería a crédito ➔ (- Abono) pagos parciales.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50">
                  <span className="text-xs font-bold text-emerald-900 block">Inmutabilidad Auditada</span>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Cero borrado físico. Las correcciones generan un movimiento de anulación autorizado por el Dueño.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de Certificación de Arquitectura */}
        <div className="bg-white border border-cloud-border rounded-2xl p-4 shadow-pos">
          <div className="flex items-center gap-2 mb-2 text-emerald-700">
            <ShieldCheck className="w-5 h-5 text-semantic-abono" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Verificación de Setup</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-semantic-abono" />
              <span>React 18 + TS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-semantic-abono" />
              <span>Tailwind Tokens</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-semantic-abono" />
              <span>Supabase Client</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-semantic-abono" />
              <span>PWA Ready</span>
            </div>
          </div>
        </div>
      </main>

      {/* Dock Inferior */}
      <footer className="bg-white border-t border-cloud-border p-3 text-center text-xs text-slate-muted">
        <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Diseñado para pantalla táctil en mostrador</span>
        </div>
      </footer>
    </div>
  );
}
