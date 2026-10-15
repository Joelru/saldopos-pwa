import React from 'react';
import { 
  CreditCard, 
  Sparkles, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  Receipt, 
  Zap, 
  BookX, 
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'register' | 'login') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-cloud-bg text-slate-800 flex flex-col font-sans selection:bg-brand-pastel selection:text-brand-dark">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-cloud-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-brand-navy tracking-tight">SaldoPOS</span>
              <span className="block text-[10px] text-slate-400 -mt-1 font-semibold">Datáfono Digital</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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
              <span>Registrar Tienda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-light text-brand-dark border border-brand-pastel shadow-xs">
          <Sparkles className="w-4 h-4 text-brand" />
          <span>Digitaliza el crédito informal en tu mostrador</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-heading tracking-tight leading-tight max-w-4xl mx-auto">
          El Datáfono Digital de <span className="text-brand">Abonos y Fiados</span> para tu Comercio
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Diseñado para tiendas de calzado, ropa, ópticas, mueblerías y joyerías. Registra un abono y envía la tirilla térmica por WhatsApp en <strong>menos de 5 segundos</strong> con <strong>costo operativo $0</strong>.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm shadow-pos-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Crear Cuenta de mi Comercio</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="/docs.html"
            target="_blank"
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Manual Técnico</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* Píldoras de Valor */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 pt-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-semantic-abono" />
            <span>PWA 100% instalable en celular</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-semantic-abono" />
            <span>Sin costos de APIs de WhatsApp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-semantic-abono" />
            <span>Bloqueo rápido por PIN</span>
          </div>
        </div>
      </section>

      {/* Visual Mockup: El Datáfono y la Tirilla */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-b from-brand/5 to-transparent p-6 sm:p-10 rounded-3xl border border-brand/20 shadow-pos relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Lado Izquierdo: Simulación de Pantalla Datáfono */}
            <div className="bg-white rounded-3xl border border-cloud-border p-5 shadow-pos-lg max-w-sm mx-auto w-full space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-xs">
                    SP
                  </div>
                  <span className="font-bold text-xs text-slate-heading">Boutique Stylo Urbano</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Cajero
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Actual</span>
                <span className="text-2xl font-black font-mono text-slate-heading">$120.000</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Carlos Alberto Gómez • Zapatillas Nike</span>
              </div>

              {/* Píldoras de Abono Rápido */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">Abono en 1 Toque:</span>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                  <button className="py-2 bg-slate-100 rounded-lg font-bold text-slate-700 hover:bg-slate-200">$10k</button>
                  <button className="py-2 bg-brand-light text-brand-dark border border-brand-pastel rounded-lg font-extrabold">$20k</button>
                  <button className="py-2 bg-slate-100 rounded-lg font-bold text-slate-700 hover:bg-slate-200">$50k</button>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-2.5 rounded-xl bg-semantic-abono text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-700 transition-all"
              >
                <span>Registrar Abono ($20.000)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lado Derecho: Simulación de la Tirilla Térmica Digital */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">
                <Receipt className="w-3.5 h-3.5" />
                <span>Tirilla Térmica Generada al Instante</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-heading leading-snug">
                El comprobante que tus clientes adoran recibir en WhatsApp
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Cada vez que recibes un abono, el sistema genera automáticamente un recibo gráfico digital idéntico al papel de un datáfono de mostrador. Cero disputas por saldos y total transparencia.
              </p>

              {/* Botón WhatsApp */}
              <div className="pt-2">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">Despacho Nativo en 1 Clic</p>
                    <p className="text-[11px] text-emerald-700">Abre WhatsApp con la imagen adjunta sin pagar costos de API.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparativa: Cuaderno de Papel vs SaldoPOS */}
      <section className="max-w-5xl mx-auto px-4 pb-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-heading tracking-tight">
            ¿Por qué los comerciantes tiran el cuaderno a la basura?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            El crédito informal (Plan Separe y Cuentas de Fiado) representa más del 40% de las ventas en el comercio local, pero gestionarlo en papel es costoso y riesgoso.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tarjeta El Cuaderno */}
          <div className="bg-white p-6 rounded-3xl border-2 border-rose-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-rose-700">
              <div className="p-2 rounded-xl bg-rose-50">
                <BookX className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base">El Cuaderno Tradicional de Papel</h3>
            </div>
            <ul className="text-xs text-slate-600 space-y-2.5 list-none">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span><strong>Pérdidas por cuentas mal sumadas:</strong> Cálculos manuales a la carrera en mostrador.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span><strong>Discusiones con clientes:</strong> "¿Cuánto le debía yo? ¿Y el abono que le dejé el sábado pasado?".</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span><strong>Riesgo total:</strong> Si el cuaderno se extravía, se moja o se rompe, pierdes tu cartera.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">✕</span>
                <span><strong>Cero cuadre de caja:</strong> Horas contando billetes sin saber cuánto entró en efectivo vs. Nequi.</span>
              </li>
            </ul>
          </div>

          {/* Tarjeta SaldoPOS */}
          <div className="bg-white p-6 rounded-3xl border-2 border-brand shadow-pos space-y-4">
            <div className="flex items-center gap-2.5 text-brand-dark">
              <div className="p-2 rounded-xl bg-brand-light">
                <Zap className="w-5 h-5 text-brand" />
              </div>
              <h3 className="font-extrabold text-base">SaldoPOS Datáfono Digital</h3>
            </div>
            <ul className="text-xs text-slate-600 space-y-2.5 list-none">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Cuentas exactas:</strong> Saldo actualizado automáticamente con inmutabilidad contable.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Tirilla de datáfono al WhatsApp:</strong> Comprobante con saldo anterior, abono y nuevo saldo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Seguridad Nequi:</strong> Bloqueo por inactividad y PIN Cajero vs. PIN Maestro de Dueño.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Cuadre diario instantáneo:</strong> Visualiza en vivo lo recibido en Efectivo vs. Transferencias.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Los 3 Pasos de Onboarding */}
      <section className="bg-white border-y border-cloud-border py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-heading">
              Cómo empezar a cobrar en tu local
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">Sin instalaciones complejas ni pagos iniciales</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-cloud-bg border border-cloud-border space-y-2">
              <div className="w-8 h-8 rounded-xl bg-brand text-white font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-heading">Registra tu Comercio</h4>
              <p className="text-xs text-slate-600">
                Ingresa el nombre de tu local, tu correo y celular colombiano.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cloud-bg border border-cloud-border space-y-2">
              <div className="w-8 h-8 rounded-xl bg-brand text-white font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-heading">Crea tu PIN de Dueño</h4>
              <p className="text-xs text-slate-600">
                Define tu PIN de 4 dígitos para proteger la cartera y autorizar anulaciones.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cloud-bg border border-cloud-border space-y-2">
              <div className="w-8 h-8 rounded-xl bg-brand text-white font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-heading">¡Listo para Cobrar!</h4>
              <p className="text-xs text-slate-600">
                Instala el datáfono en tu pantalla de inicio y cobra en menos de 5 segundos.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenAuth('register')}
            className="px-8 py-4 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm shadow-pos-lg active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <span>Comenzar Ahora Mismo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-4 text-center text-xs text-slate-400 space-y-2 border-t border-cloud-border">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
          <CreditCard className="w-4 h-4 text-brand" />
          <span>SaldoPOS — Datáfono Digital de Abonos y Fiados</span>
        </div>
        <p>© 2026 SaldoPOS. Diseñado con tecnología PWA para el comercio minorista local.</p>
        <div>
          <a href="/docs.html" className="text-brand hover:underline font-semibold">
            Manual Técnico & Arquitectura para Desarrolladores
          </a>
        </div>
      </footer>
    </div>
  );
};
