import React, { useRef, useState } from 'react';
import { X, Share2, Download, Printer, CheckCircle2, MessageSquare } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { Negocio, Cuenta, Movimiento } from '../../types/database';
import { ThermalReceipt } from './ThermalReceipt';
import { formatCurrency, formatWhatsAppPhone } from '../../lib/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  negocio: Negocio;
  cuenta: Cuenta | null;
  movimiento: Movimiento | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  negocio,
  cuenta,
  movimiento,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!isOpen || !cuenta || !movimiento) return null;

  const phoneNormalized = formatWhatsAppPhone(cuenta.celular_cliente);
  const isAbono = movimiento.tipo_movimiento === 'ABONO';
  const accionTexto = isAbono ? 'abono' : 'cargo a crédito';

  // Mensaje de cortesía para WhatsApp
  const whatsappCaption = `Hola ${cuenta.nombre_cliente}! 👋\n` +
    `Te compartimos el comprobante de tu ${accionTexto} por valor de *${formatCurrency(movimiento.monto)}* en *${negocio.nombre_local}*.\n\n` +
    `📌 *Artículo:* ${cuenta.concepto_articulo}\n` +
    `💰 *Nuevo Saldo Pendiente:* *${formatCurrency(movimiento.saldo_nuevo)}*\n` +
    `🧾 *Recibo:* #${cuenta.consecutivo}\n\n` +
    `¡Gracias por tu compra y puntualidad! 🙏`;

  // Generador de imagen con medidas fijas, margen reseteado y centrado absoluto
  const generateReceiptImage = async (type: 'blob' | 'png', pixelRatio = 2.5) => {
    if (!receiptRef.current) return null;
    const node = receiptRef.current;

    // Medidas base del voucher: 340px de ancho y alto completo con margen inferior para el dentado
    const targetWidth = 340;
    const targetHeight = Math.ceil(node.offsetHeight || node.scrollHeight) + 12;

    const options = {
      pixelRatio,
      backgroundColor: '#FFFFFF',
      width: targetWidth,
      height: targetHeight,
      style: {
        margin: '0',
        marginLeft: '0',
        marginRight: '0',
        marginTop: '0',
        marginBottom: '0',
        transform: 'none',
        left: '0',
        top: '0',
        position: 'relative',
        boxSizing: 'border-box',
        width: `${targetWidth}px`,
      },
    };

    if (type === 'blob') {
      return await toBlob(node, options);
    } else {
      return await toPng(node, options);
    }
  };

  // Compartir directamente por WhatsApp con imagen adjunta ($0 API)
  const handleShareWhatsApp = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);

    try {
      // 1. Generar blob centrado y sin recortes
      const blob = await generateReceiptImage('blob', 2.5);
      if (!blob) throw new Error('No se pudo generar la imagen del voucher');

      const fileName = `recibo-${cuenta.consecutivo}-${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // 2. Comprobar si el navegador soporta compartir archivos directamente (Web Share API Nivel 2)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Comprobante #${cuenta.consecutivo} - ${negocio.nombre_local}`,
          text: whatsappCaption,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // Fallback para computadores de escritorio o navegadores sin Web Share
        // A) Descargar imagen automáticamente
        const dataUrl = (await generateReceiptImage('png', 2.5)) as string;
        if (dataUrl) {
          const link = document.createElement('a');
          link.download = fileName;
          link.href = dataUrl;
          link.click();
        }

        // B) Abrir WhatsApp Web con el texto pre-redactado
        const waUrl = `https://wa.me/${phoneNormalized}?text=${encodeURIComponent(whatsappCaption)}`;
        window.open(waUrl, '_blank');
      }
    } catch (err: unknown) {
      console.warn('Error compartiendo tirilla, activando enlace directo wa.me:', err);
      const waUrl = `https://wa.me/${phoneNormalized}?text=${encodeURIComponent(whatsappCaption)}`;
      window.open(waUrl, '_blank');
    } finally {
      setIsGenerating(false);
    }
  };

  // Descarga manual de la imagen
  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = (await generateReceiptImage('png', 3)) as string;
      if (!dataUrl) return;
      const link = document.createElement('a');
      link.download = `tirilla-${cuenta.consecutivo}-${cuenta.nombre_cliente.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error descargando imagen:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Impresión térmica
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-cloud-border shadow-pos-lg max-h-[95vh] flex flex-col">
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-cloud-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-heading">Tirilla Digital Generada</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenedor del Recibo Térmico (Scrollable) */}
        <div className="p-4 overflow-y-auto no-scrollbar flex-1 bg-slate-100/70 flex justify-center items-start">
          <ThermalReceipt
            ref={receiptRef}
            negocio={negocio}
            cuenta={cuenta}
            movimiento={movimiento}
          />
        </div>

        {/* Botones de Acción Rápida de Mostrador */}
        <div className="p-4 bg-white border-t border-cloud-border shrink-0 space-y-2.5">
          {shareSuccess && (
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Comprobante compartido con éxito!</span>
            </div>
          )}

          {/* Botón Principal: Enviar a WhatsApp */}
          <button
            onClick={handleShareWhatsApp}
            disabled={isGenerating}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <span>Generando Tirilla Digital...</span>
            ) : (
              <>
                <MessageSquare className="w-5 h-5 fill-white" />
                <span>Enviar Comprobante por WhatsApp</span>
                <Share2 className="w-4 h-4 ml-1 opacity-80" />
              </>
            )}
          </button>

          {/* Acciones Secundarias: Descargar e Imprimir */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Guardar PNG</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
