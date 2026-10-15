import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  LogOut, 
  Receipt,
  Settings,
  Menu,
  X,
  Lock,
  ChevronRight
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      {/* Topbar Adaptable a Portátiles y Celulares con Menú Hamburguesa */}
      <header className="bg-white/95 backdrop-blur-md border-b border-sky-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo y Nombre del Comercio (Truncado dinámico sin desbordar margen) */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white shadow-md shadow-brand/20 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-heading leading-tight truncate">
                  {negocio.nombre_local}
                </h1>
                {negocio.id === '00000000-0000-0000-0000-000000000001' && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                    Modo Prueba
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">
                Libreta de Abonos y Fiados
              </p>
            </div>
          </div>

          {/* Versión Escritorio / Portátil (>= 640px) */}
          <div className="hidden sm:flex items-center gap-2 relative">
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
              className="p-2 rounded-xl border border-cloud-border text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Bloquear</span>
            </button>

            {/* Menú de Opciones en Escritorio */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(prev => !prev)}
                className="p-2 rounded-xl border border-cloud-border text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
                title="Ajustes de tienda"
              >
                <Settings className="w-4 h-4 text-slate-600" />
              </button>

              {showSettingsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSettingsMenu(false)}
                  />
                  <div className="absolute right-0 top-12 w-60 bg-white border border-cloud-border shadow-pos-lg rounded-2xl p-2 z-50 text-xs space-y-1 animate-fadeIn">
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setIsSettingsModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2.5 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-brand flex items-center justify-center">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Ajustes de mi Tienda</div>
                        <div className="text-[10px] text-slate-400">Separe, Fiado y datos</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        lockNow();
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2.5 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Bloquear Pantalla</div>
                        <div className="text-[10px] text-slate-400">Pedir PIN de 4 dígitos</div>
                      </div>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        if (confirm('¿Deseas desvincular o salir de esta tienda en este dispositivo?')) {
                          logoutShop();
                        }
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-50 font-semibold text-semantic-anulacion flex items-center gap-2.5 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                        <LogOut className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-rose-600">Cerrar Sesión Tienda</div>
                        <div className="text-[10px] text-rose-400">Salir de esta cuenta</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Versión Móvil: Botón Hamburguesa (< 640px) */}
          <div className="flex sm:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label="Abrir menú"
              className="p-2.5 rounded-xl border border-cloud-border text-slate-700 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-800" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" />
              )}
            </button>
          </div>
        </div>

        {/* Menú Desplegable Móvil (Hamburguesa) */}
        {isMobileMenuOpen && (
          <>
            {/* Fondo oscuro para cerrar al tocar fuera */}
            <div
              className="fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-xs z-40 sm:hidden animate-fadeIn"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Panel Desplegable Móvil */}
            <div className="absolute top-16 left-0 right-0 bg-white border-b border-cloud-border shadow-pos-lg z-50 p-4 space-y-3 sm:hidden animate-fadeIn">
              {/* Info de la Tienda y Rol Actual */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="min-w-0 flex-1 mr-2">
                  <div className="font-extrabold text-sm text-slate-heading truncate">
                    {negocio.nombre_local}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {negocio.telefono}
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                  currentRole === 'DUENO'
                    ? 'bg-blue-50 text-brand-dark border-brand-pastel'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${currentRole === 'DUENO' ? 'bg-brand' : 'bg-emerald-500'} animate-pulse`} />
                  <span>Modo {currentRole === 'DUENO' ? 'Dueño' : 'Cajero'}</span>
                </div>
              </div>

              {/* Botón 1: Ajustes de mi Tienda */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSettingsModalOpen(true);
                }}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-left flex items-center justify-between transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-heading block">
                      Ajustes de mi Tienda
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Activar/desactivar Separe, Fiado y datos
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* Botón 2: Bloquear Pantalla */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  lockNow();
                }}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-200 text-left flex items-center justify-between transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-heading block">
                      Bloquear Pantalla
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Pedir PIN de 4 dígitos para volver a entrar
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* Botón 3: Instalar App (si está disponible) */}
              {deferredPrompt && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleInstallClick();
                  }}
                  className="w-full p-3 rounded-2xl bg-brand/5 hover:bg-brand/10 border border-brand-pastel text-left flex items-center justify-between transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-brand-dark block">
                        Instalar en Pantalla de Inicio
                      </span>
                      <span className="text-xs text-slate-500 block">
                        Usar como aplicación directa en el celular
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand shrink-0" />
                </button>
              )}

              {/* Botón 4: Cerrar Sesión Tienda */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (confirm('¿Deseas desvincular o cerrar sesión de esta tienda en este celular?')) {
                    logoutShop();
                  }
                }}
                className="w-full p-3 rounded-2xl bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200 text-left flex items-center justify-between transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-rose-700 block">
                      Cerrar Sesión Tienda
                    </span>
                    <span className="text-xs text-rose-500 block">
                      Desvincular del dispositivo
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
              </button>
            </div>
          </>
        )}
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
