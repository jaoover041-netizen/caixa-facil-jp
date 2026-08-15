import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { fmt, dataAgora, exportarVendasCSV, exportarFechamentosCSV } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { Sale } from '../types/pos';
import { ReceiptModal } from './ReceiptModal';
import { 
  BarChart3, 
  Download, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  Receipt, 
  Calendar, 
  User, 
  Tag, 
  Printer 
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { vendas, fechamentos, produtos, config, setTelaAtiva, showToast } = usePOS();
  
  const [expandidaId, setExpandidaId] = useState<number | null>(null);
  const [selectedVendaRecibo, setSelectedVendaRecibo] = useState<Sale | null>(null);
  const [filtroData, setFiltroData] = useState<string>('hoje');

  const hoje = dataAgora();

  const vendasFiltradas = useMemo(() => {
    if (filtroData === 'hoje') {
      return vendas.filter(v => v.data === hoje).slice().reverse();
    }
    return vendas.slice().reverse();
  }, [vendas, filtroData, hoje]);

  const faturamento = vendasFiltradas.reduce((s, v) => s + v.total, 0);
  const totalItens = vendasFiltradas.reduce((s, v) => s + v.itens.reduce((acc, it) => acc + it.qtd, 0), 0);

  const porMetodo: Record<string, number> = {};
  vendasFiltradas.forEach(v => {
    v.pagamentos.forEach(p => {
      porMetodo[p.metodo] = (porMetodo[p.metodo] || 0) + p.valor;
    });
  });

  const handleExportCSV = (escopo: 'dia' | 'geral') => {
    if (vendas.length === 0) {
      showToast('Nenhuma venda registrada para exportação', 'erro');
      return;
    }
    exportarVendasCSV(vendas, produtos, config, escopo);
    showToast('⬇ Planilha CSV gerada com sucesso!', 'sucesso');
    sounds.click();
  };

  const handleExportFechamentos = () => {
    if (fechamentos.length === 0) {
      showToast('Nenhum fechamento registrado para exportação', 'erro');
      return;
    }
    exportarFechamentosCSV(fechamentos, config);
    showToast('⬇ Histórico de fechamentos exportado!', 'sucesso');
    sounds.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTelaAtiva('pdv')}
            className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-display text-xs uppercase flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao PDV
          </button>
          <div>
            <h2 className="font-display text-xl sm:text-2xl text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-6 h-6" /> Relatório de Vendas
            </h2>
            <p className="text-xs text-neutral-400">
              Histórico detalhado de vendas, comprovantes e exportação contábil em CSV.
            </p>
          </div>
        </div>

        {/* CSV Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCSV('dia')}
            className="px-3 py-1.5 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/50 rounded-lg text-xs font-display font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV do Dia</span>
          </button>

          <button
            onClick={() => handleExportCSV('geral')}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-display font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Geral</span>
          </button>

          <button
            onClick={handleExportFechamentos}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-display font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Fechamentos</span>
          </button>
        </div>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltroData('hoje')}
          className={`px-3 py-1.5 rounded-lg text-xs font-display uppercase tracking-wider transition-colors cursor-pointer ${
            filtroData === 'hoje'
              ? 'bg-amber-400 text-black font-bold'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
          }`}
        >
          Vendas de Hoje ({hoje})
        </button>
        <button
          onClick={() => setFiltroData('tudo')}
          className={`px-3 py-1.5 rounded-lg text-xs font-display uppercase tracking-wider transition-colors cursor-pointer ${
            filtroData === 'tudo'
              ? 'bg-amber-400 text-black font-bold'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
          }`}
        >
          Todas as Vendas ({vendas.length})
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#111111] border border-neutral-800 border-l-3 border-l-amber-400 rounded-xl p-3 sm:p-4">
          <span className="text-[11px] font-display uppercase text-neutral-400 block">Faturamento Filtrado</span>
          <strong className="font-display text-xl sm:text-2xl text-amber-400 block mt-1">{fmt(faturamento)}</strong>
        </div>
        <div className="bg-[#111111] border border-neutral-800 border-l-3 border-l-emerald-500 rounded-xl p-3 sm:p-4">
          <span className="text-[11px] font-display uppercase text-neutral-400 block">Total de Vendas</span>
          <strong className="font-display text-xl sm:text-2xl text-emerald-400 block mt-1">{vendasFiltradas.length}</strong>
        </div>
        <div className="bg-[#111111] border border-neutral-800 border-l-3 border-l-sky-500 rounded-xl p-3 sm:p-4">
          <span className="text-[11px] font-display uppercase text-neutral-400 block">Itens Vendidos</span>
          <strong className="font-display text-xl sm:text-2xl text-sky-400 block mt-1">{totalItens} un</strong>
        </div>
        <div className="bg-[#111111] border border-neutral-800 border-l-3 border-l-purple-500 rounded-xl p-3 sm:p-4">
          <span className="text-[11px] font-display uppercase text-neutral-400 block">Ticket Médio</span>
          <strong className="font-display text-xl sm:text-2xl text-purple-300 block mt-1">
            {fmt(vendasFiltradas.length > 0 ? faturamento / vendasFiltradas.length : 0)}
          </strong>
        </div>
      </div>

      {/* Grid: Sales List (Left) + Tender & Closings Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Sales Accordion List (8 cols) */}
        <div className="lg:col-span-8 bg-[#111111] border border-neutral-800 rounded-xl p-4 space-y-3">
          <h3 className="font-display text-base text-amber-400 font-bold uppercase tracking-wider border-b border-neutral-800 pb-2">
            🧾 Registro de Cupons Emitidos ({vendasFiltradas.length})
          </h3>

          {vendasFiltradas.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              Nenhuma venda registrada neste período.
            </div>
          ) : (
            <div className="space-y-2">
              {vendasFiltradas.map((v) => {
                const isExpanded = expandidaId === v.id;
                const totalQtd = v.itens.reduce((s, it) => s + it.qtd, 0);

                return (
                  <div
                    key={v.id}
                    className="border border-neutral-800 hover:border-neutral-700 rounded-lg overflow-hidden bg-[#141414] transition-colors"
                  >
                    {/* Collapsible Bar */}
                    <div
                      onClick={() => setExpandidaId(isExpanded ? null : v.id)}
                      className="p-3 flex items-center justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-amber-400">#{String(v.id).slice(-6)}</span>
                        <span className="text-neutral-400">{v.data} {v.hora}</span>
                        <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300">
                          {v.operador}
                        </span>
                        {v.mesa && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800/60 text-[10px] text-sky-300">
                            🍽️ Mesa {v.mesa}
                          </span>
                        )}
                        <span className="text-neutral-500 text-[11px]">
                          ({totalQtd} itens)
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <strong className="font-display text-amber-400 text-base">{fmt(v.total)}</strong>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="p-3 bg-[#0d0d0d] border-t border-dashed border-neutral-800 text-xs space-y-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-display uppercase tracking-wider text-neutral-500 block">Itens da venda:</span>
                          {v.itens.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-neutral-300 pl-2">
                              <span>• {it.qtd}x <strong>{it.nome}</strong> ({fmt(it.preco)} un)</span>
                              <span className="font-mono">{fmt(it.preco * it.qtd)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-neutral-800 pt-2 flex flex-wrap justify-between gap-2 text-neutral-400">
                          <div>
                            <span>Subtotal: {fmt(v.subtotal)}</span>
                            {v.desconto > 0 && <span className="text-rose-400 ml-2">Desconto: -{fmt(v.desconto)}</span>}
                          </div>
                          <div>
                            <span className="text-white">Pagamento: {v.pagamentos.map(p => `${p.metodo} (${fmt(p.valor)})`).join(', ')}</span>
                            {v.troco > 0 && <span className="text-amber-400 ml-2">Troco: {fmt(v.troco)}</span>}
                          </div>
                        </div>

                        {v.obs && (
                          <p className="text-[11px] text-neutral-400 italic">
                            Obs: {v.obs}
                          </p>
                        )}

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => setSelectedVendaRecibo(v)}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 rounded text-xs font-display uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Reimprimir Cupom</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Tender Breakdown & Cash Closing History (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Payment Methods */}
          <div className="bg-[#111111] border border-neutral-800 rounded-xl p-4 space-y-3">
            <h3 className="font-display text-sm text-neutral-200 font-bold uppercase tracking-wider border-b border-neutral-800 pb-2">
              💠 Faturamento por Método
            </h3>

            <div className="space-y-2 text-xs">
              {['DINHEIRO', 'DÉBITO', 'CRÉDITO', 'PIX', 'OUTRO'].map(met => (
                <div key={met} className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">{met}</span>
                  <strong className="font-mono text-white">{fmt(porMetodo[met] || 0)}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Closings History */}
          <div className="bg-[#111111] border border-neutral-800 rounded-xl p-4 space-y-3">
            <h3 className="font-display text-sm text-neutral-200 font-bold uppercase tracking-wider border-b border-neutral-800 pb-2">
              🔒 Últimos Fechamentos de Caixa
            </h3>

            {fechamentos.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">Nenhum fechamento registrado ainda.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                {fechamentos.slice(-6).reverse().map((fc, idx) => (
                  <div key={idx} className="p-2.5 bg-[#161616] border border-neutral-800 rounded-lg space-y-1">
                    <div className="flex justify-between text-neutral-300">
                      <strong className="text-white">{fc.data} às {fc.hora}</strong>
                      <span className="text-amber-400 font-mono font-bold">{fmt(fc.faturamento)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span>Op: {fc.operador}</span>
                      <span>{fc.vendas} vendas</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono pt-1 border-t border-neutral-800/80">
                      <span className="text-neutral-500">Gaveta: {fmt(fc.contado)}</span>
                      <span className={Math.abs(fc.dif) < 0.01 ? 'text-emerald-400' : fc.dif < 0 ? 'text-rose-400' : 'text-sky-400'}>
                        Dif: {fc.dif >= 0 ? `+${fmt(fc.dif)}` : fmt(fc.dif)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Receipt Modal for Re-printing */}
      <ReceiptModal
        isOpen={selectedVendaRecibo !== null}
        venda={selectedVendaRecibo}
        onClose={() => setSelectedVendaRecibo(null)}
      />

    </div>
  );
};
