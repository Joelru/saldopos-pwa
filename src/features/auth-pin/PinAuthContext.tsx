import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Negocio, RolUsuario } from '../../types/database';
import { hashPin, DEMO_HASH_PIN_DUENO, DEMO_HASH_PIN_CAJERO } from '../../lib/crypto';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

// Negocio por defecto para funcionamiento inmediato en mostrador
const DEFAULT_NEGOCIO: Negocio = {
  id: '00000000-0000-0000-0000-000000000001',
  owner_user_id: '99999999-9999-9999-9999-999999999999',
  nombre_local: 'Boutique & Calzado Stylo Urbano',
  telefono: '3104567890',
  direccion: 'Cra 7 # 14-32 CC Galerías Local 108',
  logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop',
  pin_dueno_hash: DEMO_HASH_PIN_DUENO,
  pin_cajero_hash: DEMO_HASH_PIN_CAJERO,
  mensaje_pie_tirilla: '¡Gracias por su compra! Conserve esta tirilla como comprobante de su abono.',
  activo: true,
  fecha_vencimiento: null,
  created_at: new Date().toISOString(),
};

const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutos

interface PinAuthContextType {
  negocio: Negocio;
  currentRole: RolUsuario | null;
  isLocked: boolean;
  unlockWithPin: (pin: string) => Promise<{ success: boolean; role?: RolUsuario; error?: string }>;
  lockNow: () => void;
  verifyMasterPin: (pin: string) => Promise<boolean>;
  updateNegocio: (data: Partial<Negocio>) => void;
}

const PinAuthContext = createContext<PinAuthContextType | undefined>(undefined);

export const PinAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [negocio, setNegocio] = useState<Negocio>(() => {
    const saved = localStorage.getItem('saldopos_negocio');
    return saved ? JSON.parse(saved) : DEFAULT_NEGOCIO;
  });

  const [currentRole, setCurrentRole] = useState<RolUsuario | null>(() => {
    const saved = localStorage.getItem('saldopos_role');
    return saved ? (saved as RolUsuario) : null;
  });

  // La pantalla siempre inicia bloqueada exigiendo PIN para operar en mostrador
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guardar negocio en localStorage al cambiar
  const updateNegocio = useCallback((data: Partial<Negocio>) => {
    setNegocio(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem('saldopos_negocio', JSON.stringify(updated));
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
    if (!isLocked) {
      timerRef.current = setTimeout(() => {
        console.log('⏰ Bloqueo automático por 3 minutos de inactividad');
        setIsLocked(true);
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [isLocked]);

  // Escuchar actividad física en mostrador (touch, click, scroll, teclado)
  useEffect(() => {
    if (isLocked) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));
    resetInactivityTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLocked, resetInactivityTimer]);

  // Cargar negocio real de Supabase si está disponible
  useEffect(() => {
    async function loadRemoteNegocio() {
      if (!isSupabaseConfigured) return;
      try {
        const { data, error } = await supabase.from('negocios').select('*').limit(1).maybeSingle();
        if (data && !error) {
          setNegocio(data);
          localStorage.setItem('saldopos_negocio', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Error cargando negocio de Supabase:', err);
      }
    }
    loadRemoteNegocio();
  }, []);

  // Desbloqueo mediante comparación hash de PIN
  const unlockWithPin = async (pin: string): Promise<{ success: boolean; role?: RolUsuario; error?: string }> => {
    if (pin.length !== 4) {
      return { success: false, error: 'El PIN debe tener 4 dígitos exactos' };
    }

    const hashedInput = await hashPin(pin);

    // 1. Verificar si es PIN Maestro (Dueño)
    if (hashedInput === negocio.pin_dueno_hash) {
      setCurrentRole('DUENO');
      setIsLocked(false);
      localStorage.setItem('saldopos_role', 'DUENO');
      return { success: true, role: 'DUENO' };
    }

    // 2. Verificar si es PIN Cajero
    if (hashedInput === negocio.pin_cajero_hash) {
      setCurrentRole('CAJERO');
      setIsLocked(false);
      localStorage.setItem('saldopos_role', 'CAJERO');
      return { success: true, role: 'CAJERO' };
    }

    return { success: false, error: 'PIN incorrecto. Verifique con el administrador.' };
  };

  // Verificación puntual de PIN Maestro para operaciones restringidas (ej: Anulaciones)
  const verifyMasterPin = async (pin: string): Promise<boolean> => {
    if (pin.length !== 4) return false;
    const hashed = await hashPin(pin);
    return hashed === negocio.pin_dueno_hash;
  };

  return (
    <PinAuthContext.Provider
      value={{
        negocio,
        currentRole,
        isLocked,
        unlockWithPin,
        lockNow,
        verifyMasterPin,
        updateNegocio,
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
