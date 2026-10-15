import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  UserPlus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Phone, 
  CreditCard, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  X
} from 'lucide-react';
import { Cuenta, Movimiento, CuadreCajaResumen } from '../../types/database';
import { formatCurrency } from '../../lib/formatters';
import { AccountService } from '../../services/accountService';
import { usePinAuth } from '../auth-pin/PinAuthContext';
import { QuickPaymentModal } from './QuickPaymentModal';
import { NewAccountModal } from '../accounts/NewAccountModal';
import { MasterPinModal } from '../auth-pin/MasterPinModal';

interface CashierDashboardProps {
  onSelectReceipt: (movimiento: Movimiento, cuenta: Cuenta) => void;
}

export const CashierDashboard: React.FC<CashierDashboardProps> = ({ onSelectReceipt }) => {
  const { negocio, currentRole } = usePinAuth();
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cuadre, setCuadre] = useState<CuadreCajaResumen | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SEPARE' | 'FIADO' | 'PAGADAS'>('ALL');
  const [showSensitiveData, setShowSensitiveData] = useState<boolean>(currentRole === 'DUENO');
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
  const [isNewAccountOpen, setIsNewAccountOpen] = useState<boolean>(false);
  const [selectedCuentaForPayment, setSelectedCuentaForPayment] = useState<Cuenta | null>(null);

  // Cargar datos
  const loadData = useCallback(async () => {
    const [loadedCuentas, loadedCuadre] = await Promise.all([
      AccountService.getCuentas(negocio.id),
      AccountService.getCuadreCaja(negocio.id),
    ]);
    setCuentas(loadedCuentas);
    setCuadre(loadedCuadre);
  }, [negocio.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manejo de visibilidad de cartera total con PIN Maestro
  const handleToggleSensitiveData = () => {
    if (currentRole === 'DUENO') {
      setShowSensitiveData(prev => !prev);
    } else {
      setIsMasterModalOpen(true);
    }
  };

  // Filtrado reactivo en memoria (<10ms)
  const filteredCuentas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return cuentas.filter(c => {
      // Filtro de texto
      const matchesSearch =
        !q ||
        c.nombre_cliente.toLowerCase().includes(q) ||
        c.celular_cliente.includes(q) ||
        c.concepto_articulo.toLowerCase().includes(q) ||
        c.consecutivo.toString().includes(q);

      if (!matchesSearch) return false;

      // Filtro de categoría
      if (activeFilter === 'ALL') return c.estado === 'ACTIVA';
      if (activeFilter === 'SEPARE') return c.tipo_cuenta === 'SEPARE' && c.estado === 'ACTIVA';
      if (activeFilter === 'FIADO') return c.tipo_cuenta === 'FIADO' && c.estado === 'ACTIVA';
      if (activeFilter === 'PAGADAS') return c.estado === 'PAGADA';
      return true;
    });
  }, [cuentas, searchQuery, activeFilter]);

  // Manejo de pago exitoso
  const handlePaymentSuccess = (movimiento: Movimiento, cuentaActualizada: Cuenta) => {
    loadData();
    onSelectReceipt(movimiento, cuentaActualizada);
  };

  return (
    <div className="space-y-4">
      {/* 1. Tarjetas Superiores de Cuadre de Caja */}
      <div className="grid grid-cols-2 gap-3">
        {/* Recibido Hoy (Efectivo vs Nequi) */}
        <div className="bg-white border border-cloud-border rounded-2xl p-3.5 shadow-pos">
          <div className="flex items-center justify-between text-slate-muted mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Recibido Hoy</span>
            <div className="p-1 rounded-lg bg-emerald-50 text-semantic-abono">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-semantic-abono font-mono tracking-tight">
            {formatCurrency(cuadre?.totalAbonosHoy || 0)}
          </div>
          <div className="text-[10px] text-slate-muted mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between font-mono">
            <span>Efec: <b className="text-slate-700">{formatCurrency(cuadre?.totalEfectivoHoy || 0)}</b></span>
            <span>Nequi: <b className="text-slate-700">{formatCurrency(cuadre?.totalTransferenciaHoy || 0)}</b></span>
          </div>
        </div>

        {/* Total por Cobrar (Protegido por PIN Maestro) */}
        <div className="bg-white border border-cloud-border rounded-2xl p-3.5 shadow-pos">
          <div className="flex items-center justify-between text-slate-muted mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Por Cobrar</span>
            <button
              onClick={handleToggleSensitiveData}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              title="Ver/Ocultar Cartera Total"
            >
              {showSensitiveData ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="text-xl font-extrabold text-slate-heading font-mono tracking-tight">
            {showSensitiveData ? formatCurrency(cuadre?.totalPorCobrarCartera || 0) : '••••••••'}
          </div>
          <div className="text-[10px] text-slate-muted mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>{showSensitiveData ? `${cuadre?.totalClientesActivos || 0} activos` : 'Restringido a Dueño'}</span>
            {!showSensitiveData && (
              <span className="text-[9px] bg-amber-50 text-amber-700 font-semibold px-1 rounded">PIN</span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Barra de Búsqueda Reactiva y Botón de Nueva Cuenta */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, celular o prenda..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-cloud-border rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-brand shadow-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsNewAccountOpen(true)}
          className="px-3 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva Cuenta</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {/* 3. Pestañas de Filtro Rápido */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`py-1.5 px-3 rounded-full font-semibold shrink-0 transition-all ${
            activeFilter === 'ALL'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-cloud-border hover:bg-slate-50'
          }`}
        >
          Todos ({cuentas.filter(c => c.estado === 'ACTIVA').length})
        </button>

        <button
          onClick={() => setActiveFilter('SEPARE')}
          className={`py-1.5 px-3 rounded-full font-semibold shrink-0 transition-all ${
            activeFilter === 'SEPARE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
          }`}
        >
          Plan Separe ({cuentas.filter(c => c.tipo_cuenta === 'SEPARE' && c.estado === 'ACTIVA').length})
        </button>

        <button
          onClick={() => setActiveFilter('FIADO')}
          className={`py-1.5 px-3 rounded-full font-semibold shrink-0 transition-all ${
            activeFilter === 'FIADO'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          Fiados ({cuentas.filter(c => c.tipo_cuenta === 'FIADO' && c.estado === 'ACTIVA').length})
        </button>

        <button
          onClick={() => setActiveFilter('PAGADAS')}
          className={`py-1.5 px-3 rounded-full font-semibold shrink-0 transition-all ${
            activeFilter === 'PAGADAS'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-500 border border-cloud-border hover:bg-slate-50'
          }`}
        >
          Liquidadas ({cuentas.filter(c => c.estado === 'PAGADA').length})
        </button>
      </div>

      {/* 4. Listado de Cuentas */}
      <div className="space-y-2.5">
        {filteredCuentas.length === 0 ? (
          <div className="bg-white border border-cloud-border rounded-2xl p-8 text-center space-y-2">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No se encontraron cuentas</p>
            <p className="text-[11px] text-slate-400">
              {searchQuery ? 'Prueba con otro término de búsqueda' : 'Registra la primera cuenta con el botón "+ Nueva Cuenta"'}
            </p>
          </div>
        ) : (
          filteredCuentas.map(cuenta => {
            const isSepare = cuenta.tipo_cuenta === 'SEPARE';
            const progress = isSepare
              ? Math.min(100, Math.round(((cuenta.valor_inicial - cuenta.saldo_pendiente) / cuenta.valor_inicial) * 100))
              : 0;

            return (
              <div
                key={cuenta.id}
                className="bg-white border border-cloud-border rounded-2xl p-3.5 shadow-pos hover:border-brand/40 transition-all space-y-2.5"
              >
                {/* Fila Superior: Cliente, Modalidad y Celular */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        #{cuenta.consecutivo}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSepare ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-900'
                        }`}
                      >
                        {isSepare ? 'Plan Separe' : 'Fiado'}
                      </span>
                      {cuenta.estado === 'PAGADA' && (
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Liquidada</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-heading truncate mt-0.5">
                      {cuenta.nombre_cliente}
                    </h4>
                  </div>

                  <a
                    href={`https://wa.me/57${cuenta.celular_cliente.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-1 text-[11px]"
                    title="Enviar WhatsApp directo"
                  >
                    <Phone className="w-3 h-3" />
                    <span className="font-mono text-[10px]">{cuenta.celular_cliente}</span>
                  </a>
                </div>

                {/* Concepto del artículo / prenda */}
                <p className="text-xs text-slate-600 truncate bg-slate-50 px-2 py-1 rounded-lg">
                  {cuenta.concepto_articulo}
                </p>

                {/* Barra de progreso de abonos para Plan Separe */}
                {isSepare && cuenta.estado === 'ACTIVA' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Progreso de Abono</span>
                      <span className="font-bold text-brand">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Fila Inferior: Saldo Pendiente y Botón de Cobro Rápido */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Saldo Pendiente
                    </span>
                    <span className="text-lg font-extrabold font-mono text-slate-heading">
                      {formatCurrency(cuenta.saldo_pendiente)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedCuentaForPayment(cuenta)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    {isSepare ? (
                      <>
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Abonar</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                        <span>Operar</span>
                      </>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Nueva Cuenta */}
      <NewAccountModal
        isOpen={isNewAccountOpen}
        onClose={() => setIsNewAccountOpen(false)}
        onSubmit={async data => {
          const { cuenta, movimientoInicial } = await AccountService.createCuenta(
            negocio.id,
            data,
            currentRole || 'CAJERO'
          );
          loadData();
          if (movimientoInicial) {
            onSelectReceipt(movimientoInicial, cuenta);
          }
        }}
      />

      {/* Modal de Abono / Movimiento Rápido */}
      <QuickPaymentModal
        isOpen={Boolean(selectedCuentaForPayment)}
        cuenta={selectedCuentaForPayment}
        onClose={() => setSelectedCuentaForPayment(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Modal de PIN Maestro para Cartera */}
      <MasterPinModal
        isOpen={isMasterModalOpen}
        title="Visualización de Cartera"
        description="Ingrese el PIN Maestro de Dueño para consultar el total de la cartera activa."
        onSuccess={() => {
          setIsMasterModalOpen(false);
          setShowSensitiveData(true);
        }}
        onCancel={() => setIsMasterModalOpen(false)}
      />
    </div>
  );
};
