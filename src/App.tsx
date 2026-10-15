import { useState } from 'react';
import { 
  CreditCard, 
  Lock, 
  Receipt, 
  Users, 
  ArrowDownLeft, 
  ShieldCheck, 
  Smartphone,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatCurrency } from './lib/formatters';
import { PinAuthProvider, usePinAuth } from './features/auth-pin/PinAuthContext';
import { PinLockScreen } from './features/auth-pin/PinLockScreen';
import { MasterPinModal } from './features/auth-pin/MasterPinModal';

function PosMainContent() {
  const { negocio, currentRole, lockNow } = usePinAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'flow'>('overview');
  const [showSensitiveData, setShowSensitiveData] = useState<boolean>(currentRole === 'DUENO');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const handleToggleSensitiveData = () => {
    if (currentRole === 'DUENO') {
      setShowSensitiveData(prev => !prev);
    } else {
      // Si es cajero, solicitar PIN Maestro de Dueño
      setIsAuthModalOpen(true);
    }
  };

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
              <h1 className="font-bold text-sm tracking-tight text-slate-heading leading-tight truncate max-w-[160px]">
                {negocio.nombre_local}
              </h1>
            </div>
            <p className="text-[11px] text-slate-muted">Datáfono de Abonos</p>
          </div>
        </div>

        {/* Rol Activo & Botón Bloquear Terminal */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            currentRole === 'DUENO'
              ? 'bg-blue-50 text-brand-dark border-brand-pastel'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentRole === 'DUENO' ? 'bg-brand' : 'bg-emerald-500'} animate-pulse`} />
            <span>{currentRole === 'DUENO' ? 'Dueño' : 'Cajero'}</span>
          </div>

          <button
            onClick={lockNow}
            title="Bloquear Datáfono"
            className="p-1.5 rounded-xl border border-cloud-border text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
        {/* Banner de Estado de Sesión y Seguridad */}
        <div className="bg-white border border-cloud-border rounded-2xl p-3.5 shadow-pos flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-heading">Sesión Táctil Activa</p>
              <p className="text-[11px] text-slate-muted">Bloqueo por inactividad: 3 minutos</p>
            </div>
          </div>
          <button
            onClick={lockNow}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 active:scale-95 transition-all flex items-center gap-1"
          >
            <Lock className="w-3 h-3" />
            <span>Bloquear</span>
          </button>
        </div>

        {/* Métrica Rápida de Caja */}
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
              <button
                onClick={handleToggleSensitiveData}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                title="Ver/Ocultar con PIN Maestro"
              >
                {showSensitiveData ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-xl font-extrabold text-slate-heading font-mono tracking-tight">
              {showSensitiveData ? formatCurrency(1280000) : '••••••••'}
            </div>
            <div className="text-[10px] text-slate-muted mt-1 flex items-center justify-between">
              <span>{showSensitiveData ? '18 clientes activos' : 'Restringido a Dueño'}</span>
              {!showSensitiveData && (
                <span className="text-[9px] bg-amber-50 text-amber-700 font-semibold px-1 rounded">PIN</span>
              )}
            </div>
          </div>
        </div>

        {/* Selector de Pestaña */}
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
                Vistas y Flujos
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-heading">1. Teclado PIN Datáfono</p>
                    <p className="text-[11px] text-slate-muted truncate">PIN 4 dígitos (Cajero vs. Dueño) y auto-bloqueo</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Activo
                  </span>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-heading">2. Buscador de Caja en Mostrador</p>
                    <p className="text-[11px] text-slate-muted truncate">Búsqueda reactiva instantánea por cliente o cédula</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    Paso 5
                  </span>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-heading">3. Ficha con Píldoras de Abono</p>
                    <p className="text-[11px] text-slate-muted truncate">Abono en 1 toque ($10k, $20k, Todo el saldo)</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    Paso 5
                  </span>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-heading">4. Tirilla Térmica WhatsApp</p>
                    <p className="text-[11px] text-slate-muted truncate">Renderizado Canvas PNG + Share directo ($0 API)</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    Paso 6
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white border border-cloud-border rounded-2xl p-4 shadow-pos space-y-3">
              <h3 className="text-xs font-bold text-slate-muted uppercase tracking-wider">
                Control de Privilegios por PIN
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span>PIN Cajero (4321)</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">Operativo</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Solo permite buscar clientes, registrar abonos/cargos y compartir tirillas. No ve la cartera total ni puede anular.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50">
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span>PIN Dueño / Maestro (1234)</span>
                    <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">Total</span>
                  </div>
                  <p className="text-[11px] text-blue-700 mt-1">
                    Visualización de cartera total, configuración del comercio, arqueos consolidados y autorización de anulaciones auditadas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de PIN Maestro */}
        <MasterPinModal
          isOpen={isAuthModalOpen}
          title="Autorización de Cartera"
          description="Ingrese el PIN Maestro de Dueño para desbloquear la visualización del total de la cartera."
          onSuccess={() => {
            setIsAuthModalOpen(false);
            setShowSensitiveData(true);
          }}
          onCancel={() => setIsAuthModalOpen(false)}
        />
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

export default function App() {
  return (
    <PinAuthProvider>
      <AppRoot />
    </PinAuthProvider>
  );
}

function AppRoot() {
  const { isLocked } = usePinAuth();

  if (isLocked) {
    return <PinLockScreen />;
  }

  return <PosMainContent />;
}
