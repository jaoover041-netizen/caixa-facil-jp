import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { usePOS } from '../context/POSContext';
import { PaymentMethodType, PaymentRecord, Sale } from '../types/pos';
import { fmt, fmtNumber, iconeMetodo } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { 
  X, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  Ticket, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  desconto: number;
  total: number;
  mesaNum?: number;
  onVendaConcluida: (venda: Sale) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  desconto,
  total,
  mesaNum,
  onVendaConcluida
}) => {
  const { finalizarVenda, showToast, config } = usePOS();
  
  const [metodo, setMetodo] = useState<PaymentMethodType>('DINHEIRO');
  const [valorInput, setValorInput] = useState<string>('');
  const [pagamentos, setPagamentos] = useState<PaymentRecord[]>([]);
  const [obs, setObs] = useState<string>('');
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>('');
  const [pixCopiado, setPixCopiado] = useState<boolean>(false);

  const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0);
  const restante = Math.max(0, total - totalPago);
  const troco = Math.max(0, totalPago - total);
  const estaPago = totalPago >= total - 0.001;

  useEffect(() => {
    if (isOpen) {
      setPagamentos([]);
      setMetodo('DINHEIRO');
      setValorInput(total.toFixed(2));
      setObs('');
      setPixCopiado(false);
    }
  }, [isOpen, total]);

  // Generate PIX payload and QR Code when PIX is selected
  useEffect(() => {
    if (isOpen && metodo === 'PIX') {
      const pixKey = config?.chavePix || 'financeiro@caixafacil.app';
      const pixPayload = `00020126360014br.gov.bcb.pix0114${pixKey}520400005303986540${total.toFixed(2)}5802BR5913${config?.nome?.slice(0, 13) || 'CAIXA FACIL'}6009SAO PAULO62070503***6304`;
      
      QRCode.toDataURL(pixPayload, { width: 220, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
        .then(url => setPixQrDataUrl(url))
        .catch(() => {});
    }
  }, [isOpen, metodo, total, config]);

  // When payment method changes, adjust default input value to remaining balance
  const handleSelectMetodo = (m: PaymentMethodType) => {
    setMetodo(m);
    sounds.click();
    setValorInput(restante > 0 ? restante.toFixed(2) : total.toFixed(2));
  };

  const handleAddPagamento = () => {
    const v = parseFloat(valorInput) || 0;
    if (v <= 0) {
      showToast('Informe um valor de pagamento válido', 'erro');
      sounds.error();
      return;
    }

    if (metodo !== 'DINHEIRO' && v > restante + 0.001) {
      showToast(`Valor acima do restante para ${metodo}. No cartão ou PIX, insira no máximo ${fmt(restante)}.`, 'erro');
      sounds.error();
      return;
    }

    setPagamentos(prev => [...prev, { metodo, valor: v }]);
    sounds.click();

    const novoRestante = Math.max(0, restante - v);
    setValorInput(novoRestante > 0 ? novoRestante.toFixed(2) : '');
  };

  const handleRemoverPagamento = (index: number) => {
    setPagamentos(prev => prev.filter((_, idx) => idx !== index));
    sounds.click();
  };

  const handleConfirmar = () => {
    if (!estaPago) {
      showToast('O valor total ainda não foi quitado', 'erro');
      sounds.error();
      return;
    }

    const venda = finalizarVenda(subtotal, desconto, total, pagamentos, obs, mesaNum);
    onVendaConcluida(venda);
  };

  const copiarChavePix = () => {
    const pixKey = config?.chavePix || 'financeiro@caixafacil.app';
    navigator.clipboard.writeText(pixKey);
    setPixCopiado(true);
    showToast('Chave PIX copiada para a área de transferência!', 'sucesso');
    setTimeout(() => setPixCopiado(false), 3000);
  };

  // Quick cash shortcuts
  const cashShortcuts = [
    { label: 'Exato', val: restante },
    { label: 'R$ 10', val: 10 },
    { label: 'R$ 20', val: 20 },
    { label: 'R$ 50', val: 50 },
    { label: 'R$ 100', val: 100 },
    { label: 'R$ 200', val: 200 }
  ].filter(item => item.val >= restante || item.val === restante);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#111111] border border-[#2a2a2a] border-t-3 border-t-amber-400 rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h2 className="font-display text-lg text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Finalizar Recebimento
            </h2>
            {mesaNum && (
              <span className="text-[11px] font-mono text-sky-400">
                🍽️ Fechando comanda da Mesa {mesaNum}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total to Pay Display */}
        <div className="bg-[#171717] border border-neutral-800 rounded-lg p-3 text-center">
          <span className="text-[11px] font-display uppercase tracking-widest text-neutral-400">Total a Pagar</span>
          <div className="font-display text-3xl sm:text-4xl font-bold text-amber-400 drop-shadow-[0_0_12px_rgba(255,193,7,0.3)]">
            {fmt(total)}
          </div>
          {desconto > 0 && (
            <span className="text-[11px] text-neutral-400">
              (Subtotal: {fmt(subtotal)} | Desconto: -{fmt(desconto)})
            </span>
          )}
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {(['DINHEIRO', 'DÉBITO', 'CRÉDITO', 'PIX', 'OUTRO'] as PaymentMethodType[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleSelectMetodo(m)}
              className={`py-2.5 px-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                metodo === m
                  ? 'bg-amber-400/10 border-amber-400 text-amber-400 shadow-[0_0_12px_rgba(255,193,7,0.2)]'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600'
              }`}
            >
              <span className="text-xl">{iconeMetodo(m)}</span>
              <span className="text-[10px] sm:text-xs font-display uppercase font-semibold tracking-wider">
                {m}
              </span>
            </button>
          ))}
        </div>

        {/* Dynamic PIX QR Code Box */}
        {metodo === 'PIX' && (
          <div className="p-3 bg-[#161616] border border-sky-500/30 rounded-lg flex flex-col items-center text-center space-y-2">
            <div className="bg-white p-2 rounded-md shadow-md">
              {pixQrDataUrl ? (
                <img src={pixQrDataUrl} alt="QR Code Pix" className="w-36 h-36 mx-auto" />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center bg-neutral-100 text-black text-xs">Gerando QR...</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-300 font-mono">Chave: {config?.chavePix || 'financeiro@caixafacil.app'}</span>
              <button
                type="button"
                onClick={copiarChavePix}
                className="px-2 py-1 bg-sky-950 text-sky-300 border border-sky-700/50 hover:bg-sky-900 rounded text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {pixCopiado ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{pixCopiado ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Value Input & Add Button */}
        <div className="space-y-2">
          <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400">
            Valor a receber em {metodo}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-mono">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg pl-9 pr-3 py-2 text-right font-display text-xl text-white outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddPagamento}
              className="px-4 bg-sky-600 hover:bg-sky-500 text-white font-display font-bold uppercase rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar</span>
            </button>
          </div>

          {/* Quick Cash Suggestions for Dinheiro */}
          {metodo === 'DINHEIRO' && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-neutral-400 self-center">Atalhos:</span>
              {cashShortcuts.slice(0, 5).map((sc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setValorInput(sc.val.toFixed(2))}
                  className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-400 rounded text-[11px] font-mono transition-colors"
                >
                  {fmt(sc.val)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Payments List (Split payments) */}
        {pagamentos.length > 0 && (
          <div className="space-y-1.5 max-h-32 overflow-y-auto border-t border-b border-neutral-800 py-2">
            <span className="text-[10px] font-display uppercase tracking-widest text-neutral-400">Pagamentos Lançados:</span>
            {pagamentos.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between bg-neutral-900/80 px-3 py-1.5 rounded border border-neutral-800 text-xs">
                <span className="flex items-center gap-1.5 text-neutral-200">
                  {iconeMetodo(p.metodo)} {p.metodo}
                </span>
                <div className="flex items-center gap-3">
                  <strong className="font-mono text-amber-400">{fmt(p.valor)}</strong>
                  <button
                    onClick={() => handleRemoverPagamento(idx)}
                    className="text-neutral-500 hover:text-rose-400 p-0.5"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Customer Observation / Notes */}
        <div>
          <label className="block text-[10px] font-display uppercase tracking-wider text-neutral-400 mb-1">
            Observações do Pedido (Opcional)
          </label>
          <input
            type="text"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ex: Entregar na mesa 4, sem cebola, CPF na nota..."
            className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-amber-400 rounded-md px-3 py-1.5 text-xs text-neutral-200 outline-none"
          />
        </div>

        {/* Summary Footer Bar */}
        <div className="grid grid-cols-3 gap-2 bg-[#0c0c0c] border border-neutral-800 rounded-lg p-2.5 text-center">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase block font-display">Pago</span>
            <span className="font-display text-base font-bold text-neutral-200">{fmt(totalPago)}</span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase block font-display">Restante</span>
            <span className={`font-display text-base font-bold ${restante <= 0.001 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmt(restante)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 uppercase block font-display">Troco</span>
            <span className="font-display text-base font-bold text-amber-400">
              {troco > 0 ? fmt(troco) : '—'}
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-display font-semibold uppercase text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <button
            type="button"
            disabled={!estaPago}
            onClick={handleConfirmar}
            className={`py-2.5 px-4 rounded-lg font-display font-bold uppercase text-xs flex items-center justify-center gap-2 transition-all ${
              estaPago
                ? 'bg-linear-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Concluir Venda (F2)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
