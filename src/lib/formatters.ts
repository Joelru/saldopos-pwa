/**
 * Formateador de moneda optimizado para lectura rápida en mostrador
 * Ej: 120000 -> "$120.000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea fechas para la interfaz humana
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formatea fecha y hora exacta para la tirilla tipo datáfono
 * Ej: "15/10/2026 - 11:15 AM"
 */
export function formatReceiptDateTime(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12
  const formattedHours = pad(hours);

  return `${d}/${m}/${y} - ${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Limpia y normaliza números celulares para la API de WhatsApp
 * Remueve espacios, guiones y asegura prefijo de país si no está
 */
export function formatWhatsAppPhone(phone: string, defaultCountryCode = '57'): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }
  return digits;
}
