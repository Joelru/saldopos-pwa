import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  UserPlus, 
  ArrowDownLeft, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  X,
  PlusCircle,
  MessageCircle
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
      const matchesSearch =
        !q ||
        c.nombre_cliente.toLowerCase().includes(q) ||
        c.celular_cliente.includes(q) ||
        c.concepto_articulo.toLowerCase().includes(q) ||
        c.consecutivo.toString().includes(q);

      if (!matchesSearch) return false;

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
    <div className="space-y-6">
      {/* 1. Tarjetas Principales del Día (Adaptables a Móvil y Portátil) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Plata que entró hoy */}
        <div className="bg-white border border-cloud-border rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Plata Cobrada Hoy
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-semantic-abono font-mono tracking-tight">
            {formatCurrency(cuadre?.totalAbonosHoy || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between font-mono">
            <span>Efectivo: <strong className="text-slate-800">{formatCurrency(cuadre?.totalEfectivoHoy || 0)}</strong></span>
            <span>Nequi / Transf: <strong className="text-slate-800">{formatCurrency(cuadre?.totalTransferenciaHoy || 0)}</strong></span>
          </div>
        </div>

        {/* Cuentas por cobrar */}
        <div className="bg-white border border-cloud-border rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total por Cobrar en la Calle
            </span>
            <button
              onClick={handleToggleSensitiveData}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              title="Ver/Ocultar con PIN de Dueño"
            >
              {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-heading font-mono tracking-tight">
            {showSensitiveData ? formatCurrency(cuadre?.totalPorCobrarCartera || 0) : '••••••••'}
          </div>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>
              {showSensitiveData
                ? `${cuadre?.totalClientesActivos || 0} clientes activos`
                : 'Oculto para cajeros (Toca el ojo para ver)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Botón Nueva Cuenta */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, celular o prenda..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-cloud-border rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand shadow-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsNewAccountOpen(true)}
          className="px-5 py-3 bg-brand hover:bg-brand-hover text-white rounded-2xl text-sm font-extrabold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Anotar Nueva Cuenta</span>
        </button>
      </div>

      {/* 3. Pestañas de Filtro */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`py-2 px-4 rounded-xl font-bold shrink-0 transition-all ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-cloud-border hover:bg-slate-50'
          }`}
        >
          Todas las Activas ({cuentas.filter(c => c.estado === 'ACTIVA').length})
        </button>

        <button
          onClick={() => setActiveFilter('SEPARE')}
          className={`py-2 px-4 rounded-xl font-bold shrink-0 transition-all ${
            activeFilter === 'SEPARE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
          }`}
        >
          Plan Separe ({cuentas.filter(c => c.tipo_cuenta === 'SEPARE' && c.estado === 'ACTIVA').length})
        </button>

        <button
          onClick={() => setActiveFilter('FIADO')}
          className={`py-2 px-4 rounded-xl font-bold shrink-0 transition-all ${
            activeFilter === 'FIADO'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          Fiados ({cuentas.filter(c => c.tipo_cuenta === 'FIADO' && c.estado === 'ACTIVA').length})
        </button>

        <button
          onClick={() => setActiveFilter('PAGADAS')}
          className={`py-2 px-4 rounded-xl font-bold shrink-0 transition-all ${
            activeFilter === 'PAGADAS'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-500 border border-cloud-border hover:bg-slate-50'
          }`}
        >
          Cuentas Liquidadas ({cuentas.filter(c => c.estado === 'PAGADA').length})
        </button>
      </div>

      {/* 4. Listado de Cuentas (Grid Responsivo para Portátiles y Móviles) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCuentas.length === 0 ? (
          <div className="col-span-full bg-white border border-cloud-border rounded-3xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No se encontraron cuentas</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? 'No hay ningún cliente o prenda que coincida con esa búsqueda.'
                  : 'Aún no tienes cuentas registradas. Toca en "+ Anotar Nueva Cuenta".'}
              </p>
            </div>
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
                className="bg-white border border-cloud-border rounded-3xl p-5 shadow-sm hover:border-brand/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isSepare ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-900'
                      }`}
                    >
                      {isSepare ? 'Plan Separe' : 'Fiado'}
                    </span>

                    {cuenta.estado === 'PAGADA' ? (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Liquidada</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{cuenta.consecutivo}
                      </span>
                    )}
                  </div>

                  {/* Nombre del Cliente */}
                  <h4 className="text-base font-extrabold text-slate-heading leading-tight truncate">
                    {cuenta.nombre_cliente}
                  </h4>

                  {/* Prenda / Concepto */}
                  <p className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl line-clamp-2">
                    {cuenta.concepto_articulo}
                  </p>
                </div>

                {/* WhatsApp Directo */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="text-[11px]">Celular:</span>
                  <a
                    href={`https://wa.me/57${cuenta.celular_cliente.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-600 font-mono font-semibold"
                    title="Chatear por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{cuenta.celular_cliente}</span>
                  </a>
                </div>

                {/* Barra de progreso para Plan Separe */}
                {isSepare && cuenta.estado === 'ACTIVA' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Progreso de Abonos:</span>
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

                {/* Saldo y Botón de Cobro */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Debe Actualmente:
                    </span>
                    <span className="text-xl font-black font-mono text-slate-heading">
                      {formatCurrency(cuenta.saldo_pendiente)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedCuentaForPayment(cuenta)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    <span>Abonar</span>
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

      {/* Modal de Abono Rápido */}
      <QuickPaymentModal
        isOpen={Boolean(selectedCuentaForPayment)}
        cuenta={selectedCuentaForPayment}
        onClose={() => setSelectedCuentaForPayment(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Modal de Autorización PIN Maestro para Cartera */}
      <MasterPinModal
        isOpen={isMasterModalOpen}
        title="Visualización de Cartera"
        description="Ingresa tu PIN de Dueño para consultar el total de la cartera activa."
        onSuccess={() => {
          setIsMasterModalOpen(false);
          setShowSensitiveData(true);
        }}
        onCancel={() => setIsMasterModalOpen(false)}
      />
    </div>
  );
};
