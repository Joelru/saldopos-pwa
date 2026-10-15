import React, { useState } from 'react';
import { ShieldAlert, X, Check, Delete } from 'lucide-react';
import { usePinAuth } from './PinAuthContext';

interface MasterPinModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MasterPinModal: React.FC<MasterPinModalProps> = ({
  isOpen,
  title,
  description,
  onSuccess,
  onCancel,
}) => {
  const { verifyMasterPin } = usePinAuth();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDigit = async (d: string) => {
    if (pin.length >= 4 || isVerifying) return;
    const nextPin = pin + d;
    setPin(nextPin);
    setError(null);

    if (nextPin.length === 4) {
      setIsVerifying(true);
      const isValid = await verifyMasterPin(nextPin);
      setIsVerifying(false);

      if (isValid) {
        setPin('');
        onSuccess();
      } else {
        setError('PIN Maestro Incorrecto');
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-5 border border-cloud-border shadow-pos-lg space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-semantic-anulacionLight text-semantic-anulacion">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-heading">{title}</h3>
              <p className="text-xs text-slate-muted">{description}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display de PIN */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Requiere Autorización de Dueño
          </p>
          <div className="flex justify-center items-center gap-3">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-2 ${
                  pin.length > i
                    ? 'bg-brand border-brand scale-110'
                    : 'bg-white border-slate-300'
                }`}
              />
            ))}
          </div>
          {error && <p className="text-xs text-semantic-anulacion font-medium mt-2">{error}</p>}
        </div>

        {/* Mini Teclado Numérico */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="h-11 rounded-xl bg-white border border-cloud-border text-slate-heading font-mono font-bold text-lg hover:bg-slate-50 active:scale-95 shadow-sm"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="h-11 rounded-xl bg-white border border-cloud-border text-slate-muted font-bold text-xs uppercase hover:bg-slate-50 active:scale-95"
          >
            C
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-11 rounded-xl bg-white border border-cloud-border text-slate-heading font-mono font-bold text-lg hover:bg-slate-50 active:scale-95 shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-11 rounded-xl bg-white border border-cloud-border text-slate-muted flex items-center justify-center hover:bg-slate-50 active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Atajo rápido demo */}
        <button
          onClick={() => {
            setPin('1234');
            setTimeout(() => onSuccess(), 200);
          }}
          className="w-full py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-semibold border border-blue-200 flex items-center justify-center gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Demo: Autorizar con PIN 1234</span>
        </button>
      </div>
    </div>
  );
};
