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

  const isDemo = negocio.id === '00000000-0000-0000-0000-000000000001';

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= 4 || isVerifying) return;
    triggerHaptic();

    const newPin = pin + digit;
    setPin(newPin);
    setErrorMessage(null);

    if (newPin.length === 4) {
      setIsVerifying(true);
      try {
        const result = await unlockWithPin(newPin);
        if (!result.success) {
          setIsShaking(true);
          setErrorMessage(
            isDemo 
              ? 'PIN incorrecto. Para esta prueba ingresa 1234 (Dueño).' 
              : (result.error || 'PIN Incorrecto. Intenta de nuevo.')
          );
          triggerHaptic();
          setTimeout(() => {
            setPin('');
            setIsShaking(false);
          }, 600);
        }
      } catch (err) {
        console.error('Error verificando PIN:', err);
        setErrorMessage('Error al validar el PIN. Intenta nuevamente.');
      } finally {
        setIsVerifying(false);
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

  // Autollenar para pruebas
  const autoFillPin = async (demoPin: string) => {
    setPin(demoPin);
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const result = await unlockWithPin(demoPin);
      if (!result.success) {
        setErrorMessage(
          isDemo 
            ? 'PIN incorrecto. Para esta prueba el PIN es 1234.' 
            : (result.error || 'Error al validar PIN')
        );
      }
    } catch (err) {
      console.error('Error en autoFillPin:', err);
      setErrorMessage('Error al desbloquear con PIN de prueba');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-indigo-950 flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn relative overflow-hidden">
      {/* Luz ambiental decorativa de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-brand/25 to-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-slate-900/90 border border-slate-800/80 w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5 text-center text-white relative z-10">
        {/* Cabecera del Negocio */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-dark border border-sky-400/30 flex items-center justify-center mx-auto text-white shadow-lg shadow-brand/30">
            {negocio.logo_url ? (
              <img
                src={negocio.logo_url}
                alt={negocio.nombre_local}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <Store className="w-8 h-8 text-white" />
            )}
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {negocio.nombre_local}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1 font-medium">
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              <span>Digita tu PIN de 4 números para entrar</span>
            </p>
          </div>

          {/* Indicador de 4 Círculos de PIN */}
          <div className="pt-2">
            <div
              className={`flex justify-center items-center gap-4 py-2 transition-transform ${
                isShaking ? 'animate-bounce text-rose-400' : ''
              }`}
            >
              {[0, 1, 2, 3].map(index => {
                const filled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                      filled
                        ? 'bg-sky-400 border-sky-300 scale-110 shadow-lg shadow-sky-400/50'
                        : 'bg-slate-800 border-slate-700 scale-100'
                    }`}
                  />
                );
              })}
            </div>

            {errorMessage && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-medium mt-1 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Banner Explícito de Prueba de la Plataforma */}
        {isDemo ? (
          <div className="bg-sky-950/80 border-2 border-sky-400/70 rounded-2xl p-3.5 text-center space-y-2 shadow-lg animate-fadeIn">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-300 text-[10px] font-black uppercase tracking-wider border border-sky-400/40">
              <span>💡 Prueba de Bloqueo</span>
            </div>
            <p className="text-xs text-sky-100 leading-snug">
              Para esta prueba el PIN es <strong className="text-sky-300 text-sm font-mono font-black underline bg-sky-900/90 px-2 py-0.5 rounded-lg border border-sky-400/50">1234</strong>.
            </p>
            <p className="text-[11px] text-slate-300 leading-tight">
              Ingrésalo abajo o toca el botón para volver exactamente al mostrador donde estabas.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => autoFillPin('1234')}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-brand to-sky-500 hover:from-brand-hover hover:to-sky-600 text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>⚡ Digitar PIN 1234 y Desbloquear</span>
              </button>
            </div>
            <div className="text-[10px] text-slate-400 pt-0.5">
              (O probar como Cajero: <button type="button" onClick={() => autoFillPin('4321')} className="text-emerald-400 font-bold underline">4321</button>)
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Ingresa tu clave de 4 dígitos para continuar
          </p>
        )}

        {/* Teclado Numérico Grande y Cómodo */}
        <div className="w-full max-w-[280px] mx-auto">
          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                disabled={isVerifying}
                className="h-14 sm:h-16 rounded-2xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-white text-2xl font-black font-mono shadow-xs active:scale-95 active:bg-brand transition-all flex items-center justify-center"
              >
                {num}
              </button>
            ))}

            {/* Borrar Todo */}
            <button
              onClick={handleClear}
              disabled={isVerifying || pin.length === 0}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/80 text-slate-400 text-xs font-extrabold uppercase shadow-xs active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center"
            >
              Borrar
            </button>

            {/* Cero */}
            <button
              onClick={() => handleKeyPress('0')}
              disabled={isVerifying}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-white text-2xl font-black font-mono shadow-xs active:scale-95 active:bg-brand transition-all flex items-center justify-center"
            >
              0
            </button>

            {/* Retroceso */}
            <button
              onClick={handleDelete}
              disabled={isVerifying || pin.length === 0}
              className="h-14 sm:h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 shadow-xs active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Pie de pantalla */}
        <div className="pt-2 border-t border-slate-800 space-y-1.5">
          <button
            onClick={() => {
              if (confirm('¿Deseas salir de esta tienda en este dispositivo?')) {
                logoutShop();
              }
            }}
            className="text-xs text-slate-400 hover:text-slate-200 underline font-medium block mx-auto"
          >
            Cambiar de tienda o salir
          </button>
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
            Kora — Control de Cartera
          </p>
        </div>
      </div>
    </div>
  );
};
