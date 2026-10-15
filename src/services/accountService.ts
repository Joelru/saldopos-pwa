import { Cuenta, Movimiento, TipoCuenta, TipoMovimiento, MetodoPago, RolUsuario, CuadreCajaResumen } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY_CUENTAS = 'saldopos_cuentas';
const STORAGE_KEY_MOVIMIENTOS = 'saldopos_movimientos';

// Datos semilla de inicio para funcionamiento inmediato
const SEED_CUENTAS: Cuenta[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    negocio_id: '00000000-0000-0000-0000-000000000001',
    consecutivo: 1001,
    nombre_cliente: 'Carlos Alberto Gómez',
    celular_cliente: '3124567890',
    tipo_cuenta: 'SEPARE',
    concepto_articulo: 'Zapatillas Nike Air Max Blancas (Talla 41)',
    valor_inicial: 280000,
    saldo_pendiente: 120000,
    estado: 'ACTIVA',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    negocio_id: '00000000-0000-0000-0000-000000000001',
    consecutivo: 1002,
    nombre_cliente: 'María Camila Restrepo',
    celular_cliente: '3159876543',
    tipo_cuenta: 'SEPARE',
    concepto_articulo: 'Vestido de Fiesta Esmeralda + Tacones Charol',
    valor_inicial: 220000,
    saldo_pendiente: 0,
    estado: 'PAGADA',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    negocio_id: '00000000-0000-0000-0000-000000000001',
    consecutivo: 1003,
    nombre_cliente: 'Don Hernán Ramírez',
    celular_cliente: '3001122334',
    tipo_cuenta: 'FIADO',
    concepto_articulo: 'Pantalón Jean Clásico, 2 Camisas Polo, 3 Pares de Medias, Correa Cuero',
    valor_inicial: 145000,
    saldo_pendiente: 65000,
    estado: 'ACTIVA',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    negocio_id: '00000000-0000-0000-0000-000000000001',
    consecutivo: 1004,
    nombre_cliente: 'Diana Marcela Torres',
    celular_cliente: '3185566778',
    tipo_cuenta: 'FIADO',
    concepto_articulo: '2 lb Arroz Diana, 1 Aceite Premier 500ml, 1 Cubeta Huevos AA, 2 Bolsas Leche Alquería, 1 Libra Queso Costeño',
    valor_inicial: 180000,
    saldo_pendiente: 180000,
    estado: 'ACTIVA',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
];

const SEED_MOVIMIENTOS: Movimiento[] = [
  {
    id: 'm1',
    cuenta_id: '11111111-1111-1111-1111-111111111111',
    negocio_id: '00000000-0000-0000-0000-000000000001',
    tipo_movimiento: 'ABONO',
    monto: 100000,
    saldo_anterior: 280000,
    saldo_nuevo: 180000,
    metodo_pago: 'EFECTIVO',
    nota: 'Abono inicial de apartado',
    creado_por_rol: 'CAJERO',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'm2',
    cuenta_id: '11111111-1111-1111-1111-111111111111',
    negocio_id: '00000000-0000-0000-0000-000000000001',
    tipo_movimiento: 'ABONO',
    monto: 60000,
    saldo_anterior: 180000,
    saldo_nuevo: 120000,
    metodo_pago: 'TRANSFERENCIA',
    nota: 'Segundo abono Nequi',
    creado_por_rol: 'CAJERO',
    created_at: new Date().toISOString(), // Hoy
  },
  {
    id: 'm3',
    cuenta_id: '33333333-3333-3333-3333-333333333333',
    negocio_id: '00000000-0000-0000-0000-000000000001',
    tipo_movimiento: 'ABONO',
    monto: 85000,
    saldo_anterior: 145000,
    saldo_nuevo: 65000,
    metodo_pago: 'EFECTIVO',
    nota: 'Abono en efectivo en mostrador',
    creado_por_rol: 'CAJERO',
    created_at: new Date().toISOString(), // Hoy
  },
];

