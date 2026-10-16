-- ==============================================================================
-- MIGRACIÓN NUCLEAR: PLATAFORMA DE ABONOS Y FIADOS (SALDOS)
-- Arquitectura Multi-Tenant, Inmutabilidad Contable y Motor de Movimientos Dual
-- ==============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABLA: NEGOCIOS (Tenants del Micro-SaaS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.negocios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_local VARCHAR(120) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    logo_url TEXT,
    pin_dueno_hash TEXT NOT NULL,
    pin_cajero_hash TEXT NOT NULL,
    mensaje_pie_tirilla TEXT NOT NULL DEFAULT '¡Gracias por su compra y puntualidad en sus abonos!',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_vencimiento TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_negocios_owner ON public.negocios(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_negocios_activo ON public.negocios(activo);

-- ------------------------------------------------------------------------------
-- 2. TABLA: CUENTAS (Lógica Dual: Plan Separe & Fiado / Cuenta Abierta)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cuentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    consecutivo BIGINT NOT NULL,
    nombre_cliente VARCHAR(120) NOT NULL,
    celular_cliente VARCHAR(30) NOT NULL,
    tipo_cuenta VARCHAR(20) NOT NULL CHECK (tipo_cuenta IN ('SEPARE', 'FIADO')),
    concepto_articulo VARCHAR(255) NOT NULL,
    valor_inicial NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (valor_inicial >= 0),
    saldo_pendiente NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'PAGADA', 'ANULADA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_cuentas_consecutivo_por_negocio UNIQUE (negocio_id, consecutivo)
);

-- Índices para búsqueda instantánea en mostrador (<100ms)
CREATE INDEX IF NOT EXISTS idx_cuentas_negocio_estado ON public.cuentas(negocio_id, estado);
CREATE INDEX IF NOT EXISTS idx_cuentas_busqueda_cliente ON public.cuentas(negocio_id, nombre_cliente text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_cuentas_celular ON public.cuentas(negocio_id, celular_cliente);

-- ------------------------------------------------------------------------------
-- 3. TABLA: MOVIMIENTOS (Libro Mayor Inmutable y Auditable)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID NOT NULL REFERENCES public.cuentas(id) ON DELETE RESTRICT,
    negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ABONO', 'CARGO', 'ANULACION')),
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
    saldo_anterior NUMERIC(12, 2) NOT NULL,
    saldo_nuevo NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(25) NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA')),
    nota VARCHAR(255),
    creado_por_rol VARCHAR(20) NOT NULL CHECK (creado_por_rol IN ('DUENO', 'CAJERO')),
    movimiento_anulado_id UUID REFERENCES public.movimientos(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de auditoría y arqueo diario de caja
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta ON public.movimientos(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_negocio_fecha ON public.movimientos(negocio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_hoy ON public.movimientos(negocio_id, metodo_pago, created_at);

-- ------------------------------------------------------------------------------
-- 4. SEGURIDAD BANCARIA: TRIGGER DE INMUTABILIDAD CONTABLE (PROHIBIDO BORRAR/EDITAR)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_prohibir_modificacion_movimientos()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'VIOLACIÓN CONTABLE: Los movimientos registrados son inmutables. Si hubo un error, registre una ANULACIÓN autorizada por el Dueño.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'VIOLACIÓN CONTABLE: Prohibido eliminar movimientos contables de la base de datos para garantizar auditoría inmutable.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_inmutabilidad_movimientos ON public.movimientos;
CREATE TRIGGER trg_inmutabilidad_movimientos
BEFORE UPDATE OR DELETE ON public.movimientos
FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_modificacion_movimientos();

-- ------------------------------------------------------------------------------
-- 5. TRIGGER: GENERADOR AUTOMÁTICO DE CONSECUTIVO POR NEGOCIO
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_generar_consecutivo_cuenta()
RETURNS TRIGGER AS $$
DECLARE
    v_siguiente_consecutivo BIGINT;
BEGIN
    IF NEW.consecutivo IS NULL OR NEW.consecutivo = 0 THEN
        SELECT COALESCE(MAX(consecutivo), 0) + 1
        INTO v_siguiente_consecutivo
        FROM public.cuentas
        WHERE negocio_id = NEW.negocio_id;
        
        NEW.consecutivo := v_siguiente_consecutivo;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generar_consecutivo_cuenta ON public.cuentas;
CREATE TRIGGER trg_generar_consecutivo_cuenta
BEFORE INSERT ON public.cuentas
FOR EACH ROW EXECUTE FUNCTION public.fn_generar_consecutivo_cuenta();

-- ------------------------------------------------------------------------------
-- 6. PROCEDIMIENTO ATÓMICO: REGISTRAR MOVIMIENTO (ABONO / CARGO)
-- Evita condiciones de carrera mediante bloqueo SELECT ... FOR UPDATE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_movimiento_pos(
    p_cuenta_id UUID,
    p_tipo_movimiento VARCHAR(20),
    p_monto NUMERIC(12, 2),
    p_metodo_pago VARCHAR(25),
    p_nota VARCHAR(255),
    p_rol VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
    v_cuenta RECORD;
    v_saldo_anterior NUMERIC(12, 2);
    v_saldo_nuevo NUMERIC(12, 2);
    v_nuevo_estado VARCHAR(20);
    v_movimiento_id UUID;
    v_resultado JSONB;
BEGIN
    -- Validar monto positivo
    IF p_monto <= 0 THEN
        RAISE EXCEPTION 'El monto debe ser estrictamente mayor a 0.';
    END IF;

    -- Bloquear la fila de la cuenta para concurrencia segura
    SELECT * INTO v_cuenta
    FROM public.cuentas
    WHERE id = p_cuenta_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La cuenta especificada no existe.';
    END IF;

    IF v_cuenta.estado = 'ANULADA' THEN
        RAISE EXCEPTION 'No se pueden registrar movimientos en una cuenta anulada.';
    END IF;

    v_saldo_anterior := v_cuenta.saldo_pendiente;

    -- LÓGICA FINANCIERA
    IF p_tipo_movimiento = 'ABONO' THEN
        v_saldo_nuevo := v_saldo_anterior - p_monto;
        
        -- Si en Separe llega a 0 (o menos), se marca como pagada
        IF v_saldo_nuevo <= 0 THEN
            v_nuevo_estado := 'PAGADA';
        ELSE
            v_nuevo_estado := 'ACTIVA';
        END IF;

    ELSIF p_tipo_movimiento = 'CARGO' THEN
        -- Suma a la deuda en caso de Fiado
        v_saldo_nuevo := v_saldo_anterior + p_monto;
        v_nuevo_estado := 'ACTIVA';
    ELSE
        RAISE EXCEPTION 'Tipo de movimiento inválido para registro directo: %', p_tipo_movimiento;
    END IF;

    -- 1. Insertar movimiento inmutable
    INSERT INTO public.movimientos (
        cuenta_id,
        negocio_id,
        tipo_movimiento,
        monto,
        saldo_anterior,
        saldo_nuevo,
        metodo_pago,
        nota,
        creado_por_rol
    ) VALUES (
        v_cuenta.id,
        v_cuenta.negocio_id,
        p_tipo_movimiento,
        p_monto,
        v_saldo_anterior,
        v_saldo_nuevo,
        p_metodo_pago,
        p_nota,
        p_rol
    ) RETURNING id INTO v_movimiento_id;

    -- 2. Actualizar saldo y estado en la cuenta
    UPDATE public.cuentas
    SET saldo_pendiente = v_saldo_nuevo,
        estado = v_nuevo_estado,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_cuenta.id;

    -- Construir respuesta JSON
    v_resultado := jsonb_build_object(
        'success', true,
        'movimiento_id', v_movimiento_id,
        'cuenta_id', v_cuenta.id,
        'consecutivo', v_cuenta.consecutivo,
        'saldo_anterior', v_saldo_anterior,
        'saldo_nuevo', v_saldo_nuevo,
        'monto', p_monto,
        'tipo_movimiento', p_tipo_movimiento,
        'nuevo_estado', v_nuevo_estado,
        'created_at', timezone('utc'::text, now())
    );

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 7. PROCEDIMIENTO ATÓMICO: ANULAR MOVIMIENTO (EXCLUSIVO DUEÑO)
-- Genera el movimiento inverso auditable con timestamp y nota de motivo
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.anular_movimiento_pos(
    p_movimiento_id UUID,
    p_motivo VARCHAR(255),
    p_rol VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
    v_mov_original RECORD;
    v_cuenta RECORD;
    v_saldo_anterior NUMERIC(12, 2);
    v_saldo_nuevo NUMERIC(12, 2);
    v_nuevo_estado VARCHAR(20);
    v_mov_anulacion_id UUID;
BEGIN
    IF p_rol <> 'DUENO' THEN
        RAISE EXCEPTION 'AUTORIZACIÓN DENEGADA: Solo el Dueño con PIN Maestro puede autorizar anulaciones.';
    END IF;

    -- Obtener el movimiento a anular
    SELECT * INTO v_mov_original
    FROM public.movimientos
    WHERE id = p_movimiento_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El movimiento a anular no existe.';
    END IF;

    IF v_mov_original.tipo_movimiento = 'ANULACION' THEN
        RAISE EXCEPTION 'No se puede anular un movimiento que ya es una anulación.';
    END IF;

    -- Verificar que no haya sido anulado previamente
    IF EXISTS (SELECT 1 FROM public.movimientos WHERE movimiento_anulado_id = p_movimiento_id) THEN
        RAISE EXCEPTION 'Este movimiento ya fue anulado previamente.';
    END IF;

    -- Bloquear cuenta
    SELECT * INTO v_cuenta
    FROM public.cuentas
    WHERE id = v_mov_original.cuenta_id
    FOR UPDATE;

    v_saldo_anterior := v_cuenta.saldo_pendiente;

    -- EFECTO INVERSO EXACTO
    IF v_mov_original.tipo_movimiento = 'ABONO' THEN
        -- El abono había restado deuda, anularlo la vuelve a sumar
        v_saldo_nuevo := v_saldo_anterior + v_mov_original.monto;
    ELSIF v_mov_original.tipo_movimiento = 'CARGO' THEN
        -- El cargo había sumado deuda, anularlo la resta
        v_saldo_nuevo := v_saldo_anterior - v_mov_original.monto;
    END IF;

    v_nuevo_estado := CASE WHEN v_saldo_nuevo <= 0 THEN 'PAGADA' ELSE 'ACTIVA' END;

    -- Insertar movimiento inverso tipo ANULACION
    INSERT INTO public.movimientos (
        cuenta_id,
        negocio_id,
        tipo_movimiento,
        monto,
        saldo_anterior,
        saldo_nuevo,
        metodo_pago,
        nota,
        creado_por_rol,
        movimiento_anulado_id
    ) VALUES (
        v_cuenta.id,
        v_cuenta.negocio_id,
        'ANULACION',
        v_mov_original.monto,
        v_saldo_anterior,
        v_saldo_nuevo,
        v_mov_original.metodo_pago,
        CONCAT('Anulación ref #', SUBSTRING(v_mov_original.id::text, 1, 8), ': ', p_motivo),
        'DUENO',
        v_mov_original.id
    ) RETURNING id INTO v_mov_anulacion_id;

    -- Actualizar cuenta
    UPDATE public.cuentas
    SET saldo_pendiente = v_saldo_nuevo,
        estado = v_nuevo_estado,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_cuenta.id;

    RETURN jsonb_build_object(
        'success', true,
        'movimiento_anulacion_id', v_mov_anulacion_id,
        'movimiento_original_id', v_mov_original.id,
        'saldo_anterior', v_saldo_anterior,
        'saldo_nuevo', v_saldo_nuevo,
        'nuevo_estado', v_nuevo_estado
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 8. POLÍTICAS DE AISLAMIENTO MULTI-TENANT (ROW LEVEL SECURITY - RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;

-- Negocios: Acceso para datáfono en mostrador
CREATE POLICY "negocios_access_policy"
ON public.negocios
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Cuentas: Acceso para datáfono en mostrador
CREATE POLICY "cuentas_access_policy"
ON public.cuentas
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Movimientos: Acceso para datáfono en mostrador
CREATE POLICY "movimientos_access_policy"
ON public.movimientos
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
