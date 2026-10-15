import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Check, Sparkles, AlertCircle, PlusCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Cuenta, TipoMovimiento, MetodoPago, Movimiento } from '../../types/database';
import { formatCurrency } from '../../lib/formatters';
import { AccountService } from '../../services/accountService';
import { usePinAuth } from '../auth-pin/PinAuthContext';

interface QuickPaymentModalProps {
  isOpen: boolean;
  cuenta: Cuenta | null;
  initialMode?: TipoMovimiento;
  onClose: () => void;
  onPaymentSuccess: (movimiento: Movimiento, cuentaActualizada: Cuenta) => void;
}

export const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  isOpen,
  cuenta,
  initialMode = 'ABONO',
  onClose,
  onPaymentSuccess,
}) => {
  const { currentRole } = usePinAuth();
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>(initialMode);
  const [montoStr, setMontoStr] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [nota, setNota] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar y resetear SIEMPRE el modo cuando se abre el modal
  useEffect(() => {
    if (isOpen && cuenta) {
      // En un Plan Separe NUNCA se puede sumar fiado, solo abonar
      const targetMode = cuenta.tipo_cuenta === 'SEPARE' ? 'ABONO' : initialMode;
      setTipoMovimiento(targetMode);
      setMontoStr('');
      setNota('');
      setError(null);
      setMetodoPago('EFECTIVO');
    }
  }, [isOpen, cuenta?.id, initialMode]);

  if (!isOpen || !cuenta) return null;

  const monto = Number(montoStr.replace(/\D/g, '')) || 0;
  const saldoActual = cuenta.saldo_pendiente;

  // Cálculo en vivo del nuevo saldo proyectado
  const nuevoSaldoEstimado =
    tipoMovimiento === 'ABONO'
      ? Math.max(0, saldoActual - monto)
      : saldoActual + monto;

  const isSepare = cuenta.tipo_cuenta === 'SEPARE';
  const isAbono = tipoMovimiento === 'ABONO';

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
    if (isAbono && isSepare && monto > saldoActual) {
      return setError(`El abono no puede superar el saldo pendiente (${formatCurrency(saldoActual)})`);
    }
    if (!isAbono && !nota.trim()) {
      return setError('Por favor anota qué mercancía se llevó el cliente (ej: 2 camisas, mercado, etc.)');
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const { cuenta: cuentaActualizada, movimiento } = await AccountService.registerMovimiento(
        cuenta,
        tipoMovimiento,
        monto,
        metodoPago,
        nota.trim() || '',
        currentRole || 'CAJERO'
      );

      // Si fue abono exitoso o liquidación total, confeti
      if (isAbono) {
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
        {/* Header con Info del Cliente y Tipo de Movimiento */}
        <div className="flex items-start justify-between pb-3 border-b border-cloud-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                isSepare ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {isSepare ? 'Plan Separe' : 'Fiado'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                #{cuenta.consecutivo}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-heading leading-tight">
              {isAbono ? 'Registrar Abono' : 'Sumar Mercancía Fiada'}
            </h3>
            <p className="text-xs text-slate-500">
              Cliente: <strong className="text-slate-800">{cuenta.nombre_cliente}</strong>
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
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isAbono
            ? 'bg-emerald-50/50 border-emerald-200'
            : 'bg-amber-50/50 border-amber-200'
        }`}>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Debe Actualmente
            </span>
            <div className="text-2xl font-black text-slate-heading font-mono tracking-tight mt-0.5">
              {formatCurrency(saldoActual)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Prenda/Artículo:</span>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px] block">
              {cuenta.concepto_articulo}
            </span>
          </div>
        </div>

        {/* Switch para Cuentas Fiadas (Si es Separe, no se muestra porque no se le puede sumar fiado) */}
        {!isSepare && (
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setTipoMovimiento('ABONO');
                setError(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                isAbono
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>Abonar Dinero</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoMovimiento('CARGO');
                setError(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                !isAbono
                  ? 'bg-white text-amber-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
              <span>Fiar Más Mercancía</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-semantic-anulacion font-medium flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input de Monto */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 block mb-1">
              {isAbono ? '¿Cuánto dinero va a abonar? *' : '¿Cuánto vale la nueva mercancía que se fía? *'}
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
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-cloud-border text-2xl font-black font-mono text-slate-heading focus:outline-none focus:border-brand shadow-xs"
              />
            </div>
          </div>

          {/* Píldoras de Montos Rápidos */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Valores Rápidos:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[10000, 20000, 50000, 100000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePillClick(val)}
                  className="py-2 px-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-mono font-bold border border-slate-200/80 transition-all text-center"
                >
                  ${val / 1000}k
                </button>
              ))}
            </div>

            {/* Píldora de Liquidar Todo (Solo en Abono) */}
            {saldoActual > 0 && isAbono && (
              <button
                type="button"
                onClick={handleAllBalanceClick}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Liquidar Deuda Completa ({formatCurrency(saldoActual)})</span>
              </button>
            )}
          </div>

          {/* Si es ABONO: Seleccionar Medio de Pago */}
          {isAbono ? (
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                ¿Cómo entregó el dinero el cliente? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMetodoPago('EFECTIVO')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                    metodoPago === 'EFECTIVO'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-xs'
                      : 'bg-white text-slate-600 border-cloud-border hover:bg-slate-50'
                  }`}
                >
                  <span>💵 Efectivo en Caja</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago('TRANSFERENCIA')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                    metodoPago === 'TRANSFERENCIA'
                      ? 'bg-blue-50 text-blue-900 border-blue-400 shadow-xs'
                      : 'bg-white text-slate-600 border-cloud-border hover:bg-slate-50'
                  }`}
                >
                  <span>📲 Nequi / Transf.</span>
                </button>
              </div>
            </div>
          ) : (
            /* Si es CARGO / SUMAR FIADO: Detalle de la mercancía obligatorio */
            <div>
              <label className="text-xs font-extrabold text-amber-900 block mb-1">
                ¿Qué mercancía se llevó fiada? *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 2 camisas polo, 1 pantalón jean, etc."
                value={nota}
                onChange={e => setNota(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50/30 text-xs focus:outline-none focus:border-amber-500 font-medium text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Esto quedará impreso en la tirilla de WhatsApp para evitar discusiones futuras.
              </p>
            </div>
          )}

          {/* Nota opcional para Abonos */}
          {isAbono && (
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Nota opcional (aparece en la tirilla)
              </label>
              <input
                type="text"
                placeholder="Ej: Abono de quincena, entregó billete de $50k..."
                value={nota}
                onChange={e => setNota(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cloud-border text-xs focus:outline-none focus:border-brand"
              />
            </div>
          )}

          {/* Proyección del Nuevo Saldo */}
          {monto > 0 && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-mono ${
              isAbono ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'
            }`}>
              <span className="text-slate-600 font-sans font-medium">
                {isAbono ? 'Nuevo saldo tras este abono:' : 'Nuevo saldo sumando este fiado:'}
              </span>
              <span className="font-black text-lg text-slate-heading">
                {formatCurrency(nuevoSaldoEstimado)}
              </span>
            </div>
          )}

          {/* Botón de Confirmación */}
          <button
            type="submit"
            disabled={isSubmitting || monto <= 0}
            className={`w-full py-3.5 px-4 rounded-xl text-white font-extrabold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${
              isAbono
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-950/10'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-950/10'
            }`}
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : isAbono ? (
              <>
                <Check className="w-5 h-5" />
                <span>
                  Registrar Abono {monto > 0 ? `de ${formatCurrency(monto)}` : ''}
                </span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                <span>
                  + Sumar {monto > 0 ? `${formatCurrency(monto)}` : ''} a la Deuda
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
