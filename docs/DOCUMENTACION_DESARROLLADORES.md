# Kora — Control de Cartera | Documentación Técnica para Desarrolladores

**Versión de Arquitectura:** `1.2.0`  
**Stack Principal:** React 18 + TypeScript + Vite 6 + Tailwind CSS + Supabase (PostgreSQL) + PWA  

---

## 1. Visión de Ingeniería y Principios de Diseño

**Kora - Control de Cartera** es una plataforma Micro-SaaS B2B enfocada en digitalizar el crédito informal en comercios locales (**Plan Separe** y **Fiado / Cuentas Abiertas**).

### Principios Técnicos Innegociables
1. **Cero fricción en mostrador (<5 segundos por operación):** Buscador en memoria (`useMemo`) con filtrado instantáneo (<10ms) y píldoras rápidas de abono.
2. **Registro e Inicio de Sesión sin bloqueo por verificación de Gmail:**
   - En lugar de depender del envío de correos de confirmación SMTP de Supabase Auth (que genera bloqueos `Email not confirmed` o errores `429 over_email_send_rate_limit`), el sistema deriva un **UUID v4 determinístico** mediante `deriveStoreUuid(email, password)` con SHA-256 en [`src/lib/crypto.ts`](../src/lib/crypto.ts).
   - Esto permite registrar tiendas nuevas y autenticarlas directamente contra `public.negocios` en <100ms desde cualquier dispositivo.
3. **Aislamiento Estricto Multi-Tenant (Store Isolation):**
   - Cada comercio opera exclusivamente bajo su `negocio_id` tanto en PostgreSQL (`public.cuentas`, `public.movimientos`) como en las particiones de almacenamiento local (`saldos_cuentas_${negocioId}`, `saldos_movimientos_${negocioId}`).
   - Toda tienda recién registrada inicia 100% limpia (`$0` cobrados, `0` cuentas), mientras que los datos semilla (`SEED_CUENTAS`, `SEED_MOVIMIENTOS`) sólo se cargan para el tenant de demostración (`00000000-0000-0000-0000-000000000001`).
4. **Inmutabilidad Contable:**
   - La tabla `public.movimientos` cuenta con un trigger de base de datos (`trg_inmutabilidad_movimientos`) que prohíbe `UPDATE` y `DELETE`.
   - Cualquier corrección se realiza mediante una anulación autorizada por el PIN Maestro del Dueño (`anular_movimiento_pos`), generando un asiento inverso auditable.
5. **Costo Operativo $0 en Mensajería (WhatsApp):**
   - El comprobante se renderiza en el cliente ([`ThermalReceipt.tsx`](../src/features/receipt/ThermalReceipt.tsx)) con ancho fijo de `340px`, sello oficial **`KORA - CONTROL DE CARTERA`** al pie, y se convierte a imagen PNG de alta definición (`pixelRatio: 2.5`) mediante `html-to-image` para compartirse vía Web Share API (`navigator.share`) o descarga + `wa.me`.

---

## 2. Arquitectura del Código

```text
├── docs/
│   ├── DOCUMENTACION_DESARROLLADORES.md  # Referencia técnica de arquitectura y base de datos
│   ├── MANUAL_CLIENTE_KORA.md            # Guía de usuario paso a paso para comerciantes
│   └── PROPUESTA_DE_VALOR_COMERCIAL.md   # Dossier comercial y propuesta de valor B2B
├── public/
│   ├── manifest.json                     # Manifiesto PWA (Kora - Control de Cartera)
│   ├── sw.js                             # Service Worker con soporte offline (kora-v1.1.0)
│   └── docs.html                         # Manual técnico interactivo HTML
├── src/
│   ├── features/
│   │   ├── landing/
│   │   │   └── LandingPage.tsx           # Landing comercial B2B + acceso 1-clic a Tienda Demo
│   │   ├── auth/
│   │   │   ├── AuthModal.tsx             # Registro y Login sin verificación de Gmail (+57)
│   │   │   └── SetupPinModal.tsx         # Configuración inicial de PIN Maestro (Dueño) y Cajero
│   │   ├── auth-pin/
│   │   │   ├── PinAuthContext.tsx        # Estado global de sesión, bloqueo 3min y sync Supabase
│   │   │   ├── PinLockScreen.tsx         # Pantalla de bloqueo tipo datáfono con teclado numérico
│   │   │   └── MasterPinModal.tsx        # Elevación de privilegios puntual con PIN de Dueño
│   │   ├── cashier/
│   │   │   ├── CashierDashboard.tsx      # Panel principal con skeleton loaders y filtros reactivos
│   │   │   └── QuickPaymentModal.tsx     # Registro en 1 toque de Abono o Cargo (+ Fiar)
│   │   ├── accounts/
│   │   │   ├── NewAccountModal.tsx       # Apertura express de cuenta (Plan Separe o Fiado)
│   │   │   └── AccountDetailModal.tsx    # Desglose de productos e historial de movimientos
│   │   ├── receipt/
│   │   │   ├── ThermalReceipt.tsx        # Tirilla térmica 340px con marca Kora al final
│   │   │   └── ReceiptModal.tsx          # Captura PNG centrada y despacho a WhatsApp
│   │   └── settings/
│   │       └── StoreSettingsModal.tsx    # Activación modular de Plan Separe / Fiado y datos
│   ├── lib/
│   │   ├── crypto.ts                     # SHA-256, fallback hex y deriveStoreUuid()
│   │   ├── formatters.ts                 # Formato moneda COP y normalización teléfonos +57
│   │   └── supabase.ts                   # Instancia cliente Supabase
│   ├── services/
│   │   └── accountService.ts             # Persistencia dual aislada por negocio_id
│   └── types/
│       └── database.ts                   # Contratos TypeScript (Negocio, Cuenta, Movimiento)
└── supabase/
    ├── migrations/
    │   ├── 20261015000000_nuclear_schema.sql
    │   └── 20261015000001_disable_confirmations_and_auto_confirm.sql
    └── seed.sql
```

