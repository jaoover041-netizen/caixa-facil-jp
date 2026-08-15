import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { fmt } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { Lock, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface CashClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashClosingModal: React.FC<CashClosingModalProps> = ({
  isOpen,
  onClose
}) => {
  const { caixa, vendas, mov, fecharCaixa, showToast } = usePOS();
  const [contadoStr, setContadoStr] = useState<string>('');

  if (!isOpen || !caixa.aberto) return null;

  const vs = vendas.filter(v => v.caixaId === caixa.inicio);
  const porMet: Record<string, number> = {};
  vs.forEach(v => {
    v.pagamentos.forEach(p => {
      porMet[p.metodo] = (porMet[p.metodo] || 0) + p.valor;
    });
  });

  const sup = mov.filter(x => x.tipo === 'SUPRIMENTO').reduce((s, x) => s + x.valor, 0);
  const san = mov.filter(x => x.tipo === 'SANGRIA').reduce((s, x) => s + x.valor, 0);
  const dinheiroBruto = porMet['DINHEIRO'] || 0;
  const troco = vs.reduce((s, v) => s + (v.troco || 0), 0);
  const dinheiroLiquido = dinheiroBruto - troco;
  const esperado = (caixa.abertura || 0) + sup - san + dinheiroLiquido;
  const faturamento = vs.reduce((s, v) => s + v.total, 0);

  const contadoNum = parseFloat(contadoStr) || 0;
  const diferenca = contadoStr !== '' ? contadoNum - esperado : null;

  const handleConfirmar = () => {
    if (contadoStr === '') {
      showToast('Por favor, informe a contagem física do dinheiro em caixa.', 'erro');
      sounds.error();
      return;
    }

    fecharCaixa(contadoNum);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#111111] border border-rose-500/40 rounded-xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="font-display text-base text-rose-400 font-bold uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-5 h-5" /> Fechamento de Caixa
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-neutral-300">
          <p>Operador: <strong className="text-white">{caixa.operador || 'Atual'}</strong> · <strong>{vs.length}</strong> vendas no turno</p>
        </div>

        {/* Ledger Lines */}
        <div className="bg-[#0c0c0c] border border-neutral-800 rounded-lg p-3 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-300">
            <span>Fundo de Abertura:</span>
            <strong className="font-mono">{fmt(caixa.abertura || 0)}</strong>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>(＋) Suprimentos de Troco:</span>
            <strong className="font-mono">+{fmt(sup)}</strong>
          </div>
          <div className="flex justify-between text-rose-400">
            <span>(−) Sangrias Efetuadas:</span>
            <strong className="font-mono">-{fmt(san)}</strong>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>(＋) Vendas em Dinheiro (Líq.):</span>
            <strong className="font-mono">+{fmt(dinheiroLiquido)}</strong>
          </div>

          <div className="border-t border-dashed border-neutral-700 pt-2 flex justify-between items-center text-amber-400 font-bold">
            <span className="font-display uppercase tracking-wider text-xs">Esperado em Espécie na Gaveta:</span>
            <span className="font-display text-lg">{fmt(esperado)}</span>
          </div>

          <div className="border-t border-neutral-800 pt-2 space-y-1 text-neutral-400 text-[11px]">
            <div className="flex justify-between">
              <span>💳 Cartão de Débito:</span>
              <span className="font-mono text-neutral-200">{fmt(porMet['DÉBITO'] || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>💳 Cartão de Crédito:</span>
              <span className="font-mono text-neutral-200">{fmt(porMet['CRÉDITO'] || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>📱 Recebimento PIX:</span>
              <span className="font-mono text-neutral-200">{fmt(porMet['PIX'] || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>🎟️ Outros / Vales:</span>
              <span className="font-mono text-neutral-200">{fmt(porMet['OUTRO'] || 0)}</span>
            </div>
            <div className="flex justify-between text-white font-bold pt-1 border-t border-neutral-800/60">
              <span>Faturamento Total do Turno:</span>
              <span className="font-mono text-amber-400">{fmt(faturamento)}</span>
            </div>
          </div>
        </div>

        {/* Cash Count Input */}
        <div>
          <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
            Informe o valor contado na gaveta (R$) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-base">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={contadoStr}
              onChange={(e) => setContadoStr(e.target.value)}
              placeholder="0.00"
              autoFocus
              className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg pl-10 pr-3 py-2.5 text-right font-display text-2xl text-white outline-none"
            />
          </div>

          {/* Difference Indicator */}
          {diferenca !== null && (
            <div className={`mt-2 p-2 rounded-md border flex items-center justify-between text-xs font-mono font-bold ${
              Math.abs(diferenca) < 0.01
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : diferenca < 0
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                : 'bg-sky-950/60 border-sky-500/50 text-sky-300'
            }`}>
              <span className="flex items-center gap-1.5 font-display text-[11px] uppercase">
                {Math.abs(diferenca) < 0.01 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Caixa Bateu Exato
                  </>
                ) : diferenca < 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> Falta de Dinheiro
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-sky-400" /> Sobra de Dinheiro
                  </>
                )}
              </span>
              <span>{diferenca >= 0 ? `+${fmt(diferenca)}` : fmt(diferenca)}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-display font-semibold uppercase text-xs transition-colors"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            className="py-2.5 px-4 rounded-lg bg-linear-to-b from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white font-display font-bold uppercase text-xs shadow-[0_0_15px_rgba(225,29,72,0.35)] transition-all cursor-pointer"
          >
            Confirmar Fechamento
          </button>
        </div>

      </div>
    </div>
  );
};
