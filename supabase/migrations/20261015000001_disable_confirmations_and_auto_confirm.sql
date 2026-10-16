-- ==============================================================================
-- AUTO-CONFIRMACIÓN Y LIMPIEZA DE VERIFICACIONES DE CORREO
-- En Saldos no se requiere verificación por email para agilizar la operación en mostrador.
-- ==============================================================================

-- 1. Confirmar inmediatamente todos los usuarios existentes que estén pendientes de verificación
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmed_at = COALESCE(confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 2. Función y Trigger de respaldo para auto-confirmar cuentas futuras a nivel de base de datos
CREATE OR REPLACE FUNCTION public.auto_confirm_new_users()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
  NEW.confirmed_at = COALESCE(NEW.confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auto_confirm_new_users ON auth.users;

CREATE TRIGGER tr_auto_confirm_new_users
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_new_users();
