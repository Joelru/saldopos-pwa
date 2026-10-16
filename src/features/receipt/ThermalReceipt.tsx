import React from 'react';
import { Negocio, Cuenta, Movimiento } from '../../types/database';
import { formatCurrency, formatReceiptDateTime } from '../../lib/formatters';

interface ThermalReceiptProps {
  negocio: Negocio;
  cuenta: Cuenta;
  movimiento: Movimiento;
}

export const ThermalReceipt = React.forwardRef<HTMLDivElement, ThermalReceiptProps>(
  ({ negocio, cuenta, movimiento }, ref) => {
    const isSepare = cuenta.tipo_cuenta === 'SEPARE';
    const isAbono = movimiento.tipo_movimiento === 'ABONO';
    const isTotalmentePagada = movimiento.saldo_nuevo <= 0;

    return (
      <div
        ref={ref}
        className="w-[340px] max-w-full bg-white text-slate-900 p-5 font-mono text-xs select-none shadow-pos-lg border border-slate-200 relative box-border"
        style={{ fontFamily: '"JetBrains Mono", monospace' }}
      >
        {/* Encabezado del Comercio */}
        <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-slate-300">
          <h2 className="text-sm font-extrabold tracking-tight uppercase">
            {negocio.nombre_local}
          </h2>
          <p className="text-[10px] text-slate-600">{negocio.direccion}</p>
          <p className="text-[10px] text-slate-600">TEL: {negocio.telefono}</p>
          <div className="pt-1">
            <span className="inline-block bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
              COMPROBANTE OFICIAL
            </span>
          </div>
        </div>

        {/* Metadatos del Recibo */}
        <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">CONSECUTIVO:</span>
            <span className="font-bold">#{cuenta.consecutivo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">FECHA/HORA:</span>
            <span className="font-semibold">{formatReceiptDateTime(new Date(movimiento.created_at))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">MODALIDAD:</span>
            <span className="font-bold">{isSepare ? 'PLAN SEPARE' : 'CUENTA FIADO'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">CAJERO/ROL:</span>
            <span className="font-semibold">{movimiento.creado_por_rol}</span>
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
          <div>
            <span className="text-slate-500 text-[10px] block">CLIENTE:</span>
            <span className="font-bold text-xs uppercase block break-words">{cuenta.nombre_cliente}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">TEL:</span>
            <span className="font-semibold">{cuenta.celular_cliente}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">ARTÍCULO / PRENDA:</span>
            <span className="font-semibold text-xs block text-slate-800 break-words">{cuenta.concepto_articulo}</span>
          </div>
        </div>

        {/* Detalle Financiero del Movimiento */}
        <div className="py-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>TOTAL PRENDA:</span>
            <span className="font-semibold">{formatCurrency(cuenta.valor_inicial)}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>SALDO ANTERIOR:</span>
            <span className="font-semibold">{formatCurrency(movimiento.saldo_anterior)}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-y border-dashed border-slate-300">
            <span className="font-bold text-slate-800">
              {isAbono ? '[-] ABONO RECIBIDO:' : '[+] CARGO / FIADO:'}
            </span>
            <span className="font-extrabold text-sm text-slate-900">
              {formatCurrency(movimiento.monto)}
            </span>
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
            <span>MEDIO DE PAGO:</span>
            <span className="font-bold uppercase text-slate-700">{movimiento.metodo_pago}</span>
          </div>

          {movimiento.nota && (
            <div className="text-[10px] text-slate-500 italic pt-1 break-words">
              <span>Nota: "{movimiento.nota}"</span>
            </div>
          )}
        </div>

        {/* RECUADRO DE ALTO IMPACTO: NUEVO SALDO PENDIENTE */}
        <div className="my-3 p-3 bg-slate-900 text-white rounded-xl text-center space-y-1 shadow-sm">
          {isTotalmentePagada ? (
            <>
              <p className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">
                *** CUENTA TOTALMENTE LIQUIDADA ***
              </p>
              <div className="text-2xl font-black tracking-tight text-white">
                {formatCurrency(0)}
              </div>
              <p className="text-[9px] text-slate-300">¡Artículo listo para entrega!</p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-bold text-amber-300 tracking-wider uppercase">
                NUEVO SALDO PENDIENTE
              </p>
              <div className="text-2xl font-black tracking-tight text-white font-mono">
                {formatCurrency(movimiento.saldo_nuevo)}
              </div>
            </>
          )}
        </div>

        {/* Pie de Recibo */}
        <div className="text-center pt-2 space-y-1.5 border-t-2 border-dashed border-slate-300">
          <p className="text-[10px] text-slate-600 italic leading-snug break-words">
            "{negocio.mensaje_pie_tirilla}"
          </p>

          {/* Código de Verificación Digital y Marca Kora */}
          <div className="pt-2 space-y-0.5">
            <div className="font-mono text-[9px] tracking-widest text-slate-400 truncate">
              REF: {movimiento.id.slice(0, 18).toUpperCase()}
            </div>
            <p className="text-[9px] text-slate-400">
              Comprobante digital verificado
            </p>
            <p className="text-[10px] font-extrabold text-slate-700 pt-1 tracking-wide uppercase">
              Kora - Control de Cartera
            </p>
          </div>
        </div>

        {/* Borde dentado inferior estilizado */}
        <div className="absolute -bottom-2 left-0 right-0 h-2 receipt-sawtooth opacity-90" />
      </div>
    );
  }
);

ThermalReceipt.displayName = 'ThermalReceipt';
