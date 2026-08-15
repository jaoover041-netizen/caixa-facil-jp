import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { fmt, fmtNumber } from '../utils/formatters';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  AlertTriangle, 
  ArrowLeft, 
  UtensilsCrossed, 
  PieChart, 
  Package, 
  Plus
} from 'lucide-react';

type PeriodType = 'hoje' | '7d' | '30d' | 'tudo';

export const DashboardScreen: React.FC = () => {
  const { vendas, produtos, reporEstoque, mesas, setTelaAtiva } = usePOS();
  const [periodo, setPeriodo] = useState<PeriodType>('hoje');

  // Filter sales based on chosen period
  const vendasFiltradas = useMemo(() => {
    const hoje = new Date();
    const dias = periodo === 'hoje' ? 0 : periodo === '7d' ? 6 : periodo === '30d' ? 29 : Infinity;
    
    return vendas.filter((v) => {
      if (dias === Infinity) return true;
      const parts = v.data.split('/').map(Number);
      if (parts.length !== 3) return true;
      const [dd, mm, aa] = parts;
      const dt = new Date(aa, mm - 1, dd);
      const corte = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dias);
      return dt >= corte;
    });
  }, [vendas, periodo]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const faturamento = vendasFiltradas.reduce((s, v) => s + v.total, 0);
    const subtotal = vendasFiltradas.reduce((s, v) => s + v.subtotal, 0);
    const descontos = vendasFiltradas.reduce((s, v) => s + v.desconto, 0);
    const totalItens = vendasFiltradas.reduce((s, v) => s + v.itens.reduce((acc, it) => acc + it.qtd, 0), 0);
    const totalVendas = vendasFiltradas.length;
    const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;

    let custoTotal = 0;
    vendasFiltradas.forEach(v => {
      v.itens.forEach(it => {
        const prod = produtos.find(p => p.cod === it.cod);
        const custoUnit = it.custo !== undefined ? it.custo : (prod?.custo || 0);
        custoTotal += custoUnit * it.qtd;
      });
    });

    const lucroBruto = Math.max(0, faturamento - custoTotal);
    const margem = faturamento > 0 ? (lucroBruto / faturamento) * 100 : 0;

    // Top products by revenue & units
    const prodMap: Record<string, { nome: string; emoji: string; qtd: number; rec: number; luc: number }> = {};
    vendasFiltradas.forEach(v => {
      v.itens.forEach(it => {
        const prod = produtos.find(p => p.cod === it.cod);
        const custoUnit = it.custo !== undefined ? it.custo : (prod?.custo || 0);
        if (!prodMap[it.cod]) {
          prodMap[it.cod] = {
            nome: it.nome,
            emoji: prod?.emoji || '🛒',
            qtd: 0,
            rec: 0,
            luc: 0
          };
        }
        prodMap[it.cod].qtd += it.qtd;
        prodMap[it.cod].rec += it.preco * it.qtd;
        prodMap[it.cod].luc += (it.preco - custoUnit) * it.qtd;
      });
    });

    const topProdutos = Object.values(prodMap).sort((a, b) => b.rec - a.rec).slice(0, 6);
    const maxRec = topProdutos.length > 0 ? topProdutos[0].rec : 1;

    // Breakdown by payment tender
    const porMetodo: Record<string, number> = {};
    vendasFiltradas.forEach(v => {
      v.pagamentos.forEach(p => {
        porMetodo[p.metodo] = (porMetodo[p.metodo] || 0) + p.valor;
      });
    });
    const maxMetodo = Math.max(1, ...Object.values(porMetodo));

    return {
      faturamento,
      custoTotal,
      lucroBruto,
      margem,
      descontos,
      totalItens,
      totalVendas,
      ticketMedio,
      topProdutos,
      maxRec,
      porMetodo,
      maxMetodo
    };
  }, [vendasFiltradas, produtos]);

  // Critical stock products
  const produtosCriticos = useMemo(() => {
    return produtos.filter(p => p.estoque <= 0 || (p.min > 0 && p.estoque <= p.min));
  }, [produtos]);

  const handleQuickRestock = (cod: string, nome: string) => {
    const qtdStr = prompt(`Quantas unidades adicionar ao estoque de "${nome}"?`, '10');
    if (!qtdStr) return;
    const qtd = parseInt(qtdStr);
    if (qtd > 0) {
      reporEstoque(cod, qtd);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4 pb-20">
      
      {/* Top Bar with Period Chips */}
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
              <TrendingUp className="w-6 h-6" /> Painel de Lucro &amp; Métricas
            </h2>
            <p className="text-xs text-neutral-400">
              Acompanhe faturamento, margem real de lucro e giro de estoque.
            </p>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex bg-[#111111] border border-neutral-800 rounded-lg p-1 gap-1">
          {(['hoje', '7d', '30d', 'tudo'] as PeriodType[]).map((p) => {
            const labels: Record<PeriodType, string> = {
              hoje: 'Hoje',
              '7d': 'Últimos 7 Dias',
              '30d': '30 Dias',
              tudo: 'Todo o Histórico'
            };
            return (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1 rounded text-xs font-display uppercase tracking-wider transition-colors cursor-pointer ${
                  periodo === p
                    ? 'bg-amber-400 text-black font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6 Key Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        
        {/* Faturamento */}
        <div className="bg-[#111111] border border-neutral-800 border-l-3 border-l-amber-400 rounded-xl p-3 sm:p-4 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-display uppercase tracking-widest text-neutral-400 block">
            Faturamento Bruto
          </span>
          <strong className="font-display text-xl sm:text-2xl text-amber-400 font-bold block mt-1">
            {fmt(metrics.faturamento)}
          </strong>
          <span className="text-[10px] text-neutral-500 font-mono">
            {metrics.totalVendas} vendas realizadas
          </span>
        </div>

        {/* Lucro Estimado */}
        <div className="bg-[#111111] border border-neutral-800 border-l-3 border-l-emerald-500 rounded-xl p-3 sm:p-4 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-display uppercase tracking-widest text-neutral-400 block">
            Lucro Estimado
          </span>
          <strong className="font-display text-xl sm:text-2xl text-emerald-400 font-bold block mt-1">
            {fmt(metrics.lucroBruto)}
          </strong>
          <span className="text-[10px] text-neutral-500 font-mono">
            Custo: {fmt(metrics.custoTotal)}
          </span>
        </div>

        {/* Margem */}
        <div className="bg-[#111111] border border-neutral-800 border-l-3 border-l-sky-400 rounded-xl p-3 sm:p-4 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-display uppercase tracking-widest text-neutral-400 block">
            Margem de Lucro
          </span>
          <strong className="font-display text-xl sm:text-2xl text-sky-400 font-bold block mt-1">
            {metrics.margem.toFixed(1)}%
          </strong>
          <span className="text-[10px] text-neutral-500 font-mono">
            Sobre as vendas
          </span>
        </div>

        {/* Ticket Médio */}
        <div className="bg-[#111111] border border-neutral-800 border-l-3 border-l-purple-400 rounded-xl p-3 sm:p-4 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-display uppercase tracking-widest text-neutral-400 block">
            Ticket Médio
          </span>
          <strong className="font-display text-xl sm:text-2xl text-purple-300 font-bold block mt-1">
            {fmt(metrics.ticketMedio)}
          </strong>
          <span className="text-[10px] text-neutral-500 font-mono">
            Por atendimento
          </span>
        </div>

        {/* Itens Vendidos */}
        <div className="bg-[#111111] border border-neutral-800 border-l-3 border-l-neutral-600 rounded-xl p-3 sm:p-4 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-display uppercase tracking-widest text-neutral-400 block">
            Itens Vendidos
          </span>
          <strong className="font-display text-xl sm:text-2xl text-neutral-100 font-bold block mt-1">
            {metrics.totalItens} un
          </strong>
          <span className="text-[10px] text-neutral-500 font-mono">
            Volume total
          </span>
        </div>

        {/* Descontos Concedidos */}
        <div className="bg-[#111111] border border-neutral-800 border-l-3 border-l-rose-500 rounded-xl p-3 sm:p-4 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-display uppercase tracking-widest text-neutral-400 block">
            Descontos
          </span>
          <strong className="font-display text-xl sm:text-2xl text-rose-400 font-bold block mt-1">
            {fmt(metrics.descontos)}
          </strong>
          <span className="text-[10px] text-neutral-500 font-mono">
            Abatimentos
          </span>
        </div>

      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Top Products Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-[#111111] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <h3 className="font-display text-base text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
              🏆 Produtos Mais Vendidos (Faturamento)
            </h3>
            <span className="text-xs text-neutral-500 font-mono">Top {metrics.topProdutos.length}</span>
          </div>

          {metrics.topProdutos.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              Nenhuma venda registrada no período selecionado.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.topProdutos.map((p, idx) => {
                const percent = Math.min(100, Math.max(5, (p.rec / metrics.maxRec) * 100));

                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-200 font-medium truncate max-w-[200px] sm:max-w-[280px]">
                        {p.emoji} {p.nome} <span className="text-neutral-500 font-mono">({p.qtd} un)</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-neutral-400 text-[11px]">Lucro: {fmt(p.luc)}</span>
                        <strong className="font-display font-bold text-amber-400 text-sm">{fmt(p.rec)}</strong>
                      </div>
                    </div>

                    <div className="w-full bg-[#1c1c1c] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-linear-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Payment Distribution & Stock Alerts (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Payment Method Distribution */}
          <div className="bg-[#111111] border border-neutral-800 rounded-xl p-4 space-y-3">
            <h3 className="font-display text-sm text-neutral-200 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
              <PieChart className="w-4 h-4 text-sky-400" /> Distribuição de Pagamentos
            </h3>

            {Object.keys(metrics.porMetodo).length === 0 ? (
              <div className="py-6 text-center text-neutral-500 text-xs">Sem dados no período.</div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(metrics.porMetodo).map(([met, rawVal]) => {
                  const val = Number(rawVal) || 0;
                  const percent = Math.min(100, Math.max(5, (val / metrics.maxMetodo) * 100));

                  return (
                    <div key={met} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>{met}</span>
                        <strong className="font-mono text-white">{fmt(val)}</strong>
                      </div>
                      <div className="w-full bg-[#1c1c1c] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-[#111111] border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-display text-sm text-rose-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Estoque Crítico ({produtosCriticos.length})
              </h3>
              <button
                onClick={() => setTelaAtiva('prod')}
                className="text-[11px] text-amber-400 hover:underline cursor-pointer"
              >
                Gerenciar
              </button>
            </div>

            {produtosCriticos.length === 0 ? (
              <div className="py-4 text-center text-emerald-400 text-xs">
                ✔ Todos os produtos estão com estoque saudável!
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {produtosCriticos.slice(0, 6).map((p) => (
                  <div key={p.cod} className="flex items-center justify-between bg-[#161616] p-2 rounded-lg border border-neutral-800/80 text-xs">
                    <div className="truncate min-w-0">
                      <span className="text-neutral-200 truncate block font-medium">
                        {p.emoji} {p.nome}
                      </span>
                      <span className="text-[10px] text-rose-400 font-mono">
                        {p.estoque} un restante (mínimo: {p.min})
                      </span>
                    </div>

                    <button
                      onClick={() => handleQuickRestock(p.cod, p.nome)}
                      className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-black rounded border border-amber-400/40 text-[11px] font-display uppercase tracking-wider flex items-center gap-1 shrink-0 transition-colors cursor-pointer ml-2"
                    >
                      <Plus className="w-3 h-3" /> Repor
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
