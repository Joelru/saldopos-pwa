import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { usePinAuth } from '../auth-pin/PinAuthContext';

interface SetupPinModalProps {
  onSuccess: () => void;
}

export const SetupPinModal: React.FC<SetupPinModalProps> = ({ onSuccess }) => {
  const { negocio, completePinSetup } = usePinAuth();
  const [pinDueno, setPinDueno] = useState('');
  const [confirmPinDueno, setConfirmPinDueno] = useState('');
  const [pinCajero, setPinCajero] = useState('4321');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinDueno.length !== 4 || !/^\d{4}$/.test(pinDueno)) {
      return setError('Tu PIN de Dueño debe tener exactamente 4 dígitos numéricos.');
    }
    if (pinDueno !== confirmPinDueno) {
      return setError('Los dos PINs ingresados no coinciden. Verifícalos.');
    }
    if (pinCajero.length !== 4 || !/^\d{4}$/.test(pinCajero)) {
      return setError('El PIN de Cajero debe tener exactamente 4 dígitos numéricos.');
    }
    if (pinDueno === pinCajero) {
      return setError('Por seguridad, el PIN de Dueño y el PIN de Cajero no deben ser idénticos.');
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await completePinSetup(pinDueno, pinCajero);
      if (!res.success) {
        setError(res.error || 'Error guardando tus PINs.');
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 border border-cloud-border shadow-2xl space-y-6">
        {/* Encabezado en Grande */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto shadow-sm">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-heading tracking-tight">
            Crea tu PIN Maestro de 4 Dígitos
          </h2>
          <div className="p-3 bg-brand-light rounded-2xl border border-brand-pastel text-xs text-brand-dark leading-relaxed font-medium">
            <span className="font-extrabold block text-sm mb-0.5 text-brand-navy">
              ¿Para qué sirve este PIN?
            </span>
            Es tu llave de seguridad como <strong>Dueño</strong>. La usarás cada día para desbloquear el datáfono, revisar la cartera por cobrar y autorizar anulaciones.
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-semantic-anulacion font-medium flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN de Dueño */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              1. Tu PIN de Dueño (4 Dígitos) *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              autoFocus
              placeholder="••••"
              value={pinDueno}
              onChange={e => setPinDueno(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full text-center py-3 rounded-xl border border-cloud-border text-2xl font-mono font-black tracking-[0.5em] focus:outline-none focus:border-brand shadow-sm text-slate-heading"
            />
          </div>

          {/* Confirmar PIN */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              2. Confirma tu PIN de Dueño *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              placeholder="••••"
              value={confirmPinDueno}
              onChange={e => setConfirmPinDueno(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full text-center py-3 rounded-xl border border-cloud-border text-2xl font-mono font-black tracking-[0.5em] focus:outline-none focus:border-brand shadow-sm text-slate-heading"
            />
          </div>

          {/* PIN de Cajero (Preconfigurado en 4321) */}
          <div className="pt-2 border-t border-cloud-border">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                PIN de Cajero (Para tus empleados)
              </label>
              <span className="text-[10px] text-slate-400">Por defecto: 4321</span>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              placeholder="4321"
              value={pinCajero}
              onChange={e => setPinCajero(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-xl font-mono font-bold tracking-[0.4em] focus:outline-none focus:border-emerald-500 shadow-sm text-emerald-800 bg-emerald-50/40"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Tus cajeros usarán este PIN para registrar abonos y enviar tirillas sin ver tus números privados.
            </p>
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            disabled={isSubmitting || pinDueno.length !== 4 || confirmPinDueno.length !== 4}
            className="w-full py-3.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <span>Guardando PIN...</span>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Activar Datáfono de {negocio.nombre_local}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encriptado con SHA-256 en tu dispositivo</span>
        </div>
      </div>
    </div>
  );
};
