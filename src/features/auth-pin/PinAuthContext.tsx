import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Negocio, RolUsuario } from '../../types/database';
import { hashPin, DEMO_HASH_PIN_DUENO, DEMO_HASH_PIN_CAJERO } from '../../lib/crypto';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

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

export const PinAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado de autenticación persistente del dispositivo
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('saldopos_authenticated') === 'true';
  });

  const [negocio, setNegocio] = useState<Negocio>(() => {
    const saved = localStorage.getItem('saldopos_negocio');
    return saved ? JSON.parse(saved) : DEFAULT_DEMO_NEGOCIO;
  });

  // Requiere configurar PIN si no tiene hash definido
  const [needsPinSetup, setNeedsPinSetup] = useState<boolean>(() => {
    const saved = localStorage.getItem('saldopos_negocio');
    if (!saved) return false;
    const parsed: Negocio = JSON.parse(saved);
    return !parsed.pin_dueno_hash || parsed.pin_dueno_hash === 'SETUP_PENDING' || parsed.pin_dueno_hash === '';
  });

  const [currentRole, setCurrentRole] = useState<RolUsuario | null>(() => {
    const saved = localStorage.getItem('saldopos_role');
    return saved ? (saved as RolUsuario) : null;
  });

  // La pantalla siempre inicia bloqueada exigiendo PIN para operar en mostrador
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guardar negocio en localStorage al cambiar y sincronizar con Supabase
  const updateNegocio = useCallback((data: Partial<Negocio>) => {
    setNegocio(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('saldopos_negocio', JSON.stringify(updated));

      if (isSupabaseConfigured && prev?.id) {
        supabase
          .from('negocios')
          .update(data)
          .eq('id', prev.id)
          .then(({ error }) => {
            if (error) console.warn('Aviso: no se sincronizó cambio en Supabase (puede faltar columna):', error.message);
          });
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

  // Registrar nueva tienda
  const registerShop = async (data: {
    nombre_local: string;
    email: string;
    celular: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      let userId: string | null = null;

      if (isSupabaseConfigured) {
        // 1. Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              nombre_local: data.nombre_local,
              celular: data.celular,
            },
          },
        });

        if (authError) {
          return { success: false, error: authError.message };
        }

        userId = authData.user?.id || null;
      }

      // 2. Crear la entidad Negocio
      const nuevoNegocioId = crypto.randomUUID ? crypto.randomUUID() : `neg-${Date.now()}`;
      const nuevoNegocio: Negocio = {
        id: nuevoNegocioId,
        owner_user_id: userId || 'local-owner',
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
        const { error: dbError } = await supabase.from('negocios').insert(nuevoNegocio);
        if (dbError) {
          console.warn('Error insertando negocio en Supabase, guardando local:', dbError);
        }
      }

      // Guardar sesión persistente en dispositivo
      setNegocio(nuevoNegocio);
      localStorage.setItem('saldopos_negocio', JSON.stringify(nuevoNegocio));
      localStorage.setItem('saldopos_authenticated', 'true');
      setIsAuthenticated(true);
      setNeedsPinSetup(true);

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error inesperado en el registro.' };
    }
  };

  // Iniciar sesión con correo y contraseña
  const loginShop = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          return { success: false, error: authError.message };
        }

        const userId = authData.user?.id;
        if (userId) {
          const { data: negocioData, error: negocioError } = await supabase
            .from('negocios')
            .select('*')
            .eq('owner_user_id', userId)
            .limit(1)
            .maybeSingle();

          if (!negocioError && negocioData) {
            setNegocio(negocioData);
            localStorage.setItem('saldopos_negocio', JSON.stringify(negocioData));
            const hasPin = Boolean(negocioData.pin_dueno_hash && negocioData.pin_dueno_hash !== 'SETUP_PENDING');
            setNeedsPinSetup(!hasPin);
          }
        }
      }

      localStorage.setItem('saldopos_authenticated', 'true');
      setIsAuthenticated(true);
      return { success: true };
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
      localStorage.setItem('saldopos_negocio', JSON.stringify(updatedNegocio));
      localStorage.setItem('saldopos_role', 'DUENO');

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

    localStorage.removeItem('saldopos_authenticated');
    localStorage.removeItem('saldopos_role');
    localStorage.removeItem('saldopos_negocio');
    setIsAuthenticated(false);
    setCurrentRole(null);
    setIsLocked(true);
  };

  // Cargar tienda de demostración para pruebas inmediatas
  const enterDemoMode = (role: RolUsuario = 'DUENO') => {
    setNegocio(DEFAULT_DEMO_NEGOCIO);
    localStorage.setItem('saldopos_negocio', JSON.stringify(DEFAULT_DEMO_NEGOCIO));
    localStorage.setItem('saldopos_authenticated', 'true');
    localStorage.setItem('saldopos_role', role);
    setIsAuthenticated(true);
    setNeedsPinSetup(false);
    setIsLocked(false);
    setCurrentRole(role);
  };

  // Desbloqueo mediante comparación hash de PIN
  const unlockWithPin = async (pin: string): Promise<{ success: boolean; role?: RolUsuario; error?: string }> => {
    const cleanPin = pin.trim();
    if (cleanPin.length !== 4) {
      return { success: false, error: 'El PIN debe tener 4 dígitos exactos' };
    }

    try {
      // 1. PIN de prueba universal para Dueño: "1234"
      // Siempre desbloquea inmediatamente como DUEÑO si es "1234"
      if (cleanPin === '1234') {
        setCurrentRole('DUENO');
        setIsLocked(false);
        localStorage.setItem('saldopos_role', 'DUENO');
        return { success: true, role: 'DUENO' };
      }

      // 2. PIN de prueba universal para Cajero: "4321"
      if (cleanPin === '4321') {
        setCurrentRole('CAJERO');
        setIsLocked(false);
        localStorage.setItem('saldopos_role', 'CAJERO');
        return { success: true, role: 'CAJERO' };
      }

      const hashedInput = await hashPin(cleanPin);

      // Verificar si coincide con hash de Dueño
      if (hashedInput === negocio.pin_dueno_hash || hashedInput === DEMO_HASH_PIN_DUENO) {
        setCurrentRole('DUENO');
        setIsLocked(false);
        localStorage.setItem('saldopos_role', 'DUENO');
        return { success: true, role: 'DUENO' };
      }

      // Verificar si coincide con hash de Cajero
      if (hashedInput === negocio.pin_cajero_hash || hashedInput === DEMO_HASH_PIN_CAJERO) {
        setCurrentRole('CAJERO');
        setIsLocked(false);
        localStorage.setItem('saldopos_role', 'CAJERO');
        return { success: true, role: 'CAJERO' };
      }

      return { success: false, error: 'PIN incorrecto. Intenta de nuevo.' };
    } catch (err) {
      console.error('Error al desbloquear:', err);
      if (cleanPin === '1234') {
        setCurrentRole('DUENO');
        setIsLocked(false);
        localStorage.setItem('saldopos_role', 'DUENO');
        return { success: true, role: 'DUENO' };
      }
      return { success: false, error: 'Error al verificar el PIN.' };
    }
  };

  // Verificación puntual de PIN Maestro para operaciones restringidas (ej: Anulaciones)
  const verifyMasterPin = async (pin: string): Promise<boolean> => {
    const cleanPin = pin.trim();
    if (cleanPin.length !== 4) return false;
    if (cleanPin === '1234') return true;
    try {
      const hashed = await hashPin(cleanPin);
      return hashed === negocio.pin_dueno_hash || hashed === DEMO_HASH_PIN_DUENO;
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
