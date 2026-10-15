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
import { StoreSettingsModal } from './features/settings/StoreSettingsModal';

function PosMainContent() {
  const { negocio, currentRole, lockNow, logoutShop } = usePinAuth();
  const [activeReceipt, setActiveReceipt] = useState<{ movimiento: Movimiento; cuenta: Cuenta } | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/40 via-slate-50 to-slate-100 text-slate-heading flex flex-col font-sans">
      {/* Topbar Adaptable a Portátiles y Celulares */}
      <header className="bg-white/90 backdrop-blur-md border-b border-sky-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white shadow-md shadow-brand/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-heading leading-tight truncate max-w-[200px] sm:max-w-sm">
                  {negocio.nombre_local}
                </h1>
                {negocio.id === '00000000-0000-0000-0000-000000000001' && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    Modo Prueba
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">Libreta de Abonos y Fiados</p>
            </div>
          </div>

          {/* Rol Activo & Menú */}
          <div className="flex items-center gap-2 relative">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              currentRole === 'DUENO'
                ? 'bg-blue-50 text-brand-dark border-brand-pastel'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${currentRole === 'DUENO' ? 'bg-brand' : 'bg-emerald-500'} animate-pulse`} />
              <span>{currentRole === 'DUENO' ? 'Dueño' : 'Cajero'}</span>
            </div>

            {/* Botón de Bloqueo Inmediato */}
            <button
              onClick={lockNow}
              title="Bloquear pantalla"
              className="p-2 rounded-xl border border-cloud-border text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Bloquear</span>
            </button>

            {/* Menú de Opciones */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(prev => !prev)}
                className="p-2 rounded-xl border border-cloud-border text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
                title="Ajustes de tienda"
              >
                <Settings className="w-4 h-4 text-slate-600" />
              </button>

              {showSettingsMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-cloud-border shadow-pos-lg rounded-2xl p-2 z-50 text-xs space-y-1 animate-fadeIn">
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      setIsSettingsModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ajustes de mi Tienda</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      lockNow();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span>Bloquear Pantalla</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      if (confirm('¿Deseas desvincular o salir de esta tienda en este dispositivo?')) {
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
        </div>
      </header>

      {/* Main Container Amplio para Portátil y Celular */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner de Comprobante Reciente (si se generó uno) */}
        {activeReceipt && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between animate-fadeIn shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-heading">
                  Abono registrado a #{activeReceipt.cuenta.consecutivo} ({activeReceipt.cuenta.nombre_cliente})
                </p>
                <p className="text-xs text-emerald-700">
                  Comprobante para enviar al cliente por WhatsApp
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsReceiptModalOpen(true)}
              className="text-xs font-bold bg-white border border-emerald-300 text-emerald-800 px-3.5 py-2 rounded-xl hover:bg-emerald-50 shadow-sm active:scale-95 transition-all"
            >
              Ver Comprobante
            </button>
          </div>
        )}

        <CashierDashboard onSelectReceipt={handleSelectReceipt} />
      </main>

      {/* Modal de Comprobante WhatsApp */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        negocio={negocio}
        cuenta={activeReceipt?.cuenta || null}
        movimiento={activeReceipt?.movimiento || null}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      {/* Modal de Ajustes de Tienda (Sistemas de crédito, datos y tirilla) */}
      <StoreSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Footer Limpio */}
      <footer className="bg-white border-t border-cloud-border py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-slate-500">
            <CreditCard className="w-4 h-4 text-brand" />
            <span>Control de Abonos, Plan Separe y Fiados</span>
          </div>

          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="py-1.5 px-3 rounded-xl bg-brand text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Instalar Aplicación en Pantalla de Inicio</span>
            </button>
          )}

          <p className="text-[11px]">Diseñado para operar rápido y sin complicaciones</p>
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
