import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { TipoCuenta, MetodoPago } from '../../types/database';
import { formatCurrency } from '../../lib/formatters';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nombre_cliente: string;
    celular_cliente: string;
    tipo_cuenta: TipoCuenta;
    concepto_articulo: string;
    valor_inicial: number;
    abono_inicial?: number;
    metodo_pago_inicial?: MetodoPago;
  }) => Promise<void>;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>('SEPARE');
  const [concepto, setConcepto] = useState('');
  const [valorTotalStr, setValorTotalStr] = useState('');
  const [abonoInicialStr, setAbonoInicialStr] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const valorTotal = Number(valorTotalStr.replace(/\D/g, '')) || 0;
  const abonoInicial = Number(abonoInicialStr.replace(/\D/g, '')) || 0;
  const saldoFinalEstimado = Math.max(0, valorTotal - abonoInicial);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError('Ingrese el nombre del cliente');
    if (!celular.trim() || celular.replace(/\D/g, '').length < 7) {
      return setError('Ingrese un número de celular válido para WhatsApp');
    }
    if (!concepto.trim()) return setError('Ingrese el concepto o descripción del artículo');
    if (valorTotal <= 0) return setError('Ingrese el valor total');
    if (abonoInicial > valorTotal) return setError('El abono no puede superar el valor total');

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        nombre_cliente: nombre,
        celular_cliente: celular,
        tipo_cuenta: tipoCuenta,
        concepto_articulo: concepto,
        valor_inicial: valorTotal,
        abono_inicial: abonoInicial > 0 ? abonoInicial : undefined,
        metodo_pago_inicial: abonoInicial > 0 ? metodoPago : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creando la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-cloud-border shadow-pos-lg max-h-[92vh] overflow-y-auto no-scrollbar space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-cloud-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand/10 text-brand">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-heading">Anotar Nuevo Cliente</h3>
              <p className="text-xs text-slate-500">Plan Separe o Cuenta de Fiado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-semantic-anulacion font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Selector de Modalidad Dual */}
          <div>
            <label className="text-xs font-bold text-slate-muted uppercase tracking-wider block mb-1.5">
              Modalidad de Cuenta
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoCuenta('SEPARE')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  tipoCuenta === 'SEPARE'
                    ? 'border-brand bg-brand-pastel/20 text-brand-dark shadow-sm'
                    : 'border-cloud-border bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold block">Plan Separe</span>
                <span className="text-[10px] text-slate-500">Saldo decreciente a $0</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoCuenta('FIADO')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  tipoCuenta === 'FIADO'
                    ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-sm'
                    : 'border-cloud-border bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold block">Fiado / Tienda</span>
                <span className="text-[10px] text-slate-500">Cuenta corriente abierta</span>
              </button>
            </div>
          </div>

          {/* Nombre y Celular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Carlos Gómez"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cloud-border text-sm focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Celular WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="Ej: 312 456 7890"
                value={celular}
                onChange={e => setCelular(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cloud-border text-sm focus:outline-none focus:border-brand font-mono"
              />
            </div>
          </div>

          {/* Concepto del artículo */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Prenda o Concepto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Zapatillas Nike Talla 41 / Jean Azul"
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-cloud-border text-sm focus:outline-none focus:border-brand"
            />
          </div>

          {/* Valor Total y Abono Inicial */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Valor Total ($) *
              </label>
              <input
                type="number"
                required
                placeholder="120000"
                value={valorTotalStr}
                onChange={e => setValorTotalStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cloud-border text-sm font-mono font-bold text-slate-heading focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Abono Inicial ($)
              </label>
              <input
                type="number"
                placeholder="0"
                value={abonoInicialStr}
                onChange={e => setAbonoInicialStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cloud-border text-sm font-mono font-bold text-semantic-abono focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Método de Pago para el Abono Inicial si aplica */}
          {abonoInicial > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-600 block">
                Medio de Pago del Abono Inicial:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMetodoPago('EFECTIVO')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                    metodoPago === 'EFECTIVO'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  💵 Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('TRANSFERENCIA')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                    metodoPago === 'TRANSFERENCIA'
                      ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  📲 Nequi / Transf.
                </button>
              </div>
            </div>
          )}

          {/* Resumen de Saldo Resultante */}
          {valorTotal > 0 && (
            <div className="p-3 rounded-xl bg-cloud-bg border border-cloud-border flex items-center justify-between text-xs font-mono">
              <span className="text-slate-muted">Saldo Pendiente:</span>
              <span className="font-extrabold text-base text-slate-heading">
                {formatCurrency(saldoFinalEstimado)}
              </span>
            </div>
          )}

          {/* Botón de Guardado */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Creando Cuenta...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Guardar y Abrir Cuenta</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
