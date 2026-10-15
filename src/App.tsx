import { useState } from 'react';
import { 
  CreditCard, 
  Smartphone,
  LogOut,
  Receipt
} from 'lucide-react';
import { Cuenta, Movimiento } from './types/database';
import { PinAuthProvider, usePinAuth } from './features/auth-pin/PinAuthContext';
import { PinLockScreen } from './features/auth-pin/PinLockScreen';
import { CashierDashboard } from './features/cashier/CashierDashboard';

function PosMainContent() {
  const { negocio, currentRole, lockNow } = usePinAuth();
  const [activeReceipt, setActiveReceipt] = useState<{ movimiento: Movimiento; cuenta: Cuenta } | null>(null);

  const handleSelectReceipt = (movimiento: Movimiento, cuenta: Cuenta) => {
    setActiveReceipt({ movimiento, cuenta });
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
              <h1 className="font-bold text-sm tracking-tight text-slate-heading leading-tight truncate max-w-[170px]">
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

      {/* Main Container: Dashboard Operativo de Mostrador */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
        {/* Banner de Comprobante Reciente (si se acaba de generar uno) */}
        {activeReceipt && (
          <div className="bg-brand/10 border border-brand/30 rounded-2xl p-3 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand text-white shadow-sm">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-heading">
                  Último Abono: #{activeReceipt.cuenta.consecutivo} ({activeReceipt.cuenta.nombre_cliente})
                </p>
                <p className="text-[10px] text-slate-500">
                  Listo para compartir por WhatsApp
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveReceipt(null)}
              className="text-xs font-bold text-brand hover:underline px-2 py-1"
            >
              Cerrar
            </button>
          </div>
        )}

        <CashierDashboard onSelectReceipt={handleSelectReceipt} />
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
