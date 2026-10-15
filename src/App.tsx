import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  LogOut, 
  Receipt,
  Settings
} from 'lucide-react';
import { Cuenta, Movimiento } from './types/database';
import { PinAuthProvider, usePinAuth } from './features/auth-pin/PinAuthContext';
import { PinLockScreen } from './features/auth-pin/PinLockScreen';
import { CashierDashboard } from './features/cashier/CashierDashboard';
import { ReceiptModal } from './features/receipt/ReceiptModal';
import { LandingPage } from './features/landing/LandingPage';
import { AuthModal } from './features/auth/AuthModal';
import { SetupPinModal } from './features/auth/SetupPinModal';

function PosMainContent() {
  const { negocio, currentRole, lockNow, logoutShop } = usePinAuth();
  const [activeReceipt, setActiveReceipt] = useState<{ movimiento: Movimiento; cuenta: Cuenta } | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Escuchar evento de instalación PWA
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleSelectReceipt = (movimiento: Movimiento, cuenta: Cuenta) => {
    setActiveReceipt({ movimiento, cuenta });
    setIsReceiptModalOpen(true);
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
              <h1 className="font-bold text-sm tracking-tight text-slate-heading leading-tight truncate max-w-[150px]">
                {negocio.nombre_local}
              </h1>
            </div>
            <p className="text-[11px] text-slate-muted">Datáfono de Abonos</p>
          </div>
        </div>

        {/* Rol Activo & Botones de Acción */}
        <div className="flex items-center gap-1.5 relative">
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            currentRole === 'DUENO'
              ? 'bg-blue-50 text-brand-dark border-brand-pastel'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentRole === 'DUENO' ? 'bg-brand' : 'bg-emerald-500'} animate-pulse`} />
            <span>{currentRole === 'DUENO' ? 'Dueño' : 'Cajero'}</span>
          </div>

          {/* Menú Rápido de Opciones */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(prev => !prev)}
              className="p-1.5 rounded-xl border border-cloud-border text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
              title="Opciones del Datáfono"
            >
              <Settings className="w-4 h-4 text-slate-600" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 top-10 w-48 bg-white border border-cloud-border shadow-pos-lg rounded-2xl p-2 z-50 text-xs space-y-1 animate-fadeIn">
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    lockNow();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bloquear Datáfono</span>
                </button>
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    if (confirm('¿Deseas desvincular esta tienda de este dispositivo?')) {
                      logoutShop();
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 font-semibold text-semantic-anulacion flex items-center gap-2"
                >
                  <span>Cerrar Sesión Tienda</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
        {/* Banner de Comprobante Reciente */}
        {activeReceipt && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-heading">
                  Último Abono: #{activeReceipt.cuenta.consecutivo} ({activeReceipt.cuenta.nombre_cliente})
                </p>
                <p className="text-[10px] text-emerald-700 font-medium">
                  Comprobante digital listo
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsReceiptModalOpen(true)}
              className="text-xs font-bold bg-white border border-emerald-300 text-emerald-800 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 shadow-sm active:scale-95 transition-all"
            >
              Ver Tirilla
            </button>
          </div>
        )}

        <CashierDashboard onSelectReceipt={handleSelectReceipt} />
      </main>

      {/* Modal de Tirilla Térmica WhatsApp */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        negocio={negocio}
        cuenta={activeReceipt?.cuenta || null}
        movimiento={activeReceipt?.movimiento || null}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      {/* Dock Inferior con botón de instalación PWA */}
      <footer className="bg-white border-t border-cloud-border p-3 text-center text-xs text-slate-muted space-y-2">
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="w-full py-2 px-3 rounded-xl bg-brand text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <Smartphone className="w-4 h-4" />
            <span>Instalar Datáfono en Pantalla de Inicio</span>
          </button>
        )}
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
  const { isAuthenticated, needsPinSetup, isLocked } = usePinAuth();
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login' | null>(null);

  // 1. Si no hay tienda vinculada, mostrar Landing Page comercial
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage onOpenAuth={(mode) => setAuthModalMode(mode)} />
        <AuthModal
          isOpen={Boolean(authModalMode)}
          initialMode={authModalMode || 'register'}
          onClose={() => setAuthModalMode(null)}
          onSuccess={() => setAuthModalMode(null)}
        />
      </>
    );
  }

  // 2. Si la tienda fue registrada pero aún no ha configurado su PIN Maestro
  if (needsPinSetup) {
    return <SetupPinModal onSuccess={() => {}} />;
  }

  // 3. Si la terminal está bloqueada por inactividad o seguridad
  if (isLocked) {
    return <PinLockScreen />;
  }

  // 4. Operación del mostrador
  return <PosMainContent />;
}
