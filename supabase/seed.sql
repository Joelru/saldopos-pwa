-- ==============================================================================
-- DATOS SEED PARA PRUEBAS: BOUTIQUE & CALZADO STYLO URBANO (SALDOS)
-- ==============================================================================

-- 1. Asegurar que owner_user_id permita NULL (para operar sin requerir login email/password en el datáfono)
ALTER TABLE public.negocios ALTER COLUMN owner_user_id DROP NOT NULL;

-- 2. Actualizar políticas RLS para que el datáfono (con anon key) pueda operar en mostrador
DROP POLICY IF EXISTS "negocios_owner_all" ON public.negocios;
DROP POLICY IF EXISTS "negocios_access_policy" ON public.negocios;
CREATE POLICY "negocios_access_policy" ON public.negocios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cuentas_negocio_all" ON public.cuentas;
DROP POLICY IF EXISTS "cuentas_access_policy" ON public.cuentas;
CREATE POLICY "cuentas_access_policy" ON public.cuentas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "movimientos_negocio_select_insert" ON public.movimientos;
DROP POLICY IF EXISTS "movimientos_access_policy" ON public.movimientos;
CREATE POLICY "movimientos_access_policy" ON public.movimientos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Poblar datos demo del negocio, cuentas y movimientos
DO $$
DECLARE
    v_user_id UUID;
    v_negocio_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
    v_cuenta_1 UUID := '11111111-1111-1111-1111-111111111111'::uuid;
    v_cuenta_2 UUID := '22222222-2222-2222-2222-222222222222'::uuid;
    v_cuenta_3 UUID := '33333333-3333-3333-3333-333333333333'::uuid;
    v_cuenta_4 UUID := '44444444-4444-4444-4444-444444444444'::uuid;
