import React from 'react';
import confetti from 'canvas-confetti';
import { Sale } from '../types/pos';
import { usePOS } from '../context/POSContext';
import { gerarTextoCupom, gerarTextoWhatsApp, fmt } from '../utils/formatters';
import { Printer, Share2, ArrowRight, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  venda: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  venda,
  isOpen,
  onClose
}) => {
  const { config, showToast } = usePOS();

  React.useEffect(() => {
    if (isOpen && venda) {
      // Trigger a light celebratory confetti
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#FFC107', '#FF9800', '#4CAF50']
      });
    }
  }, [isOpen, venda]);

  if (!isOpen || !venda) return null;

  const cupomTexto = gerarTextoCupom(venda, config);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const encoded = gerarTextoWhatsApp(venda, config);
    const phone = config?.telefoneWhatsapp ? config.telefoneWhatsapp.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/55${phone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
    showToast('Abrindo WhatsApp para envio do cupom...', 'sucesso');
  };

  return (
    <>
      {/* Invisible element styled strictly for physical receipt printers */}
      <div id="thermal-receipt-print" className="hidden print-only">
        <pre className="whitespace-pre-wrap font-mono text-[11px] leading-tight text-black">
          {cupomTexto}
        </pre>
      </div>

      <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
        <div className="bg-[#121212] border border-amber-400/40 rounded-xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 my-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-display text-base text-amber-400 font-bold uppercase tracking-wider">
                Venda Concluída!
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Realistic Thermal Receipt Visualizer */}
          <div className="thermal-paper rounded p-4 font-mono text-[11px] leading-relaxed max-h-[50vh] overflow-y-auto border border-neutral-300 shadow-inner select-text">
            <pre className="whitespace-pre-wrap text-black font-mono-receipt font-medium">
              {cupomTexto}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-display font-semibold uppercase text-xs rounded-lg border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Imprimir (80mm)</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="py-2.5 px-3 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 font-display font-semibold uppercase text-xs rounded-lg border border-emerald-700/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Enviar WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-display font-bold uppercase text-sm rounded-lg flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(255,193,7,0.35)] transition-all cursor-pointer"
            >
              <span>Próxima Venda (F2 / Esc)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