---

## 3. Flujo de Autenticación y Seguridad Criptográfica

### 3.1 Derivación Determinística de Tienda (`deriveStoreUuid`)
Para eliminar la fricción de verificación de correo en mostrador:
- `deriveStoreUuid(email, password)` calcula dos hashes SHA-256 con sal criptográfica:
  - `emailHash = sha256Hex("saldos_store_email:" + email)`
  - `credHash = sha256Hex("saldos_store_cred:" + email + ":" + password)`
- Construye un UUID v4 válido (`xxxxxxxx-xxxx-4xxx-axxx-xxxxxxxxxxxx`) que actúa como llave primaria (`id`) en `public.negocios`.
- Al iniciar sesión (`loginShop`), se recalcula el UUID y se consulta `public.negocios` por llave primaria en <50ms.

### 3.2 Roles y Bloqueo Automático por Inactividad
- **Dueño (`DUENO`)**: Acceso total a métricas de cartera (*"Total por Cobrar en la Calle"*), ajustes de tienda y anulaciones.
- **Cajero (`CAJERO`)**: Puede crear cuentas, registrar abonos/cargos y enviar comprobantes por WhatsApp, pero tiene oculto el monto total de la cartera del negocio.
- **Auto-Lock (3 minutos)**: [`PinAuthContext.tsx`](../src/features/auth-pin/PinAuthContext.tsx) escucha eventos físicos (`mousedown`, `touchstart`, `keypress`, `scroll`). Tras 180 segundos sin actividad, bloquea la interfaz mostrando [`PinLockScreen.tsx`](../src/features/auth-pin/PinLockScreen.tsx).
- **Credenciales de Prueba (Modo Demo)**:
  - PIN Dueño: `1234`
  - PIN Cajero: `4321`

---

## 4. Esquema de Base de Datos (Supabase PostgreSQL)

1. **`public.negocios`**:
   - Almacena la identidad del comercio, teléfono WhatsApp (`+57`), dirección, hashes SHA-256 de los PINs (`pin_dueno_hash`, `pin_cajero_hash`) y el mensaje personalizado de pie de tirilla.
2. **`public.cuentas`**:
   - Registra cada crédito o apartado con `consecutivo` único por negocio (`trg_generar_consecutivo_cuenta`), `tipo_cuenta` (`SEPARE` | `FIADO`), `valor_inicial`, `saldo_pendiente` y `estado` (`ACTIVA` | `PAGADA` | `ANULADA`).
3. **`public.movimientos`**:
   - Libro mayor inmutable de cada `ABONO`, `CARGO` o `ANULACION` con `saldo_anterior`, `saldo_nuevo`, `metodo_pago` (`EFECTIVO` | `TRANSFERENCIA`) y `creado_por_rol`.

---

## 5. Desarrollo Local y Despliegue

### Variables de Entorno (`.env`)
```env
VITE_SUPABASE_URL=https://innzcqmwxgnuucjgepty.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_2mDuJQEZ8wnZFhtNjVe6Mg_aCFxaIrZ
```

### Comandos Principales
```bash
# Instalar dependencias
npm install

# Servidor de desarrollo local
npm run dev

# Compilación de producción (TypeScript + Vite)
npm run build
```
