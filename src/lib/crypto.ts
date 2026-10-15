/**
 * Utilidad criptográfica para hashing seguro de PIN en el navegador
 * Utiliza Web Crypto API nativa (SHA-256)
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hashes conocidos por defecto para el entorno de desarrollo y pruebas:
 * "1234" -> PIN Dueño
 * "4321" -> PIN Cajero
 */
export const DEMO_HASH_PIN_DUENO = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'; // SHA-256 "1234"
export const DEMO_HASH_PIN_CAJERO = 'd74ff0ee8da3b9806b18c877dbf29bbde50b5bd8e4dad7a3a725000feb82e8f1'; // SHA-256 "4321"
