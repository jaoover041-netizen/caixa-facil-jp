import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { fmt } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface CashMovementModalProps {
  isOpen: boolean;
  tipo: 'SUPRIMENTO' | 'SANGRIA';
  onClose: () => void;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({
  isOpen,
  tipo,
  onClose
}) => {
  const { registrarMovimento, showToast } = usePOS();
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(valor) || 0;
    if (v <= 0) {
      showToast('Informe um valor válido maior que zero', 'erro');
      sounds.error();
      return;
    }

    registrarMovimento(tipo, v, motivo);
    setValor('');
    setMotivo('');
    onClose();
  };

  const isSuprimento = tipo === 'SUPRIMENTO';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className={`font-display text-base font-bold uppercase tracking-wider flex items-center gap-2 ${
            isSuprimento ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isSuprimento ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            {isSuprimento ? '＋ Suprimento de Caixa (Entrada)' : '－ Sangria de Caixa (Retirada)'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-400">
          {isSuprimento 
            ? 'Adicione fundos extras para troco no decorrer do expediente.' 
            : 'Registre saídas de dinheiro do caixa para despesas rápidas ou cofre.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
              Valor da movimentação (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-base">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                autoFocus
                required
                className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg pl-10 pr-3 py-2.5 text-right font-display text-2xl text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
              Motivo / Descrição *
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={isSuprimento ? 'Ex: Reforço de troco pelo gerente' : 'Ex: Pagamento de entregador, gelo...'}
              required
              className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-display font-semibold uppercase text-xs transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={`py-2.5 px-4 rounded-lg font-display font-bold uppercase text-xs text-black transition-all cursor-pointer ${
                isSuprimento 
                  ? 'bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]' 
                  : 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)] text-white'
              }`}
            >
              {isSuprimento ? 'Confirmar Entrada' : 'Confirmar Saída'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
