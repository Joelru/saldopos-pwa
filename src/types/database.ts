export type TipoCuenta = 'SEPARE' | 'FIADO';
export type EstadoCuenta = 'ACTIVA' | 'PAGADA' | 'ANULADA';
export type TipoMovimiento = 'ABONO' | 'CARGO' | 'ANULACION';
export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA';
export type RolUsuario = 'DUENO' | 'CAJERO';

export interface Negocio {
  id: string;
  owner_user_id: string;
  nombre_local: string;
  telefono: string;
  direccion: string;
  logo_url?: string | null;
  pin_dueno_hash: string;
  pin_cajero_hash: string;
  mensaje_pie_tirilla: string;
  activo: boolean;
  fecha_vencimiento?: string | null;
  permite_separe?: boolean;
  permite_fiado?: boolean;
  created_at: string;
}

export interface Cuenta {
  id: string;
  negocio_id: string;
  consecutivo: number;
  nombre_cliente: string;
  celular_cliente: string;
  tipo_cuenta: TipoCuenta;
  concepto_articulo: string;
  valor_inicial: number;
  saldo_pendiente: number;
  estado: EstadoCuenta;
  created_at: string;
  updated_at: string;
}

export interface Movimiento {
  id: string;
  cuenta_id: string;
  negocio_id: string;
  tipo_movimiento: TipoMovimiento;
  monto: number;
  saldo_anterior: number;
  saldo_nuevo: number;
  metodo_pago: MetodoPago;
  nota?: string | null;
  creado_por_rol: RolUsuario;
  created_at: string;
}

export interface CuadreCajaResumen {
  totalAbonosHoy: number;
  totalEfectivoHoy: number;
  totalTransferenciaHoy: number;
  totalPorCobrarCartera: number;
  totalClientesActivos: number;
}