export const AccountService = {
  // Cargar cuentas
  async getCuentas(negocioId: string): Promise<Cuenta[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('cuentas')
          .select('*')
          .eq('negocio_id', negocioId)
          .order('updated_at', { ascending: false });
        if (!error && data && data.length > 0) {
          localStorage.setItem(STORAGE_KEY_CUENTAS, JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.warn('Fallback a almacenamiento local para cuentas:', e);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY_CUENTAS);
    if (saved) return JSON.parse(saved);
    localStorage.setItem(STORAGE_KEY_CUENTAS, JSON.stringify(SEED_CUENTAS));
    return SEED_CUENTAS;
  },

  // Cargar movimientos de una cuenta
  async getMovimientos(cuentaId: string): Promise<Movimiento[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('movimientos')
          .select('*')
          .eq('cuenta_id', cuentaId)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback a almacenamiento local para movimientos:', e);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY_MOVIMIENTOS);
    const allMovimientos: Movimiento[] = saved ? JSON.parse(saved) : SEED_MOVIMIENTOS;
    return allMovimientos.filter(m => m.cuenta_id === cuentaId);
  },

  // Crear una nueva cuenta en <5 segundos
  async createCuenta(
    negocioId: string,
    data: {
      nombre_cliente: string;
      celular_cliente: string;
      tipo_cuenta: TipoCuenta;
      concepto_articulo: string;
      valor_inicial: number;
      abono_inicial?: number;
      metodo_pago_inicial?: MetodoPago;
    },
    rol: RolUsuario
  ): Promise<{ cuenta: Cuenta; movimientoInicial?: Movimiento }> {
    const cuentas = await this.getCuentas(negocioId);
    const nextConsecutivo = cuentas.length > 0 ? Math.max(...cuentas.map(c => c.consecutivo)) + 1 : 1001;
    
    const valorTotal = data.valor_inicial;
    const abonoInicial = data.abono_inicial || 0;
    
    // En Separe: saldo pendiente = total - abono inicial
    // En Fiado: saldo pendiente = total - abono inicial
    const saldoPendiente = Math.max(0, valorTotal - abonoInicial);
    const estado = saldoPendiente === 0 ? 'PAGADA' : 'ACTIVA';

    const nuevaCuenta: Cuenta = {
      id: crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}`,
      negocio_id: negocioId,
      consecutivo: nextConsecutivo,
      nombre_cliente: data.nombre_cliente.trim(),
      celular_cliente: data.celular_cliente.trim(),
      tipo_cuenta: data.tipo_cuenta,
      concepto_articulo: data.concepto_articulo.trim(),
      valor_inicial: valorTotal,
      saldo_pendiente: saldoPendiente,
      estado,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let movimientoInicial: Movimiento | undefined;

    if (abonoInicial > 0) {
      movimientoInicial = {
        id: crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}`,
        cuenta_id: nuevaCuenta.id,
        negocio_id: negocioId,
        tipo_movimiento: 'ABONO',
        monto: abonoInicial,
        saldo_anterior: valorTotal,
        saldo_nuevo: saldoPendiente,
        metodo_pago: data.metodo_pago_inicial || 'EFECTIVO',
        nota: data.tipo_cuenta === 'SEPARE' ? 'Abono inicial de apartado' : 'Abono inicial de cuenta',
        creado_por_rol: rol,
        created_at: new Date().toISOString(),
      };
    }

    // Persistir localmente
    const updatedCuentas = [nuevaCuenta, ...cuentas];
    localStorage.setItem(STORAGE_KEY_CUENTAS, JSON.stringify(updatedCuentas));

    if (movimientoInicial) {
      const savedMovs = localStorage.getItem(STORAGE_KEY_MOVIMIENTOS);
      const allMovs: Movimiento[] = savedMovs ? JSON.parse(savedMovs) : SEED_MOVIMIENTOS;
      localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify([movimientoInicial, ...allMovs]));
    }

    // Si Supabase está disponible, sincronizar
    if (isSupabaseConfigured) {
      try {
        await supabase.from('cuentas').insert(nuevaCuenta);
        if (movimientoInicial) {
          await supabase.from('movimientos').insert(movimientoInicial);
        }
      } catch (err) {
        console.warn('Error sincronizando con Supabase, guardado localmente:', err);
      }
    }

    return { cuenta: nuevaCuenta, movimientoInicial };
  },

  // Registrar abono o cargo en 1 toque
  async registerMovimiento(
    cuenta: Cuenta,
    tipo: TipoMovimiento,
    monto: number,
    metodoPago: MetodoPago,
    nota: string,
    rol: RolUsuario
  ): Promise<{ cuenta: Cuenta; movimiento: Movimiento }> {
    if (monto <= 0) throw new Error('El monto debe ser mayor a 0');

    const saldoAnterior = cuenta.saldo_pendiente;
    let saldoNuevo = saldoAnterior;

    if (tipo === 'ABONO') {
      saldoNuevo = Math.max(0, saldoAnterior - monto);
    } else if (tipo === 'CARGO') {
      saldoNuevo = saldoAnterior + monto;
    }

    const nuevoEstado = saldoNuevo === 0 ? 'PAGADA' : 'ACTIVA';

    const nuevoMovimiento: Movimiento = {
      id: crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}`,
      cuenta_id: cuenta.id,
      negocio_id: cuenta.negocio_id,
      tipo_movimiento: tipo,
      monto,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo,
      metodo_pago: metodoPago,
      nota: nota.trim() || (tipo === 'ABONO' ? 'Abono recibido en mostrador' : 'Cargo mercancía a crédito'),
      creado_por_rol: rol,
      created_at: new Date().toISOString(),
    };

    const cuentaActualizada: Cuenta = {
      ...cuenta,
      saldo_pendiente: saldoNuevo,
      estado: nuevoEstado,
      updated_at: new Date().toISOString(),
    };

    // Actualizar local
    const cuentas = await this.getCuentas(cuenta.negocio_id);
    const updatedCuentas = cuentas.map(c => (c.id === cuenta.id ? cuentaActualizada : c));
    localStorage.setItem(STORAGE_KEY_CUENTAS, JSON.stringify(updatedCuentas));

    const savedMovs = localStorage.getItem(STORAGE_KEY_MOVIMIENTOS);
    const allMovs: Movimiento[] = savedMovs ? JSON.parse(savedMovs) : SEED_MOVIMIENTOS;
    localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify([nuevoMovimiento, ...allMovs]));

    // Sincronizar en background si Supabase está activo
    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('registrar_movimiento_pos', {
          p_cuenta_id: cuenta.id,
          p_tipo_movimiento: tipo,
          p_monto: monto,
          p_metodo_pago: metodoPago,
          p_nota: nota,
          p_rol: rol,
        });
      } catch (err) {
        console.warn('RPC Supabase omitido, guardado en motor local:', err);
      }
    }

    return { cuenta: cuentaActualizada, movimiento: nuevoMovimiento };
  },

  // Resumen del cuadre de caja diario
  async getCuadreCaja(negocioId: string): Promise<CuadreCajaResumen> {
    const cuentas = await this.getCuentas(negocioId);
    const savedMovs = localStorage.getItem(STORAGE_KEY_MOVIMIENTOS);
    const allMovs: Movimiento[] = savedMovs ? JSON.parse(savedMovs) : SEED_MOVIMIENTOS;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const movimientosHoy = allMovs.filter(m => {
      const fecha = new Date(m.created_at);
      return fecha >= todayStart && m.tipo_movimiento === 'ABONO';
    });

    const totalEfectivoHoy = movimientosHoy
      .filter(m => m.metodo_pago === 'EFECTIVO')
      .reduce((sum, m) => sum + m.monto, 0);

    const totalTransferenciaHoy = movimientosHoy
      .filter(m => m.metodo_pago === 'TRANSFERENCIA')
      .reduce((sum, m) => sum + m.monto, 0);

    const totalPorCobrarCartera = cuentas
      .filter(c => c.estado === 'ACTIVA')
      .reduce((sum, c) => sum + c.saldo_pendiente, 0);

    const totalClientesActivos = cuentas.filter(c => c.estado === 'ACTIVA').length;

    return {
      totalAbonosHoy: totalEfectivoHoy + totalTransferenciaHoy,
      totalEfectivoHoy,
      totalTransferenciaHoy,
      totalPorCobrarCartera,
      totalClientesActivos,
    };
  },
};