BEGIN
    -- Obtener id de auth si existe, de lo contrario NULL (sin violar foreign key)
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;

    -- A. Insertar Negocio Demo (PIN Dueño: "1234", PIN Cajero: "4321")
    INSERT INTO public.negocios (
        id,
        owner_user_id,
        nombre_local,
        telefono,
        direccion,
        logo_url,
        pin_dueno_hash,
        pin_cajero_hash,
        mensaje_pie_tirilla,
        activo,
        fecha_vencimiento
    ) VALUES (
        v_negocio_id,
        v_user_id,
        'Boutique & Calzado Stylo Urbano',
        '3104567890',
        'Cra 7 # 14-32 Centro Comercial Galerías Local 108',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop',
        '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', -- sha256 de "1234"
        'd74ff0ee8da3b9806b18c877dbf29bbde50b5bd8e4dad7a3a725000feb82e8f1', -- sha256 de "4321"
        '¡Agradecemos su preferencia! Conserve esta tirilla como comprobante oficial de su abono.',
        TRUE,
        NOW() + INTERVAL '1 year'
    ) ON CONFLICT (id) DO UPDATE SET
        nombre_local = EXCLUDED.nombre_local,
        pin_dueno_hash = EXCLUDED.pin_dueno_hash,
        pin_cajero_hash = EXCLUDED.pin_cajero_hash;

    -- B. Insertar Cuentas Demo
    -- Cuenta 1: PLAN SEPARE ACTIVO (Zapatillas Nike)
    INSERT INTO public.cuentas (
        id,
        negocio_id,
        consecutivo,
        nombre_cliente,
        celular_cliente,
        tipo_cuenta,
        concepto_articulo,
        valor_inicial,
        saldo_pendiente,
        estado
    ) VALUES (
        v_cuenta_1,
        v_negocio_id,
        1001,
        'Carlos Alberto Gómez',
        '3124567890',
        'SEPARE',
        'Zapatillas Nike Air Max Blancas (Talla 41)',
        280000.00,
        120000.00,
        'ACTIVA'
    ) ON CONFLICT (id) DO NOTHING;

    -- Cuenta 2: PLAN SEPARE PAGADO LIQUIDADO
    INSERT INTO public.cuentas (
        id,
        negocio_id,
        consecutivo,
        nombre_cliente,
        celular_cliente,
        tipo_cuenta,
        concepto_articulo,
        valor_inicial,
        saldo_pendiente,
        estado
    ) VALUES (
        v_cuenta_2,
        v_negocio_id,
        1002,
        'María Camila Restrepo',
        '3159876543',
        'SEPARE',
        'Vestido de Fiesta Esmeralda + Tacones Charol',
        220000.00,
        0.00,
        'PAGADA'
    ) ON CONFLICT (id) DO NOTHING;

    -- Cuenta 3: FIADO / CUENTA ABIERTA
    INSERT INTO public.cuentas (
        id,
        negocio_id,
        consecutivo,
        nombre_cliente,
        celular_cliente,
        tipo_cuenta,
        concepto_articulo,
        valor_inicial,
        saldo_pendiente,
        estado
    ) VALUES (
        v_cuenta_3,
        v_negocio_id,
        1003,
        'Don Hernán Ramírez',
        '3001122334',
        'FIADO',
        'Pantalón Jean Clásico + 2 Camisas Polo',
        145000.00,
        65000.00,
        'ACTIVA'
    ) ON CONFLICT (id) DO NOTHING;

    -- Cuenta 4: FIADO / CUENTA ABIERTA RECIENTE
    INSERT INTO public.cuentas (
        id,
        negocio_id,
        consecutivo,
        nombre_cliente,
        celular_cliente,
        tipo_cuenta,
        concepto_articulo,
        valor_inicial,
        saldo_pendiente,
        estado
    ) VALUES (
        v_cuenta_4,
        v_negocio_id,
        1004,
        'Diana Marcela Torres',
        '3185566778',
        'FIADO',
        'Chaqueta Cuero Sintético Café',
        180000.00,
        180000.00,
        'ACTIVA'
    ) ON CONFLICT (id) DO NOTHING;

    -- C. Movimientos Históricos Iniciales
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
        created_at
    ) VALUES
    -- Abono inicial Separe Carlos
    (v_cuenta_1, v_negocio_id, 'ABONO', 100000.00, 280000.00, 180000.00, 'EFECTIVO', 'Abono inicial de apartado', 'CAJERO', NOW() - INTERVAL '4 days'),
    (v_cuenta_1, v_negocio_id, 'ABONO', 60000.00, 180000.00, 120000.00, 'TRANSFERENCIA', 'Segundo abono Nequi', 'CAJERO', NOW() - INTERVAL '1 day'),

    -- Separe María Camila (Liquidado)
    (v_cuenta_2, v_negocio_id, 'ABONO', 100000.00, 220000.00, 120000.00, 'EFECTIVO', 'Apartado inicial', 'CAJERO', NOW() - INTERVAL '10 days'),
    (v_cuenta_2, v_negocio_id, 'ABONO', 120000.00, 120000.00, 0.00, 'TRANSFERENCIA', 'Liquidación total y entrega', 'DUENO', NOW() - INTERVAL '2 days'),

    -- Fiado Don Hernán
    (v_cuenta_3, v_negocio_id, 'CARGO', 145000.00, 0.00, 145000.00, 'EFECTIVO', 'Mercancía fiada autorizada', 'DUENO', NOW() - INTERVAL '5 days'),
    (v_cuenta_3, v_negocio_id, 'ABONO', 80000.00, 145000.00, 65000.00, 'EFECTIVO', 'Abono en efectivo en tienda', 'CAJERO', NOW() - INTERVAL '1 day'),

    -- Fiado Diana Torres
    (v_cuenta_4, v_negocio_id, 'CARGO', 180000.00, 0.00, 180000.00, 'EFECTIVO', 'Entrega de chaqueta fiada', 'DUENO', NOW() - INTERVAL '3 hours')
    ON CONFLICT DO NOTHING;

END $$;
