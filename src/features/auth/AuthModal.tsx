import React, { useState, useEffect } from 'react';
import { X, Store, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { usePinAuth } from '../auth-pin/PinAuthContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'register' | 'login';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'register',
  onClose,
  onSuccess,
}) => {
  const { registerShop, loginShop, enterDemoMode } = usePinAuth();
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [nombreLocal, setNombreLocal] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar siempre el modo cuando se abre el modal desde un botón específico
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Validación de celular colombiano: 10 dígitos y usualmente inicia en 3
  const cleanPhone = celular.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length === 10 && cleanPhone.startsWith('3');

  // Validación de email
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones para Registro
    if (mode === 'register') {
      if (!nombreLocal.trim() || nombreLocal.trim().length < 3) {
        return setError('El nombre del local o comercio debe tener al menos 3 caracteres.');
      }
      if (!isEmailValid) {
        return setError('Ingrese un correo electrónico válido con formato correcto (ej: contacto@mitienda.com).');
      }
      if (!isPhoneValid) {
        return setError('El celular colombiano debe tener exactamente 10 dígitos e iniciar en 3 (ej: 3123456789).');
      }
      if (password.length < 6) {
        return setError('La contraseña debe tener al menos 6 caracteres.');
      }

      setIsSubmitting(true);
      const res = await registerShop({
        nombre_local: nombreLocal.trim(),
        email: email.trim().toLowerCase(),
        celular: cleanPhone,
        password,
      });
      setIsSubmitting(false);

      if (!res.success) {
        return setError(res.error || 'Error registrando la tienda.');
      }

      onSuccess();
    } else {
      // Validaciones para Login
      if (!isEmailValid) {
        return setError('Ingrese su correo electrónico registrado.');
      }
      if (!password) {
        return setError('Ingrese su contraseña.');
      }

      setIsSubmitting(true);
      const res = await loginShop(email.trim().toLowerCase(), password);
      setIsSubmitting(false);

      if (!res.success) {
        return setError(res.error || 'Credenciales incorrectas o tienda no encontrada.');
      }

      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 border border-cloud-border shadow-pos-lg max-h-[92vh] overflow-y-auto no-scrollbar space-y-4">
        {/* Header con Switch de Tabs */}
        <div className="flex items-center justify-between pb-2 border-b border-cloud-border">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Registrar Tienda
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Iniciar Sesión
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Bienvenida */}
        <div>
          <h3 className="text-lg font-extrabold text-slate-heading">
            {mode === 'register' ? 'Registra tu Tienda en Saldos' : 'Iniciar Sesión en tu Tienda'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'register'
              ? 'Solo configuras tus datos una vez. Luego operarás el día a día únicamente con tu PIN de 4 números.'
              : 'Ingresa con el correo y la contraseña registrados de tu comercio.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-semantic-anulacion font-medium flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nombre de tu Local o Comercio *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Calzado & Ropa Stylo Urbano"
                  value={nombreLocal}
                  onChange={e => setNombreLocal(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cloud-border text-sm focus:outline-none focus:border-brand shadow-sm font-medium"
                />
              </div>
            </div>
          )}

          {/* Correo Electrónico */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="ejemplo@mitienda.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cloud-border text-sm focus:outline-none focus:border-brand shadow-sm font-medium"
              />
            </div>
          </div>

          {/* Celular Colombiano +57 (Solo en Registro) */}
          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Celular WhatsApp del Comercio *
              </label>
              <div className="relative flex rounded-xl border border-cloud-border shadow-sm overflow-hidden focus-within:border-brand">
                <div className="bg-slate-50 px-3 py-2.5 border-r border-cloud-border flex items-center gap-1 text-xs font-bold text-slate-700 select-none">
                  <span>🇨🇴</span>
                  <span>+57</span>
                </div>
                <div className="relative flex-1">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="312 345 6789"
                    value={celular}
                    onChange={e => setCelular(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-8 pr-3 py-2.5 text-sm focus:outline-none font-mono font-medium"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                10 dígitos numéricos (para enviar las tirillas oficiales a tus clientes).
              </p>
            </div>
          )}

          {/* Contraseña */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-cloud-border text-sm focus:outline-none focus:border-brand shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón de Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <span>Procesando...</span>
            ) : mode === 'register' ? (
              <>
                <span>Registrar mi Tienda</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Entrar a mi Tienda</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Acceso Rápido a Tienda Demo para Probar */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="text-center">
            <span className="text-[11px] text-slate-500 font-medium">¿Deseas probar el sistema de inmediato?</span>
          </div>
          <button
            type="button"
            onClick={() => {
              enterDemoMode('DUENO');
              onSuccess();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-50 to-emerald-50 hover:from-sky-100 hover:to-emerald-100 border border-sky-200 text-brand-dark text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>⚡ Probar con Tienda Demo (Boutique Stylo Urbano)</span>
          </button>
        </div>

        {/* Footer Informativo */}
        <div className="pt-1 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tus datos y cuentas quedan respaldados en la nube</span>
          </p>
        </div>
      </div>
    </div>
  );
};
