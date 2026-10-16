import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  UserPlus, 
  ArrowDownLeft, 
  ArrowUpRight,
  Eye, 
  EyeOff, 
  CheckCircle2, 
  X,
  PlusCircle,
  MessageCircle,
  Package,
  Sparkles
} from 'lucide-react';
import { Cuenta, Movimiento, CuadreCajaResumen } from '../../types/database';
import { formatCurrency } from '../../lib/formatters';
import { AccountService } from '../../services/accountService';
import { usePinAuth } from '../auth-pin/PinAuthContext';
import { QuickPaymentModal } from './QuickPaymentModal';
import { NewAccountModal } from '../accounts/NewAccountModal';
import { MasterPinModal } from '../auth-pin/MasterPinModal';
import { AccountDetailModal } from '../accounts/AccountDetailModal';

interface CashierDashboardProps {
  onSelectReceipt: (movimiento: Movimiento, cuenta: Cuenta) => void;
}

export const CashierDashboard: React.FC<CashierDashboardProps> = ({ onSelectReceipt }) => {
  const { negocio, currentRole } = usePinAuth();
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cuadre, setCuadre] = useState<CuadreCajaResumen | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SEPARE' | 'FIADO' | 'PAGADAS'>('ALL');
  const [showSensitiveData, setShowSensitiveData] = useState<boolean>(currentRole === 'DUENO');
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
  const [isNewAccountOpen, setIsNewAccountOpen] = useState<boolean>(false);
  const [selectedDetailCuenta, setSelectedDetailCuenta] = useState<Cuenta | null>(null);
  const [paymentModalState, setPaymentModalState] = useState<{
    cuenta: Cuenta;
    mode: 'ABONO' | 'CARGO';
  } | null>(null);

  // Cargar datos con transición fluida y animada
  const loadData = useCallback(async (isInitial = false) => {
    setIsLoading(true);
    try {
      const [loadedCuentas, loadedCuadre] = await Promise.all([
        AccountService.getCuentas(negocio.id),
        AccountService.getCuadreCaja(negocio.id),
        // Pausa dinámica suave calculada para dar tiempo a la transición de entrada
        new Promise(res => setTimeout(res, isInitial ? 400 : 200)),
      ]);
      setCuentas(loadedCuentas);
      setCuadre(loadedCuadre);
    } catch (err) {
      console.error('Error cargando cuentas:', err);
    } finally {
      setIsLoading(false);
    }
  }, [negocio.id]);

  useEffect(() => {
    loadData(true);
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
    if (selectedDetailCuenta?.id === cuentaActualizada.id) {
      setSelectedDetailCuenta(cuentaActualizada);
    }
    onSelectReceipt(movimiento, cuentaActualizada);
  };

  return (
    <div className="space-y-6">
      {/* 1. Tarjetas Principales del Día (Adaptables a Móvil y Portátil) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Plata que entró hoy */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white rounded-3xl p-5 shadow-md shadow-emerald-950/15 border border-emerald-500/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-100 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Plata Cobrada Hoy
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          {isLoading ? (
            <div className="h-9 w-40 bg-white/20 rounded-xl animate-pulse my-1" />
          ) : (
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight animate-fadeIn">
              {formatCurrency(cuadre?.totalAbonosHoy || 0)}
            </div>
          )}
          <div className="text-xs text-emerald-100 mt-2 pt-2 border-t border-emerald-500/40 flex items-center justify-between font-mono">
            {isLoading ? (
              <div className="h-3.5 w-full bg-white/20 rounded-md animate-pulse" />
            ) : (
              <>
                <span>Efectivo: <strong className="text-white font-black">{formatCurrency(cuadre?.totalEfectivoHoy || 0)}</strong></span>
                <span>Nequi / Transf: <strong className="text-white font-black">{formatCurrency(cuadre?.totalTransferenciaHoy || 0)}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Cuentas por cobrar */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 shadow-md shadow-slate-950/20 border border-slate-700/50 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Total por Cobrar en la Calle
            </span>
            <button
              onClick={handleToggleSensitiveData}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all backdrop-blur-xs"
              title="Ver/Ocultar con PIN de Dueño"
            >
              {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {isLoading ? (
            <div className="h-9 w-40 bg-white/20 rounded-xl animate-pulse my-1" />
          ) : (
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight animate-fadeIn">
              {showSensitiveData ? formatCurrency(cuadre?.totalPorCobrarCartera || 0) : '••••••••'}
            </div>
          )}
          <div className="text-xs text-slate-300 mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between">
            {isLoading ? (
              <div className="h-3.5 w-44 bg-white/20 rounded-md animate-pulse" />
            ) : (
              <span>
                {showSensitiveData
                  ? `${cuadre?.totalClientesActivos || 0} clientes con deuda activa`
                  : 'Oculto para cajeros (Toca el ojo para ver)'}
              </span>
            )}
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

      {/* 3. Pestañas de Filtro según lo que el negocio maneja */}
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

        {negocio.permite_separe !== false && (
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
        )}

        {negocio.permite_fiado !== false && (
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
        )}

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
        {isLoading ? (
          // Tarjetas Skeleton durante carga / entrada al demo
          [1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 animate-pulse"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-24 bg-slate-200 rounded-full" />
                  <div className="h-5 w-16 bg-slate-100 rounded-md" />
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded-xl" />
                <div className="h-14 w-full bg-slate-100 rounded-2xl" />
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="h-3.5 w-1/2 bg-slate-100 rounded" />
                <div className="h-7 w-2/3 bg-slate-200 rounded-xl" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-10 flex-1 bg-slate-200 rounded-xl" />
                <div className="h-10 w-24 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))
        ) : filteredCuentas.length === 0 ? (
          <div className="col-span-full bg-white border border-cloud-border rounded-3xl p-10 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto shadow-inner">
              {searchQuery ? <Search className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
            </div>
            <div className="max-w-md mx-auto">
              <p className="text-base font-extrabold text-slate-800">
                {searchQuery ? 'No se encontraron resultados' : '¡Tu libreta de mostrador está limpia y lista!'}
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {searchQuery
                  ? 'No hay ningún cliente o prenda que coincida con esa búsqueda. Prueba con otro nombre o celular.'
                  : 'Aún no tienes cuentas registradas en este negocio. Todo negocio nuevo se entrega completamente limpio para que comiences a registrar tus fiados y apartados.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => setIsNewAccountOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-hover text-white text-xs font-black rounded-2xl shadow-md active:scale-95 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Anotar mi Primer Cliente</span>
              </button>
            )}
          </div>
        ) : (
          filteredCuentas.map((cuenta, idx) => {
            const isSepare = cuenta.tipo_cuenta === 'SEPARE';
            const progress = isSepare
              ? Math.min(100, Math.round(((cuenta.valor_inicial - cuenta.saldo_pendiente) / cuenta.valor_inicial) * 100))
              : 0;

            return (
              <div
                key={cuenta.id}
                style={{ animationDelay: `${idx * 50}ms` }}
                className={`p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 animate-fadeIn ${
                  cuenta.estado === 'PAGADA'
                    ? 'bg-emerald-50/40 border border-emerald-200 border-l-4 border-l-emerald-500'
                    : isSepare
                    ? 'bg-white border border-slate-200/90 border-l-4 border-l-blue-500'
                    : 'bg-white border border-slate-200/90 border-l-4 border-l-amber-500'
                }`}
              >
                {/* Cabecera de la Tarjeta */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        isSepare ? 'bg-blue-100/80 text-blue-800' : 'bg-amber-100/80 text-amber-900'
                      }`}
                    >
                      {isSepare ? 'Plan Separe' : 'Fiado'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {cuenta.estado === 'PAGADA' ? (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Liquidada</span>
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{cuenta.consecutivo}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDetailCuenta(cuenta);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-500 hover:text-brand transition-colors text-xs flex items-center gap-1 font-bold border border-slate-200/80 shadow-xs"
                        title="Ver lista completa de artículos y abonos"
                      >
                        <Eye className="w-3 h-3" />
                        <span className="text-[10px]">Detalle</span>
                      </button>
                    </div>
                  </div>

                  {/* Nombre del Cliente */}
                  <h4 className="text-base font-extrabold text-slate-heading leading-tight truncate">
                    {cuenta.nombre_cliente}
                  </h4>

                  {/* Prenda / Concepto Proporcional */}
                  {(() => {
                    const items = cuenta.concepto_articulo
                      .split(/[\n,;+]+/)
                      .map(i => i.trim())
                      .filter(Boolean);

                    return (
                      <div
                        onClick={() => setSelectedDetailCuenta(cuenta)}
                        className="group cursor-pointer bg-slate-50 hover:bg-sky-50/50 p-2.5 rounded-2xl border border-slate-200/80 transition-all text-xs space-y-1"
                        title="Toca para ver la lista detallada de cosas"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-600 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand" />
                            <span>{isSepare ? 'Artículo Apartado' : 'Mercancía Fiada'}</span>
                          </span>
                          {items.length > 1 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">
                              {items.length} productos
                            </span>
                          )}
                        </div>

                        {items.length <= 1 ? (
                          <p className="text-xs text-slate-700 font-medium truncate">
                            {items[0] || cuenta.concepto_articulo}
                          </p>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="text-xs text-slate-700 font-medium truncate">
                              • {items[0]}
                            </div>
                            <div className="text-xs text-slate-500 font-medium truncate">
                              • {items[1]}
                            </div>
                            {items.length > 2 && (
                              <div className="text-[10px] font-bold text-brand group-hover:underline flex items-center justify-between pt-0.5">
                                <span>+{items.length - 2} productos más...</span>
                                <span>Ver todo →</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
                      <span className="font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
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

                  {cuenta.estado === 'ACTIVA' ? (
                    <div className="flex items-center gap-1.5">
                      {/* Botón Abonar Dinero (Aplica para Separe y Fiados) */}
                      <button
                        onClick={() => setPaymentModalState({ cuenta, mode: 'ABONO' })}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1"
                        title="Recibir abono de dinero"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Abonar</span>
                      </button>

                      {/* Botón Fiar Más Mercancía (EXCLUSIVO para FIADOS) */}
                      {!isSepare && (
                        <button
                          onClick={() => setPaymentModalState({ cuenta, mode: 'CARGO' })}
                          className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1"
                          title="Anotar más mercancía fiada a esta cuenta"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
                          <span>+ Fiar</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium italic">
                      Completada
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Nueva Cuenta */}
      <NewAccountModal
        isOpen={isNewAccountOpen}
        permiteSepare={negocio.permite_separe !== false}
        permiteFiado={negocio.permite_fiado !== false}
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

      {/* Modal de Abono / Carga Rápida */}
      <QuickPaymentModal
        isOpen={Boolean(paymentModalState)}
        cuenta={paymentModalState?.cuenta || null}
        initialMode={paymentModalState?.mode || 'ABONO'}
        onClose={() => setPaymentModalState(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Modal de Detalle Completo de Cuenta y Artículos */}
      <AccountDetailModal
        isOpen={Boolean(selectedDetailCuenta)}
        cuenta={selectedDetailCuenta}
        onClose={() => setSelectedDetailCuenta(null)}
        onOpenPayment={(cuenta, mode) => {
          setSelectedDetailCuenta(null);
          setPaymentModalState({ cuenta, mode });
        }}
        onSelectReceipt={onSelectReceipt}
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
