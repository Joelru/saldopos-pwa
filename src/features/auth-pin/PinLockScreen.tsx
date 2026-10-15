import React, { useState } from 'react';
import { Lock, Delete, Store, ShieldCheck, Fingerprint, AlertCircle } from 'lucide-react';
import { usePinAuth } from './PinAuthContext';

export const PinLockScreen: React.FC = () => {
  const { negocio, unlockWithPin, logoutShop } = usePinAuth();
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // Ignorar si el navegador no permite vibración
      }
    }
  };

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= 4 || isVerifying) return;
    triggerHaptic();

    const newPin = pin + digit;
    setPin(newPin);
    setErrorMessage(null);

    // Si completa los 4 dígitos, validar inmediatamente
    if (newPin.length === 4) {
      setIsVerifying(true);
      const result = await unlockWithPin(newPin);
      setIsVerifying(false);

      if (!result.success) {
        setIsShaking(true);
        setErrorMessage(result.error || 'PIN Incorrecto');
        triggerHaptic();
        setTimeout(() => {
          setPin('');
          setIsShaking(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic();
    setPin(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    triggerHaptic();
    setPin('');
    setErrorMessage(null);
  };

  // Atajos rápidos para demostración en un clic
  const handleQuickDemo = (demoPin: string) => {
    setPin(demoPin);
    setTimeout(async () => {
      await unlockWithPin(demoPin);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-cloud-bg flex flex-col justify-between max-w-md mx-auto p-6 select-none animate-fadeIn">
      {/* Header del Negocio */}
      <div className="text-center pt-4 space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-cloud-border shadow-pos p-1 mx-auto">
          {negocio.logo_url ? (
            <img
              src={negocio.logo_url}
              alt={negocio.nombre_local}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <Store className="w-8 h-8 text-brand" />
          )}
        </div>

        <div>
          <h1 className="text-lg font-bold text-slate-heading tracking-tight">
            {negocio.nombre_local}
          </h1>
          <p className="text-xs text-slate-muted flex items-center justify-center gap-1 mt-0.5">
            <Lock className="w-3 h-3 text-brand" />
            <span>Terminal Bloqueada por Seguridad</span>
          </p>
        </div>

        {/* Indicador de 4 Dígitos */}
        <div className="pt-2">
          <div
            className={`flex justify-center items-center gap-4 py-2 transition-transform ${
              isShaking ? 'animate-bounce text-semantic-anulacion' : ''
            }`}
          >
            {[0, 1, 2, 3].map(index => {
              const filled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                    filled
                      ? 'bg-brand border-brand scale-110 shadow-sm'
                      : 'bg-white border-slate-300 scale-100'
                  }`}
                />
              );
            })}
          </div>

          {errorMessage && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-semantic-anulacion font-medium mt-1 animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Teclado Numérico Estilo Datáfono */}
      <div className="w-full max-w-xs mx-auto py-2">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={isVerifying}
              className="h-16 rounded-2xl bg-white border border-cloud-border text-slate-heading text-2xl font-bold font-mono shadow-pos hover:bg-slate-50 active:scale-95 active:bg-brand-pastel/30 transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          {/* Botón Borrar Todo */}
          <button
            onClick={handleClear}
            disabled={isVerifying || pin.length === 0}
            className="h-16 rounded-2xl bg-white border border-cloud-border text-slate-muted text-xs font-bold uppercase tracking-wider shadow-pos hover:bg-slate-50 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center"
          >
            C
          </button>

          {/* Botón Cero */}
          <button
            onClick={() => handleKeyPress('0')}
            disabled={isVerifying}
            className="h-16 rounded-2xl bg-white border border-cloud-border text-slate-heading text-2xl font-bold font-mono shadow-pos hover:bg-slate-50 active:scale-95 active:bg-brand-pastel/30 transition-all flex items-center justify-center"
          >
            0
          </button>

          {/* Botón Retroceso (Backspace) */}
          <button
            onClick={handleDelete}
            disabled={isVerifying || pin.length === 0}
            className="h-16 rounded-2xl bg-white border border-cloud-border text-slate-heading shadow-pos hover:bg-slate-50 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center"
          >
            <Delete className="w-6 h-6 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Footer y Píldoras de Acceso Rápido para Pruebas */}
      <div className="space-y-3 pt-2">
        <div className="bg-slate-100/80 rounded-xl p-2.5 border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-1.5 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            <span>PINs de Acceso Rápido</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo('1234')}
              className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:border-brand active:scale-95 transition-all text-center"
            >
              <span className="font-bold text-brand">1234</span>
              <span className="text-[10px] text-slate-400 block">Dueño (Maestro)</span>
            </button>
            <button
              onClick={() => handleQuickDemo('4321')}
              className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:border-brand active:scale-95 transition-all text-center"
            >
              <span className="font-bold text-emerald-600">4321</span>
              <span className="text-[10px] text-slate-400 block">Cajero (Operativo)</span>
            </button>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-1">
            <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
            <span>Bloqueo automático tras 3 minutos sin uso</span>
          </div>
          <button
            onClick={logoutShop}
            className="text-[11px] text-slate-400 hover:text-slate-600 underline pt-1"
          >
            Cambiar de Tienda o Salir al Inicio
          </button>
        </div>
      </div>
    </div>
  );
};
