import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Negocio, RolUsuario } from '../../types/database';
import { hashPin, deriveStoreUuid, DEMO_HASH_PIN_DUENO, DEMO_HASH_PIN_CAJERO } from '../../lib/crypto';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { SEED_CUENTAS, SEED_MOVIMIENTOS } from '../../services/accountService';

// Negocio por defecto si se desea probar modo demo sin registro
const DEFAULT_DEMO_NEGOCIO: Negocio = {
  id: '00000000-0000-0000-0000-000000000001',
  owner_user_id: '99999999-9999-9999-9999-999999999999',
  nombre_local: 'Boutique & Calzado Stylo Urbano',
  telefono: '+573104567890',
  direccion: 'Cra 7 # 14-32 CC Galerías Local 108',
  logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop',
  pin_dueno_hash: DEMO_HASH_PIN_DUENO,
  pin_cajero_hash: DEMO_HASH_PIN_CAJERO,
  mensaje_pie_tirilla: '¡Gracias por su compra! Conserve esta tirilla como comprobante de su abono.',
  activo: true,
  fecha_vencimiento: null,
  permite_separe: true,
  permite_fiado: true,
  created_at: new Date().toISOString(),
};

const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutos

interface PinAuthContextType {
  negocio: Negocio;
  currentRole: RolUsuario | null;
  isLocked: boolean;
  isAuthenticated: boolean;
  needsPinSetup: boolean;
  unlockWithPin: (pin: string) => Promise<{ success: boolean; role?: RolUsuario; error?: string }>;
  lockNow: () => void;
  verifyMasterPin: (pin: string) => Promise<boolean>;
  updateNegocio: (data: Partial<Negocio>) => void;
  registerShop: (data: { nombre_local: string; email: string; celular: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  loginShop: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  completePinSetup: (pinDueno: string, pinCajero: string) => Promise<{ success: boolean; error?: string }>;
  logoutShop: () => Promise<void>;
  enterDemoMode: (role?: RolUsuario) => void;
}

const PinAuthContext = createContext<PinAuthContextType | undefined>(undefined);

const KEY_AUTH = 'saldos_authenticated';
const KEY_NEGOCIO = 'saldos_negocio';
const KEY_ROLE = 'saldos_role';

const LEGACY_KEY_AUTH = 'saldopos_authenticated';
const LEGACY_KEY_NEGOCIO = 'saldopos_negocio';
const LEGACY_KEY_ROLE = 'saldopos_role';

export const PinAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado de autenticación persistente del dispositivo
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(KEY_AUTH) === 'true' || localStorage.getItem(LEGACY_KEY_AUTH) === 'true';
  });

  const [negocio, setNegocio] = useState<Negocio>(() => {
    const saved = localStorage.getItem(KEY_NEGOCIO) || localStorage.getItem(LEGACY_KEY_NEGOCIO);
    return saved ? JSON.parse(saved) : DEFAULT_DEMO_NEGOCIO;
  });

  // Requiere configurar PIN si no tiene hash definido
  const [needsPinSetup, setNeedsPinSetup] = useState<boolean>(() => {
    const saved = localStorage.getItem(KEY_NEGOCIO) || localStorage.getItem(LEGACY_KEY_NEGOCIO);
    if (!saved) return false;
    const parsed: Negocio = JSON.parse(saved);
    return !parsed.pin_dueno_hash || parsed.pin_dueno_hash === 'SETUP_PENDING' || parsed.pin_dueno_hash === '';
  });

  const [currentRole, setCurrentRole] = useState<RolUsuario | null>(() => {
    const saved = localStorage.getItem(KEY_ROLE) || localStorage.getItem(LEGACY_KEY_ROLE);
    return saved ? (saved as RolUsuario) : null;
  });

  // La pantalla siempre inicia bloqueada exigiendo PIN para operar en mostrador
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guardar negocio en localStorage al cambiar y sincronizar con Supabase
  const updateNegocio = useCallback((data: Partial<Negocio>) => {
    setNegocio(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem(KEY_NEGOCIO, JSON.stringify(updated));
      localStorage.setItem(`saldos_negocio_cache_${updated.id}`, JSON.stringify(updated));

      if (isSupabaseConfigured && prev?.id) {
        const { permite_separe: _ps, permite_fiado: _pf, ...dbColumns } = data;
        if (Object.keys(dbColumns).length > 0) {
          supabase
            .from('negocios')
            .update(dbColumns)
            .eq('id', prev.id)
            .then(({ error }) => {
              if (error) console.warn('Aviso: no se sincronizó cambio en Supabase:', error.message);
            });
        }
      }

      return updated;
    });
  }, []);

  // Bloqueo inmediato
  const lockNow = useCallback(() => {
    setIsLocked(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Reiniciar temporizador de inactividad de 3 minutos
  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLocked && isAuthenticated && !needsPinSetup) {
      timerRef.current = setTimeout(() => {
        console.log('⏰ Bloqueo automático por 3 minutos de inactividad');
        setIsLocked(true);
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [isLocked, isAuthenticated, needsPinSetup]);

  // Escuchar actividad física en mostrador (touch, click, scroll, teclado)
  useEffect(() => {
    if (isLocked || !isAuthenticated || needsPinSetup) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    resetInactivityTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLocked, isAuthenticated, needsPinSetup, resetInactivityTimer]);

  // Registrar nueva tienda directamente sin requerir verificación de Gmail
  const registerShop = async (data: {
    nombre_local: string;
    email: string;
    celular: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const nuevoNegocioId = await deriveStoreUuid(normalizedEmail, data.password);

      // Si ya existe en Supabase con ese mismo correo y contraseña, recuperarla de inmediato
      if (isSupabaseConfigured) {
        const { data: existingStore } = await supabase
          .from('negocios')
          .select('*')
          .eq('id', nuevoNegocioId)
          .maybeSingle();

        if (existingStore) {
          const restoredNegocio: Negocio = {
            ...existingStore,
            permite_separe: existingStore.permite_separe ?? true,
            permite_fiado: existingStore.permite_fiado ?? true,
          };
          setNegocio(restoredNegocio);
          localStorage.setItem(KEY_NEGOCIO, JSON.stringify(restoredNegocio));
          localStorage.setItem(`saldos_negocio_cache_${restoredNegocio.id}`, JSON.stringify(restoredNegocio));
          localStorage.setItem(KEY_AUTH, 'true');
          setIsAuthenticated(true);
          const hasPin = Boolean(restoredNegocio.pin_dueno_hash && restoredNegocio.pin_dueno_hash !== 'SETUP_PENDING');
          setNeedsPinSetup(!hasPin);
          return { success: true };
        }
      }

      // Crear la entidad Negocio sin depender de verificación por correo
      const nuevoNegocio: Negocio = {
        id: nuevoNegocioId,
        owner_user_id: nuevoNegocioId,
        nombre_local: data.nombre_local,
        telefono: `+57${data.celular}`,
        direccion: 'Mostrador Principal',
        logo_url: null,
        pin_dueno_hash: 'SETUP_PENDING',
        pin_cajero_hash: 'SETUP_PENDING',
        mensaje_pie_tirilla: `¡Gracias por su compra en ${data.nombre_local}! Conserve esta tirilla como comprobante oficial.`,
        activo: true,
        fecha_vencimiento: null,
        permite_separe: true,
        permite_fiado: true,
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        const { error: dbError } = await supabase.from('negocios').insert({
          id: nuevoNegocio.id,
          owner_user_id: null,
          nombre_local: nuevoNegocio.nombre_local,
          telefono: nuevoNegocio.telefono,
          direccion: nuevoNegocio.direccion,
          logo_url: nuevoNegocio.logo_url,
          pin_dueno_hash: nuevoNegocio.pin_dueno_hash,
          pin_cajero_hash: nuevoNegocio.pin_cajero_hash,
          mensaje_pie_tirilla: nuevoNegocio.mensaje_pie_tirilla,
          activo: nuevoNegocio.activo,
          fecha_vencimiento: nuevoNegocio.fecha_vencimiento,
          created_at: nuevoNegocio.created_at,
        });
        if (dbError) {
          console.warn('Error insertando negocio en Supabase, guardando local:', dbError);
        }
      }

      // Guardar sesión persistente en dispositivo
      setNegocio(nuevoNegocio);
      localStorage.setItem(KEY_NEGOCIO, JSON.stringify(nuevoNegocio));
      localStorage.setItem(`saldos_negocio_cache_${nuevoNegocio.id}`, JSON.stringify(nuevoNegocio));
      localStorage.setItem(KEY_AUTH, 'true');
      setIsAuthenticated(true);
      setNeedsPinSetup(true);

      // Asegurar que la nueva tienda inicie 100% limpia sin mezclar datos de otras tiendas o demo
      localStorage.setItem(`saldos_cuentas_${nuevoNegocio.id}`, JSON.stringify([]));
      localStorage.setItem(`saldos_movimientos_${nuevoNegocio.id}`, JSON.stringify([]));
      localStorage.removeItem('saldos_cuentas');
      localStorage.removeItem('saldopos_cuentas');
      localStorage.removeItem('saldos_movimientos');
      localStorage.removeItem('saldopos_movimientos');

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error inesperado en el registro.' };
    }
  };

  // Iniciar sesión con correo y contraseña sin bloqueo por verificación de Gmail
  const loginShop = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const expectedStoreId = await deriveStoreUuid(normalizedEmail, password);

      if (isSupabaseConfigured) {
        // 1. Búsqueda directa por UUID determinístico (sin depender de confirmación de correo)
        const { data: directNegocio, error: directError } = await supabase
          .from('negocios')
          .select('*')
          .eq('id', expectedStoreId)
          .maybeSingle();

        if (!directError && directNegocio) {
          const cachedLocal = localStorage.getItem(`saldos_negocio_cache_${directNegocio.id}`);
          const parsedLocal = cachedLocal ? JSON.parse(cachedLocal) : {};
          const restoredNegocio: Negocio = {
            ...directNegocio,
            permite_separe: parsedLocal.permite_separe ?? true,
            permite_fiado: parsedLocal.permite_fiado ?? true,
          };
          setNegocio(restoredNegocio);
          localStorage.setItem(KEY_NEGOCIO, JSON.stringify(restoredNegocio));
          localStorage.setItem(`saldos_negocio_cache_${restoredNegocio.id}`, JSON.stringify(restoredNegocio));
          const hasPin = Boolean(restoredNegocio.pin_dueno_hash && restoredNegocio.pin_dueno_hash !== 'SETUP_PENDING');
          setNeedsPinSetup(!hasPin);
          localStorage.setItem(KEY_AUTH, 'true');
          setIsAuthenticated(true);
          return { success: true };
        }
      }

      // 2. Fallback en caché local del navegador si no hay conexión
      const cachedStore = localStorage.getItem(`saldos_negocio_cache_${expectedStoreId}`);
      if (cachedStore) {
        const parsed: Negocio = JSON.parse(cachedStore);
        setNegocio(parsed);
        localStorage.setItem(KEY_NEGOCIO, JSON.stringify(parsed));
        const hasPin = Boolean(parsed.pin_dueno_hash && parsed.pin_dueno_hash !== 'SETUP_PENDING');
        setNeedsPinSetup(!hasPin);
        localStorage.setItem(KEY_AUTH, 'true');
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: 'Correo o contraseña incorrectos, o negocio no registrado.' };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error al iniciar sesión.' };
    }
  };

  // Completar configuración inicial del PIN Maestro de Dueño
  const completePinSetup = async (pinDueno: string, pinCajero: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const hashDueno = await hashPin(pinDueno);
      const hashCajero = await hashPin(pinCajero);

      const updatedNegocio: Negocio = {
        ...negocio,
        pin_dueno_hash: hashDueno,
        pin_cajero_hash: hashCajero,
      };

      setNegocio(updatedNegocio);
      localStorage.setItem(KEY_NEGOCIO, JSON.stringify(updatedNegocio));
      localStorage.setItem(`saldos_negocio_cache_${updatedNegocio.id}`, JSON.stringify(updatedNegocio));
      localStorage.setItem(KEY_ROLE, 'DUENO');

      if (isSupabaseConfigured) {
        try {
          await supabase
            .from('negocios')
            .update({
              pin_dueno_hash: hashDueno,
              pin_cajero_hash: hashCajero,
            })
            .eq('id', negocio.id);
        } catch (err) {
          console.warn('Error actualizando PIN en Supabase:', err);
        }
      }

      setNeedsPinSetup(false);
      setIsLocked(false);
      setCurrentRole('DUENO');

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error guardando PIN.' };
    }
  };

  // Desvincular dispositivo / Cerrar sesión
  const logoutShop = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error al cerrar sesión en Supabase:', err);
      }
    }

    localStorage.removeItem(KEY_AUTH);
    localStorage.removeItem(KEY_ROLE);
    localStorage.removeItem(KEY_NEGOCIO);
    localStorage.removeItem(LEGACY_KEY_AUTH);
    localStorage.removeItem(LEGACY_KEY_ROLE);
    localStorage.removeItem(LEGACY_KEY_NEGOCIO);
    setIsAuthenticated(false);
    setCurrentRole(null);
    setIsLocked(true);
  };

  // Cargar tienda de demostración para pruebas inmediatas
  const enterDemoMode = (role: RolUsuario = 'DUENO') => {
    setNegocio(DEFAULT_DEMO_NEGOCIO);
    localStorage.setItem(KEY_NEGOCIO, JSON.stringify(DEFAULT_DEMO_NEGOCIO));
    localStorage.setItem(KEY_AUTH, 'true');
    localStorage.setItem(KEY_ROLE, role);
    setIsAuthenticated(true);
    setNeedsPinSetup(false);
    setIsLocked(false);
    setCurrentRole(role);

    // Sembrar explícitamente en la partición del negocio demo
    const demoKeyCuentas = `saldos_cuentas_${DEFAULT_DEMO_NEGOCIO.id}`;
    const demoKeyMovs = `saldos_movimientos_${DEFAULT_DEMO_NEGOCIO.id}`;
    if (!localStorage.getItem(demoKeyCuentas)) {
      localStorage.setItem(demoKeyCuentas, JSON.stringify(SEED_CUENTAS));
    }
    if (!localStorage.getItem(demoKeyMovs)) {
      localStorage.setItem(demoKeyMovs, JSON.stringify(SEED_MOVIMIENTOS));
    }
  };

  // Desbloqueo mediante comparación hash de PIN
  const unlockWithPin = async (pin: string): Promise<{ success: boolean; role?: RolUsuario; error?: string }> => {
    const cleanPin = pin.trim();
    if (cleanPin.length !== 4) {
      return { success: false, error: 'El PIN debe tener 4 dígitos exactos' };
    }

    const isDemoStore = negocio.id === DEFAULT_DEMO_NEGOCIO.id;

    try {
      // Atajos de PIN universales ("1234" y "4321") EXCLUSIVOS para el Negocio Demo
      if (isDemoStore) {
        if (cleanPin === '1234') {
          setCurrentRole('DUENO');
          setIsLocked(false);
          localStorage.setItem(KEY_ROLE, 'DUENO');
          return { success: true, role: 'DUENO' };
        }
        if (cleanPin === '4321') {
          setCurrentRole('CAJERO');
          setIsLocked(false);
          localStorage.setItem(KEY_ROLE, 'CAJERO');
          return { success: true, role: 'CAJERO' };
        }
      }

      const hashedInput = await hashPin(cleanPin);

      // Verificar si coincide con hash de Dueño del negocio actual
      if (hashedInput === negocio.pin_dueno_hash || (isDemoStore && hashedInput === DEMO_HASH_PIN_DUENO)) {
        setCurrentRole('DUENO');
        setIsLocked(false);
        localStorage.setItem(KEY_ROLE, 'DUENO');
        return { success: true, role: 'DUENO' };
      }

      // Verificar si coincide con hash de Cajero del negocio actual
      if (hashedInput === negocio.pin_cajero_hash || (isDemoStore && hashedInput === DEMO_HASH_PIN_CAJERO)) {
        setCurrentRole('CAJERO');
        setIsLocked(false);
        localStorage.setItem(KEY_ROLE, 'CAJERO');
        return { success: true, role: 'CAJERO' };
      }

      return { success: false, error: 'PIN incorrecto. Intenta de nuevo.' };
    } catch (err) {
      console.error('Error al desbloquear:', err);
      if (isDemoStore && cleanPin === '1234') {
        setCurrentRole('DUENO');
        setIsLocked(false);
        localStorage.setItem(KEY_ROLE, 'DUENO');
        return { success: true, role: 'DUENO' };
      }
      return { success: false, error: 'Error al verificar el PIN.' };
    }
  };

  // Verificación puntual de PIN Maestro para operaciones restringidas (ej: Ver Cartera / Anulaciones)
  const verifyMasterPin = async (pin: string): Promise<boolean> => {
    const cleanPin = pin.trim();
    if (cleanPin.length !== 4) return false;
    const isDemoStore = negocio.id === DEFAULT_DEMO_NEGOCIO.id;
    if (isDemoStore && cleanPin === '1234') return true;
    try {
      const hashed = await hashPin(cleanPin);
      return hashed === negocio.pin_dueno_hash || (isDemoStore && hashed === DEMO_HASH_PIN_DUENO);
    } catch {
      return false;
    }
  };

  return (
    <PinAuthContext.Provider
      value={{
        negocio,
        currentRole,
        isLocked,
        isAuthenticated,
        needsPinSetup,
        unlockWithPin,
        lockNow,
        verifyMasterPin,
        updateNegocio,
        registerShop,
        loginShop,
        completePinSetup,
        logoutShop,
        enterDemoMode,
      }}
    >
      {children}
    </PinAuthContext.Provider>
  );
};

export const usePinAuth = () => {
  const context = useContext(PinAuthContext);
  if (!context) {
    throw new Error('usePinAuth debe ser utilizado dentro de un PinAuthProvider');
  }
  return context;
};
