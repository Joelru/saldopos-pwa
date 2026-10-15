import React from 'react';
import { 
  CreditCard, 
  Sparkles, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  Receipt, 
  Zap, 
  BookX
} from 'lucide-react';
import { usePinAuth } from '../auth-pin/PinAuthContext';

interface LandingPageProps {
  onOpenAuth: (mode: 'register' | 'login') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { enterDemoMode } = usePinAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/70 via-slate-50 to-emerald-50/40 text-slate-800 flex flex-col font-sans selection:bg-brand-pastel selection:text-brand-dark relative overflow-x-hidden">
      {/* Luz ambiental decorativa de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-gradient-to-tr from-sky-400/15 via-brand/10 to-emerald-400/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-sky-100/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white shadow-md shadow-brand/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-brand-navy tracking-tight">Saldo</span>
              <span className="block text-[10px] text-slate-400 -mt-0.5 font-semibold">Abonos & Fiados</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Acceso Rápido Demo */}
            <button
              onClick={() => enterDemoMode('DUENO')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/90 rounded-xl transition-all border border-emerald-300/60 shadow-xs active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Probar Demo</span>
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-brand-dark hover:bg-slate-100 rounded-xl transition-all"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 text-xs font-extrabold text-white bg-brand hover:bg-brand-hover rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Registrar mi Tienda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/90 text-brand-dark border border-brand/30 shadow-xs backdrop-blur-xs">
          <Sparkles className="w-4 h-4 text-brand" />
          <span>Fácil, rápido y sin enredos tecnológicos</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-heading tracking-tight leading-tight max-w-4xl mx-auto">
          La Libreta Digital de <span className="bg-gradient-to-r from-brand via-sky-600 to-emerald-600 bg-clip-text text-transparent">Abonos y Fiados</span> para tu Tienda
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Pensada para tiendas de ropa, calzado, ópticas, mueblerías y joyerías. Dile adiós al cuaderno de papel: anota abonos en <strong>5 segundos</strong> y envía el comprobante por WhatsApp a tus clientes <strong>sin pagar nada por mensajes</strong>.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm shadow-pos-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Empezar Gratis con mi Tienda</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => enterDemoMode('DUENO')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>⚡ Probar Tienda Demo (Sin Registro)</span>
          </button>
        </div>

        {/* Píldoras de Valor Humano */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 pt-3">
          <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-semantic-abono" />
            <span>Funciona en celular y en computador portátil</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-semantic-abono" />
            <span>Sin programas pesados de facturación</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-semantic-abono" />
            <span>Cuentas claras y sin discusiones</span>
          </div>
        </div>
      </section>

      {/* Visual de Demostración */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-b from-brand/5 to-transparent p-6 sm:p-10 rounded-3xl border border-brand/20 shadow-pos relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Lado Izquierdo: Simulación de Cobro Sencillo */}
            <div className="bg-white rounded-3xl border border-cloud-border p-5 shadow-pos-lg max-w-sm mx-auto w-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-xs">
                    S
                  </div>
                  <span className="font-bold text-xs text-slate-heading">Boutique Stylo Urbano</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  Plan Separe
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente</span>
                <span className="text-base font-extrabold text-slate-heading block">Carlos Alberto Gómez</span>
                <span className="text-xs text-slate-500 block">Zapatillas Nike Talla 41</span>
                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center font-mono">
                  <span className="text-xs text-slate-500 font-sans">Debe:</span>
                  <span className="text-xl font-black text-slate-heading">$120.000</span>
                </div>
              </div>

              {/* Botón rápido */}
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-3 rounded-xl bg-semantic-abono text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-700 transition-all"
              >
                <span>Anotar Abono de $20.000 ➔</span>
              </button>
            </div>

            {/* Lado Derecho: La Tirilla */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">
                <Receipt className="w-3.5 h-3.5" />
                <span>Comprobante Digital para WhatsApp</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-heading leading-snug">
                El recibo que le da tranquilidad a tu cliente
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Cuando tu cliente abona, el sistema le genera una imagen de recibo oficial con el valor abonado, cuánto debía y su <strong>nuevo saldo</strong>. Se lo envías directo a su WhatsApp con un solo toque.
              </p>

              {/* Botón WhatsApp */}
              <div className="pt-2">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">Envío Directo a su Celular</p>
                    <p className="text-[11px] text-emerald-700">Abre tu WhatsApp y manda la imagen sin configuraciones raras.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparativa */}
      <section className="max-w-5xl mx-auto px-4 pb-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-heading tracking-tight">
            Diseñado para que cualquier persona lo maneje sin ayuda
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            No necesitas saber de sistemas ni de contabilidad. Si sabes mandar un mensaje por WhatsApp, ya sabes usar Saldo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* El Cuaderno */}
          <div className="bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 p-6 rounded-3xl border border-rose-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-rose-700">
              <div className="p-2 rounded-xl bg-rose-100/80">
                <BookX className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base">Los problemas del cuaderno de papel</h3>
            </div>
            <ul className="text-xs text-slate-600 space-y-2.5 list-none">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span><strong>Cuentas mal sumadas:</strong> Hacer sumas con afán en el mostrador siempre deja errores.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span><strong>Discusiones con clientes:</strong> Clientes que juran haber pagado más de lo que anotaste.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span><strong>Riesgo de pérdida:</strong> Si el cuaderno se moja o se refunde, pierdes tu plata.</span>
              </li>
            </ul>
          </div>

          {/* Saldo */}
          <div className="bg-gradient-to-br from-emerald-50/50 via-white to-sky-50/40 p-6 rounded-3xl border-2 border-emerald-500 shadow-pos-lg space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-950">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base">La tranquilidad con Saldo</h3>
            </div>
            <ul className="text-xs text-slate-700 space-y-2.5 list-none">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Suma y resta automático:</strong> Nunca más una cuenta descuadrada.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Comprobante claro:</strong> El cliente guarda su foto en WhatsApp y no hay dudas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Seguro en la nube:</strong> Si cambias de celular o portátil, tu información sigue ahí.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-4 text-center text-xs text-slate-400 space-y-2 border-t border-sky-100 bg-white/40 backdrop-blur-xs">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
          <CreditCard className="w-4 h-4 text-brand" />
          <span>Saldo — Abonos y Fiados</span>
        </div>
        <p>© 2026 Saldo. Diseñado para comerciantes de mostrador en Colombia.</p>
        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
          <span>Seguro & Confiable</span>
          <span>•</span>
          <span>Sin costos ocultos</span>
          <span>•</span>
          <span>Celular y Portátil</span>
        </div>
      </footer>
    </div>
  );
};
