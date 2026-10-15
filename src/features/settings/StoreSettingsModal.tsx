import React, { useState } from 'react';
import { X, Settings, Check, AlertCircle, ShoppingBag, BookOpen, Store, MapPin, Receipt } from 'lucide-react';
import { usePinAuth } from '../auth-pin/PinAuthContext';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({ isOpen, onClose }) => {
  const { negocio, updateNegocio } = usePinAuth();

  const [nombreLocal, setNombreLocal] = useState(negocio.nombre_local);
  const [telefono, setTelefono] = useState(negocio.telefono.replace('+57', ''));
  const [direccion, setDireccion] = useState(negocio.direccion);
  const [mensajePie, setMensajePie] = useState(negocio.mensaje_pie_tirilla);
  const [permiteSepare, setPermiteSepare] = useState(negocio.permite_separe !== false);
  const [permiteFiado, setPermiteFiado] = useState(negocio.permite_fiado !== false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleSepare = () => {
    if (permiteSepare && !permiteFiado) {
      return setError('Debes tener al menos uno de los dos sistemas activo (Plan Separe o Fiado).');
    }
    setError(null);
    setPermiteSepare(prev => !prev);
  };

  const handleToggleFiado = () => {
    if (permiteFiado && !permiteSepare) {
      return setError('Debes tener al menos uno de los dos sistemas activo (Plan Separe o Fiado).');
    }
    setError(null);
    setPermiteFiado(prev => !prev);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreLocal.trim()) {
      return setError('El nombre del local no puede estar vacío.');
    }
    if (!permiteSepare && !permiteFiado) {
      return setError('Debes mantener activo al menos uno de los sistemas: Plan Separe o Fiado.');
    }

    updateNegocio({
      nombre_local: nombreLocal.trim(),
      telefono: `+57${telefono.replace(/\D/g, '')}`,
      direccion: direccion.trim(),
      mensaje_pie_tirilla: mensajePie.trim(),
      permite_separe: permiteSepare,
      permite_fiado: permiteFiado,
    });

    setSuccessMsg('¡Ajustes guardados correctamente!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 border border-cloud-border shadow-pos-lg max-h-[92vh] overflow-y-auto no-scrollbar space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cloud-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-light border border-brand-pastel flex items-center justify-center text-brand">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-heading">Ajustes de mi Tienda</h3>
              <p className="text-xs text-slate-500">Personaliza tus modalidades y datos de mostrador</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-semantic-anulacion font-medium flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* SECCIÓN 1: Modalidades de Crédito según tipo de tienda */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                1. ¿Qué sistemas de crédito manejas en tu negocio?
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Activa solo lo que realmente usas. Si no manejas uno de ellos, apágalo para no saturar tu pantalla.
              </p>
            </div>

            {/* Tarjeta Plan Separe */}
            <div
              onClick={handleToggleSepare}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                permiteSepare
                  ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${permiteSepare ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-heading">Plan Separe (Apartados)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Ropa, Calzado, Ópticas
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      El cliente <strong>aparta un artículo fijo</strong> y la tienda lo guarda en bodega. El cliente va haciendo abonos y la prenda <strong>solo se le entrega cuando termine de pagar el 100%</strong>.
                    </p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                  permiteSepare ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {permiteSepare && <Check className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Tarjeta Fiado */}
            <div
              onClick={handleToggleFiado}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                permiteFiado
                  ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                  : 'border-slate-200 bg-slate-50/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${permiteFiado ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-heading">Fiado (Cuentas Abiertas)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        Tiendas de Barrio, Minimarkets
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      El cliente de confianza <strong>se lleva la mercancía de una vez</strong> sin pagarla completa. La tienda le va sumando deudas y el cliente abona cuando cobre quincena o cuando pueda.
                    </p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                  permiteFiado ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {permiteFiado && <Check className="w-4 h-4" />}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Datos del Local */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
              2. Datos del Comercio
            </span>

            {/* Nombre del Local */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de tu Tienda o Local</label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={nombreLocal}
                  onChange={e => setNombreLocal(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-cloud-border text-sm focus:outline-none focus:border-brand shadow-xs font-medium"
                />
              </div>
            </div>

            {/* Celular / WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Celular WhatsApp</label>
                <div className="relative flex rounded-xl border border-cloud-border shadow-xs overflow-hidden focus-within:border-brand">
                  <div className="bg-slate-50 px-2.5 py-2 border-r border-cloud-border text-xs font-bold text-slate-600">
                    +57
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={telefono}
                    onChange={e => setTelefono(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-2.5 py-2 text-sm focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Dirección / Local</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    placeholder="Ej: Cra 7 # 14-32 Local 108"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-cloud-border text-sm focus:outline-none focus:border-brand shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Mensaje de pie de tirilla */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Mensaje al pie del Comprobante de WhatsApp
              </label>
              <div className="relative">
                <Receipt className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <textarea
                  rows={2}
                  value={mensajePie}
                  onChange={e => setMensajePie(e.target.value)}
                  placeholder="Ej: ¡Agradecemos su preferencia! Conserve esta tirilla como comprobante oficial."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-cloud-border text-xs focus:outline-none focus:border-brand shadow-xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
