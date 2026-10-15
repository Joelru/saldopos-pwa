import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, ShoppingBag, BookOpen } from 'lucide-react';
import { TipoCuenta, MetodoPago } from '../../types/database';
import { formatCurrency } from '../../lib/formatters';

interface NewAccountModalProps {
  isOpen: boolean;
  permiteSepare?: boolean;
  permiteFiado?: boolean;
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

export const NewAccountModal: React.FC<NewAccountModalProps> = ({
  isOpen,
  permiteSepare = true,
  permiteFiado = true,
  onClose,
  onSubmit,
}) => {
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>(permiteSepare ? 'SEPARE' : 'FIADO');
  const [concepto, setConcepto] = useState('');
  const [valorTotalStr, setValorTotalStr] = useState('');
  const [abonoInicialStr, setAbonoInicialStr] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (permiteSepare && !permiteFiado) {
        setTipoCuenta('SEPARE');
      } else if (!permiteSepare && permiteFiado) {
        setTipoCuenta('FIADO');
      } else {
        setTipoCuenta('SEPARE');
      }
      setNombre('');
      setCelular('');
      setConcepto('');
      setValorTotalStr('');
      setAbonoInicialStr('');
      setError(null);
    }
  }, [isOpen, permiteSepare, permiteFiado]);

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
          {/* Selector de Modalidad Dual según preferencias de la tienda */}
          {permiteSepare && permiteFiado ? (
            <div>
              <label className="text-xs font-bold text-slate-muted uppercase tracking-wider block mb-1.5">
                Modalidad de Cuenta *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoCuenta('SEPARE')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    tipoCuenta === 'SEPARE'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-black">Plan Separe</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight block">
                    Apartas la prenda y se entrega al liquidar a $0.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoCuenta('FIADO')}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    tipoCuenta === 'FIADO'
                      ? 'border-amber-500 bg-amber-50/60 text-amber-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-black">Fiado</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight block">
                    El cliente se lleva los productos ya y anotas la deuda.
                  </span>
                </button>
              </div>
            </div>
          ) : permiteSepare ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-blue-950 block">Modalidad: Plan Separe (Apartado)</span>
                <span className="text-[11px] text-blue-700">La mercancía queda guardada hasta que el cliente termine de pagar.</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5">
              <div className="p-2 bg-amber-600 text-white rounded-xl shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-amber-950 block">Modalidad: Fiado (Libreta de Confianza)</span>
                <span className="text-[11px] text-amber-800">El cliente se lleva los artículos de inmediato a crédito.</span>
              </div>
            </div>
          )}

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

          {/* Concepto del artículo / Lista de productos */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {tipoCuenta === 'SEPARE' ? 'Prenda o Artículo Apartado *' : 'Mercancía o Productos Fiados *'}
              </label>
              <span className="text-[10px] text-slate-400">
                Puedes anotar varios
              </span>
            </div>
            <textarea
              rows={2}
              required
              placeholder={
                tipoCuenta === 'SEPARE'
                  ? 'Ej: Zapatillas Nike Talla 41, Chaqueta Jean...'
                  : 'Ej: 2 lb arroz, 1 aceite 500ml, 1 cubeta huevos, 2 leches...'
              }
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-cloud-border text-sm focus:outline-none focus:border-brand resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Si son varios productos, sepáralos por coma para que el sistema los organice en la lista detallada.
            </p>
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
