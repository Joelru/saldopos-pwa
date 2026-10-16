import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  PlusCircle, 
  ArrowUpRight, 
  CheckCircle2, 
  Calendar, 
  Receipt,
  Package,
  Layers
} from 'lucide-react';
import { Cuenta, Movimiento } from '../../types/database';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { AccountService } from '../../services/accountService';

interface AccountDetailModalProps {
  isOpen: boolean;
  cuenta: Cuenta | null;
  onClose: () => void;
  onOpenPayment: (cuenta: Cuenta, mode: 'ABONO' | 'CARGO') => void;
  onSelectReceipt: (movimiento: Movimiento, cuenta: Cuenta) => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  isOpen,
  cuenta,
  onClose,
  onOpenPayment,
  onSelectReceipt,
}) => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [isLoadingMovs, setIsLoadingMovs] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && cuenta) {
      setIsLoadingMovs(true);
      AccountService.getMovimientos(cuenta.id, cuenta.negocio_id)
        .then(movs => setMovimientos(movs))
        .catch(err => console.warn('Error cargando movimientos:', err))
        .finally(() => setIsLoadingMovs(false));
    }
  }, [isOpen, cuenta?.id, cuenta?.saldo_pendiente]);

  if (!isOpen || !cuenta) return null;

  const isSepare = cuenta.tipo_cuenta === 'SEPARE';
  const isPagada = cuenta.estado === 'PAGADA';

  // Desglosar lista de artículos (separados por coma, salto de línea, punto y coma o +)
  const itemsList = cuenta.concepto_articulo
    .split(/[\n,;+]+/)
    .map(i => i.trim())
    .filter(Boolean);

  // Movimientos de tipo cargo adicional (mercancía fiada posterior)
  const cargosPosteriores = movimientos.filter(m => m.tipo_movimiento === 'CARGO');
  // Movimientos de tipo abono
  const abonosRealizados = movimientos.filter(m => m.tipo_movimiento === 'ABONO');
  const totalAbonado = abonosRealizados.reduce((acc, curr) => acc + curr.monto, 0);

  const cleanPhone = cuenta.celular_cliente.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 border border-cloud-border shadow-pos-lg max-h-[92vh] overflow-y-auto no-scrollbar space-y-5">
        
        {/* Encabezado con Identificación y Estado */}
        <div className="flex items-start justify-between pb-3 border-b border-cloud-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                isSepare ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {isSepare ? 'Plan Separe' : 'Cuenta de Fiado'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                #{cuenta.consecutivo}
              </span>
              {isPagada && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Liquidada</span>
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-heading leading-tight">
              {cuenta.nombre_cliente}
            </h3>

            {/* Teléfono y WhatsApp Directo */}
            <div className="flex items-center gap-3 pt-0.5">
              <a
                href={`https://wa.me/57${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                title="Chatear por WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>+57 {cuenta.celular_cliente}</span>
              </a>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Abierta el {formatDate(cuenta.created_at)}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen Financiero en 3 Bloques Proporcionales */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Cuenta
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-slate-700 mt-0.5 block">
              {formatCurrency(cuenta.valor_inicial)}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Abonado
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-emerald-700 mt-0.5 block">
              {formatCurrency(totalAbonado || (cuenta.valor_inicial - cuenta.saldo_pendiente))}
            </span>
          </div>

          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
              Debe Hoy
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-rose-700 mt-0.5 block">
              {formatCurrency(cuenta.saldo_pendiente)}
            </span>
          </div>
        </div>

        {/* SECCIÓN 1: Listado Detallado de Mercancía / Productos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-brand" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Lista de Mercancía / Artículos ({itemsList.length})
              </h4>
            </div>
            <span className="text-[10px] text-slate-400">
              {isSepare ? 'En custodia en bodega' : 'Entregados al cliente'}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {itemsList.map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-2.5 p-2 bg-white rounded-xl border border-slate-100 shadow-xs text-xs font-medium text-slate-800"
              >
                <div className="w-5 h-5 rounded-lg bg-sky-50 text-brand flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                  {idx + 1}
                </div>
                <span className="flex-1 leading-relaxed">{item}</span>
              </div>
            ))}

            {/* Mercancía adicional sumada posteriormente */}
            {cargosPosteriores.length > 0 && (
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-amber-800 block">
                  ➕ Mercancía Fiada Adicionalmente:
                </span>
                {cargosPosteriores.map(c => (
                  <div 
                    key={c.id} 
                    className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-amber-950 block">{c.nota}</span>
                      <span className="text-[10px] text-amber-700">{formatDate(c.created_at)}</span>
                    </div>
                    <span className="font-mono font-black text-amber-900">
                      +{formatCurrency(c.monto)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 2: Historial de Abonos y Movimientos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Historial de Abonos y Movimientos ({movimientos.length})
              </h4>
            </div>
            {isLoadingMovs && <span className="text-[10px] text-slate-400">Actualizando...</span>}
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2 max-h-48 overflow-y-auto no-scrollbar divide-y divide-slate-100">
            {movimientos.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No hay movimientos registrados para esta cuenta aún.
              </div>
            ) : (
              movimientos.map(mov => {
                const isAbono = mov.tipo_movimiento === 'ABONO';
                return (
                  <div key={mov.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                          isAbono 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {isAbono ? 'Abono Recibido' : '+ Mercancía Fiada'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(mov.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium truncate max-w-[220px]">
                        {mov.nota || (isAbono ? 'Pago en caja' : 'Cargo a crédito')}
                      </p>
                      <span className="text-[10px] text-slate-400 block">
                        Por: {mov.creado_por_rol === 'DUENO' ? 'Dueño' : 'Cajero'} • {mov.metodo_pago === 'TRANSFERENCIA' ? 'Nequi/Transf.' : 'Efectivo'}
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      <span className={`font-mono font-black text-sm block ${
                        isAbono ? 'text-emerald-700' : 'text-amber-800'
                      }`}>
                        {isAbono ? '-' : '+'}{formatCurrency(mov.monto)}
                      </span>
                      
                      {isAbono && (
                        <button
                          type="button"
                          onClick={() => onSelectReceipt(mov, cuenta)}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold text-slate-600 flex items-center gap-1 ml-auto shadow-xs"
                          title="Ver o reenviar comprobante"
                        >
                          <Receipt className="w-3 h-3 text-emerald-600" />
                          <span>Tirilla</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Botones de Acción al Pie del Detalle */}
        <div className="pt-2 border-t border-cloud-border flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cerrar Detalle
          </button>

          {!isPagada && (
            <div className="flex items-center gap-2">
              {/* Botón Abonar */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment(cuenta, 'ABONO');
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-emerald-200" />
                <span>Registrar Abono</span>
              </button>

              {/* Botón Fiar Más (solo si es Fiado) */}
              {!isSepare && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPayment(cuenta, 'CARGO');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <ArrowUpRight className="w-4 h-4 text-amber-700" />
                  <span>+ Fiar Mercancía</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
