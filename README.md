# Kora — Control de Cartera (PWA Multi-tenant)

**Kora - Control de Cartera** es una solución Micro-SaaS B2B para digitalizar el crédito informal en comercios locales (Plan Separe y Cuentas de Fiado) con velocidad operativa de mostrador (<5 segundos por abono) y costo operativo $0 en mensajería.

## 🚀 Propuesta de Valor y Filosofía
- **Cero complejidad:** Sin inventarios engorrosos ni facturación pesada.
- **Tirilla térmica digital instantánea:** Generación de recibo visual `.png` y despacho directo por WhatsApp vía `navigator.share()` / enlaces `wa.me`.
- **Lógica Dual:**
  - **Plan Separe:** Saldo decreciente hacia $0 con abonos sucesivos.
  - **Fiado / Cuenta Corriente:** Suma con cargos (`+ Cargo`) y resta con abonos (`- Abono`).
- **Seguridad Grado Datáfono / Nequi:**
  - Multi-tenant estricto con Supabase Row Level Security (RLS).
  - Bloqueo por inactividad con PIN numérico de 4 dígitos.
  - Separación de roles: PIN Cajero vs. PIN Maestro (Dueño).
  - Inmutabilidad contable: Prohibido borrar registros; solo anulaciones auditadas autorizadas por el Dueño.

## 🛠️ Stack Tecnológico
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (PWA).
- **Backend / BaaS:** Supabase (PostgreSQL + Supabase Auth + RLS).
- **Motor Gráfico:** `html-to-image` / Canvas para tirillas digitales térmicas.

## 🌿 Flujo GitFlow
- `main`: Versión de producción estable.
- `develop`: Rama principal de integración continua.
- `feature/*`: Desarrollo de módulos específicos.
