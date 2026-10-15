import React, { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Cuenta, TipoMovimiento, MetodoPago, Movimiento } from '../../types/database';
import { formatCurrency } from '../../lib/formatters';
import { AccountService } from '../../services/accountService';
import { usePinAuth } from '../auth-pin/PinAuthContext';

interface QuickPaymentModalProps {
  isOpen: boolean;
  cuenta: Cuenta | null;
  onClose: () => void;
  onPaymentSuccess: (movimiento: Movimiento, cuentaActualizada: Cuenta) => void;
}

export const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  isOpen,
  cuenta,
  onClose,
  onPaymentSuccess,
}) => {
  const { currentRole } = usePinAuth();
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>('ABONO');
  const [montoStr, setMontoStr] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [nota, setNota] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !cuenta) return null;

  const monto = Number(montoStr.replace(/\D/g, '')) || 0;

  // Cálculo en vivo del nuevo saldo
  const saldoActual = cuenta.saldo_pendiente;
  const nuevoSaldoEstimado =
    tipoMovimiento === 'ABONO'
      ? Math.max(0, saldoActual - monto)
      : saldoActual + monto;

  const handlePillClick = (val: number) => {
    setMontoStr(val.toString());
    setError(null);
  };

  const handleAllBalanceClick = () => {
    setMontoStr(saldoActual.toString());
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (monto <= 0) {
      return setError('Ingrese un monto válido mayor a 0');
    }
    if (tipoMovimiento === 'ABONO' && cuenta.tipo_cuenta === 'SEPARE' && monto > saldoActual) {
      return setError(`El abono no puede superar el saldo pendiente (${formatCurrency(saldoActual)})`);
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const { cuenta: cuentaActualizada, movimiento } = await AccountService.registerMovimiento(
        cuenta,
        tipoMovimiento,
        monto,
        metodoPago,
        nota,
        currentRole || 'CAJERO'
      );

      // Si se liquidó a $0 o fue un abono exitoso, lanzar confeti
      if (tipoMovimiento === 'ABONO') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#0284C7', '#16A34A', '#BAE6FD'],
        });
      }

      onPaymentSuccess(movimiento, cuentaActualizada);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error registrando el movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-cloud-border shadow-pos-lg max-h-[92vh] overflow-y-auto no-scrollbar space-y-4">
        {/* Header con Info del Cliente */}
        <div className="flex items-start justify-between pb-2 border-b border-cloud-border">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-slate-400">
                #{cuenta.consecutivo}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  cuenta.tipo_cuenta === 'SEPARE'
                    ? 'bg-blue-50 text-brand-dark'
                    : 'bg-amber-50 text-amber-900'
                }`}
              >
                {cuenta.tipo_cuenta === 'SEPARE' ? 'Plan Separe' : 'Fiado'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-heading leading-tight mt-0.5">
              {cuenta.nombre_cliente}
            </h3>
            <p className="text-xs text-slate-muted truncate max-w-[260px]">
              {cuenta.concepto_articulo}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjeta de Saldo Actual */}
        <div className="bg-cloud-bg border border-cloud-border rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-muted">
              Saldo Pendiente Actual
            </span>
            <div className="text-2xl font-extrabold text-slate-heading font-mono tracking-tight mt-0.5">
              {formatCurrency(saldoActual)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-muted block">Total Prenda:</span>
            <span className="text-xs font-mono font-bold text-slate-600">
              {formatCurrency(cuenta.valor_inicial)}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-semantic-anulacion font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Tipo de Movimiento: Abono vs Cargo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTipoMovimiento('ABONO');
                setError(null);
              }}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                tipoMovimiento === 'ABONO'
                  ? 'bg-semantic-abonoLight border-semantic-abono text-semantic-abono shadow-sm'
                  : 'bg-white border-cloud-border text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Recibir Abono</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoMovimiento('CARGO');
                setError(null);
              }}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                tipoMovimiento === 'CARGO'
                  ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-sm'
                  : 'bg-white border-cloud-border text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Sumar Fiado</span>
            </button>
          </div>

          {/* Input de Monto */}
          <div>
            <label className="text-xs font-bold text-slate-muted uppercase tracking-wider block mb-1">
              {tipoMovimiento === 'ABONO' ? 'Monto del Abono ($)' : 'Monto a Cargar al Fiado ($)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-lg">
                $
              </span>
              <input
                type="number"
                required
                autoFocus
                placeholder="0"
                value={montoStr}
                onChange={e => setMontoStr(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-cloud-border text-xl font-bold font-mono text-slate-heading focus:outline-none focus:border-brand shadow-sm"
              />
            </div>
          </div>

          {/* Píldoras de Autocompletado Rápido */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Valores Rápidos:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[10000, 20000, 50000, 100000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePillClick(val)}
                  className="py-1.5 px-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-lg text-xs font-mono font-semibold border border-slate-200 transition-all text-center"
                >
                  ${val / 1000}k
                </button>
              ))}
            </div>

            {/* Píldora Especial: Todo el Saldo */}
            {saldoActual > 0 && tipoMovimiento === 'ABONO' && (
              <button
                type="button"
                onClick={handleAllBalanceClick}
                className="w-full mt-2 py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Liquidar Todo el Saldo ({formatCurrency(saldoActual)})</span>
              </button>
            )}
          </div>

          {/* Selector de Medio de Pago */}
          <div>
            <label className="text-xs font-bold text-slate-muted uppercase tracking-wider block mb-1.5">
              Medio de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMetodoPago('EFECTIVO')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                  metodoPago === 'EFECTIVO'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-sm'
                    : 'bg-white text-slate-600 border-cloud-border hover:bg-slate-50'
                }`}
              >
                <span>💵 Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('TRANSFERENCIA')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                  metodoPago === 'TRANSFERENCIA'
                    ? 'bg-blue-50 text-blue-900 border-blue-400 shadow-sm'
                    : 'bg-white text-slate-600 border-cloud-border hover:bg-slate-50'
                }`}
              >
                <span>📲 Nequi / Transf.</span>
              </button>
            </div>
          </div>

          {/* Nota Opcional */}
          <div>
            <input
              type="text"
              placeholder="Nota opcional (ej: Pago con billete de $50k)"
              value={nota}
              onChange={e => setNota(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-cloud-border text-xs focus:outline-none focus:border-brand"
            />
          </div>

          {/* Proyección del Nuevo Saldo */}
          {monto > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 font-sans">Nuevo Saldo:</span>
              <span className="font-extrabold text-base text-slate-heading">
                {formatCurrency(nuevoSaldoEstimado)}
              </span>
            </div>
          )}

          {/* Botón de Confirmación */}
          <button
            type="submit"
            disabled={isSubmitting || monto <= 0}
            className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${
              tipoMovimiento === 'ABONO'
                ? 'bg-semantic-abono hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>
                  {tipoMovimiento === 'ABONO' ? 'Registrar Abono' : 'Registrar Cargo'}{' '}
                  {monto > 0 ? `(${formatCurrency(monto)})` : ''}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
