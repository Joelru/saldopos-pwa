import React, { useState } from 'react';
import { Lock, Delete, Store, AlertCircle } from 'lucide-react';
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
        // Ignorar si no soporta vibración
      }
    }
  };

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= 4 || isVerifying) return;
    triggerHaptic();

    const newPin = pin + digit;
    setPin(newPin);
    setErrorMessage(null);

    if (newPin.length === 4) {
      setIsVerifying(true);
      const result = await unlockWithPin(newPin);
      setIsVerifying(false);

      if (!result.success) {
        setIsShaking(true);
        setErrorMessage(result.error || 'PIN Incorrecto. Intenta de nuevo.');
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

  return (
    <div className="min-h-screen bg-cloud-bg flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn">
      <div className="bg-white border border-cloud-border w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-pos-lg space-y-6 text-center">
        {/* Cabecera del Negocio */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-brand-light border border-brand-pastel flex items-center justify-center mx-auto text-brand shadow-sm">
            {negocio.logo_url ? (
              <img
                src={negocio.logo_url}
                alt={negocio.nombre_local}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <Store className="w-8 h-8 text-brand" />
            )}
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-slate-heading tracking-tight">
              {negocio.nombre_local}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1 font-medium">
              <Lock className="w-3.5 h-3.5 text-brand" />
              <span>Digita tu PIN de 4 números para entrar</span>
            </p>
          </div>

          {/* Indicador de 4 Círculos de PIN */}
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
                        : 'bg-slate-100 border-slate-300 scale-100'
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

        {/* Teclado Numérico Grande y Cómodo */}
        <div className="w-full max-w-[280px] mx-auto">
          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                disabled={isVerifying}
                className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-heading text-2xl font-black font-mono shadow-xs active:scale-95 active:bg-brand-pastel transition-all flex items-center justify-center"
              >
                {num}
              </button>
            ))}

            {/* Borrar Todo */}
            <button
              onClick={handleClear}
              disabled={isVerifying || pin.length === 0}
              className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs font-extrabold uppercase shadow-xs active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center"
            >
              Borrar
            </button>

            {/* Cero */}
            <button
              onClick={() => handleKeyPress('0')}
              disabled={isVerifying}
              className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-heading text-2xl font-black font-mono shadow-xs active:scale-95 active:bg-brand-pastel transition-all flex items-center justify-center"
            >
              0
            </button>

            {/* Retroceso */}
            <button
              onClick={handleDelete}
              disabled={isVerifying || pin.length === 0}
              className="h-14 sm:h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 shadow-xs active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Pie de pantalla */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              if (confirm('¿Deseas salir de esta tienda en este dispositivo?')) {
                logoutShop();
              }
            }}
            className="text-xs text-slate-400 hover:text-slate-600 underline font-medium"
          >
            Cambiar de tienda o salir
          </button>
        </div>
      </div>
    </div>
  );
};
