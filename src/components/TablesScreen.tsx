import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { fmt } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { CartItem, Sale } from '../types/pos';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { 
  UtensilsCrossed, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  ArrowLeft, 
  DollarSign, 
  X, 
  Clock,
  Edit3
} from 'lucide-react';

export const TablesScreen: React.FC = () => {
  const {
    mesas,
    produtos,
    salvarComandaMesa,
    liberarMesa,
    showToast,
    setTelaAtiva,
    config
  } = usePOS();

  const [mesaSelecionada, setMesaSelecionada] = useState<number | null>(null);
  const [comandaItens, setComandaItens] = useState<CartItem[]>([]);
  const [obsMesa, setObsMesa] = useState('');
  const [buscaItem, setBuscaItem] = useState('');
  
  // Checkout flow for tables
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const totalMesas = mesas.length;
  const ocupadas = mesas.filter(m => m.status === 'OCUPADA').length;
  const livres = totalMesas - ocupadas;

  const currentTable = mesaSelecionada !== null ? mesas.find(m => m.num === mesaSelecionada) : null;

  const handleOpenTable = (num: number) => {
    setMesaSelecionada(num);
    const mesa = mesas.find(m => m.num === num);
    if (mesa && mesa.comanda) {
      setComandaItens(mesa.comanda.itens.map(i => ({ ...i })));
      setObsMesa(mesa.comanda.obs || '');
    } else {
      setComandaItens([]);
      setObsMesa('');
    }
    setBuscaItem('');
    sounds.click();
  };

  const handleAddItemToTable = (cod: string) => {
    const prod = produtos.find(p => p.cod === cod);
    if (!prod) return;

    setComandaItens(prev => {
      const existing = prev.find(i => i.cod === cod);
      const curQtd = existing ? existing.qtd : 0;
      if (curQtd + 1 > prod.estoque) {
        sounds.error();
        showToast(`Estoque esgotado para "${prod.nome}"`, 'erro');
        return prev;
      }
      sounds.click();
      if (existing) {
        return prev.map(i => i.cod === cod ? { ...i, qtd: i.qtd + 1 } : i);
      }
      return [...prev, { cod, qtd: 1 }];
    });
  };

  const handleMudarQtd = (cod: string, delta: number) => {
    const prod = produtos.find(p => p.cod === cod);
    setComandaItens(prev => {
      const item = prev.find(i => i.cod === cod);
      if (!item) return prev;
      const nextQtd = item.qtd + delta;
      if (nextQtd <= 0) {
        sounds.click();
        return prev.filter(i => i.cod !== cod);
      }
      if (prod && nextQtd > prod.estoque) {
        sounds.error();
        showToast(`Limite de estoque (${prod.estoque} un)`, 'erro');
        return prev;
      }
      sounds.click();
      return prev.map(i => i.cod === cod ? { ...i, qtd: nextQtd } : i);
    });
  };

  const handleRemoverItem = (cod: string) => {
    setComandaItens(prev => prev.filter(i => i.cod !== cod));
    sounds.click();
  };

  const handleSalvarComanda = () => {
    if (mesaSelecionada === null) return;
    salvarComandaMesa(mesaSelecionada, comandaItens, obsMesa);
    setMesaSelecionada(null);
  };

  const handleFecharConta = () => {
    if (comandaItens.length === 0) {
      showToast('Adicione itens antes de fechar a conta', 'erro');
      sounds.error();
      return;
    }
    // Save current state first
    if (mesaSelecionada !== null) {
      salvarComandaMesa(mesaSelecionada, comandaItens, obsMesa);
    }
    setIsPaymentOpen(true);
  };

  // Table Subtotal calculation
  const totalComanda = useMemo(() => {
    return comandaItens.reduce((acc, item) => {
      const prod = produtos.find(p => p.cod === item.cod);
      return acc + (prod ? prod.preco * item.qtd : 0);
    }, 0);
  }, [comandaItens, produtos]);

  // Filter products for table order dialog
  const produtosFiltrados = useMemo(() => {
    const q = buscaItem.toLowerCase().trim();
    return produtos.filter(p => !q || p.nome.toLowerCase().includes(q) || p.cod.includes(q));
  }, [produtos, buscaItem]);

  const handleVendaConcluida = (venda: Sale) => {
    setIsPaymentOpen(false);
    if (mesaSelecionada !== null) {
      liberarMesa(mesaSelecionada);
      setMesaSelecionada(null);
    }
    setLastSale(venda);
    setIsReceiptOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4 pb-20">
      
      {/* Sub Header */}
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
              <UtensilsCrossed className="w-6 h-6" /> Mesas &amp; Comandas
            </h2>
            <p className="text-xs text-neutral-400">
              Controle pedidos em aberto, consumo por mesa e emissão de conta.
            </p>
          </div>
        </div>

        {/* Live summary badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
            ● {livres} Livres
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/50">
            ● {ocupadas} Ocupadas
          </span>
        </div>
      </div>

      {/* Grid of Tables */}
      {totalMesas === 0 ? (
        <div className="bg-[#111111] border border-neutral-800 rounded-xl p-10 text-center space-y-3">
          <UtensilsCrossed className="w-12 h-12 text-neutral-600 mx-auto" />
          <h3 className="font-display text-lg text-neutral-300">Modo de mesas desativado</h3>
          <p className="text-xs text-neutral-400">
            Configure a quantidade de mesas em <strong>Ajustes &gt; Identidade da loja</strong> para ativar o controle de comandas.
          </p>
          <button
            onClick={() => setTelaAtiva('config')}
            className="px-4 py-2 bg-amber-400 text-black font-display font-bold uppercase rounded-lg text-xs hover:bg-amber-300"
          >
            ⚙️ Abrir Configurações
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {mesas.map((m) => {
            const isOcupada = m.status === 'OCUPADA';
            const tableTotal = m.comanda
              ? m.comanda.itens.reduce((s, it) => {
                  const p = produtos.find(x => x.cod === it.cod);
                  return s + (p ? p.preco * it.qtd : 0);
                }, 0)
              : 0;
            const totalItens = m.comanda ? m.comanda.itens.reduce((s, it) => s + it.qtd, 0) : 0;

            return (
              <div
                key={m.num}
                onClick={() => handleOpenTable(m.num)}
                className={`border rounded-xl p-4 flex flex-col items-center justify-between text-center transition-all cursor-pointer select-none relative group ${
                  isOcupada
                    ? 'bg-linear-to-b from-[#1c1606] to-[#121212] border-amber-400/90 shadow-[0_0_20px_rgba(255,193,7,0.2)] hover:-translate-y-1'
                    : 'bg-[#111111] border-emerald-900/60 hover:border-emerald-500/60 hover:-translate-y-1'
                }`}
              >
                {/* Number */}
                <div className="w-full flex justify-between items-start">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">Mesa</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${isOcupada ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                </div>

                <div className="my-2">
                  <span className={`font-display text-4xl sm:text-5xl font-bold ${
                    isOcupada ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {String(m.num).padStart(2, '0')}
                  </span>
                  <span className="block text-[10px] font-display uppercase tracking-widest text-neutral-400 mt-1">
                    {isOcupada ? 'Ocupada' : 'Livre'}
                  </span>
                </div>

                {/* Subtotal preview */}
                <div className="w-full pt-2 border-t border-neutral-800 text-center">
                  {isOcupada ? (
                    <>
                      <strong className="font-display text-amber-400 text-sm block">
                        {fmt(tableTotal)}
                      </strong>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {totalItens} itens
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-neutral-500 italic">
                      Disponível
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Order Detail Modal */}
      {mesaSelecionada !== null && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#121212] border border-amber-400/50 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-amber-400 text-black font-display font-bold text-lg flex items-center justify-center">
                  {mesaSelecionada}
                </div>
                <div>
                  <h3 className="font-display text-base text-amber-400 font-bold uppercase tracking-wider">
                    Comanda da Mesa {mesaSelecionada}
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    {comandaItens.length > 0 ? `${comandaItens.reduce((s, i) => s + i.qtd, 0)} produtos lançados` : 'Nenhum pedido em aberto'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMesaSelecionada(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Screen in Modal: Product Search (Left) + Table Items (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Product selector */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buscaItem}
                    onChange={(e) => setBuscaItem(e.target.value)}
                    placeholder="Buscar no cardápio..."
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {produtosFiltrados.slice(0, 30).map((p) => (
                    <button
                      key={p.cod}
                      type="button"
                      disabled={p.estoque <= 0}
                      onClick={() => handleAddItemToTable(p.cod)}
                      className="w-full bg-[#161616] hover:bg-neutral-800 disabled:opacity-30 border border-neutral-800 rounded-lg p-2 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{p.emoji}</span>
                        <div className="truncate">
                          <strong className="text-xs text-neutral-200 block truncate">{p.nome}</strong>
                          <span className="text-[10px] text-neutral-400 font-mono">#{p.cod}</span>
                        </div>
                      </div>
                      <span className="font-display font-bold text-amber-400 text-xs shrink-0 ml-2">
                        {fmt(p.preco)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Table order cart */}
              <div className="bg-[#0c0c0c] border border-neutral-800 rounded-lg p-3 flex flex-col justify-between space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {comandaItens.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400 text-xs">
                      Comanda vazia.<br />Toque nos produtos ao lado para lançar.
                    </div>
                  ) : (
                    comandaItens.map((it) => {
                      const prod = produtos.find(p => p.cod === it.cod);
                      if (!prod) return null;

                      return (
                        <div key={it.cod} className="flex items-center justify-between bg-[#141414] p-2 rounded text-xs border border-neutral-800">
                          <div className="min-w-0 flex-1">
                            <span className="text-neutral-200 block truncate font-medium">{prod.nome}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">{fmt(prod.preco)} × {it.qtd}</span>
                          </div>

                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              onClick={() => handleMudarQtd(it.cod, -1)}
                              className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-mono font-bold text-white text-xs">{it.qtd}</span>
                            <button
                              onClick={() => handleMudarQtd(it.cod, 1)}
                              className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleRemoverItem(it.cod)}
                              className="text-neutral-500 hover:text-rose-400 ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                    Observações da mesa
                  </label>
                  <input
                    type="text"
                    value={obsMesa}
                    onChange={(e) => setObsMesa(e.target.value)}
                    placeholder="Ex: sem gelo, cliente pediu pão extra..."
                    className="w-full bg-[#161616] border border-neutral-700 rounded px-2.5 py-1 text-xs text-neutral-200 outline-none"
                  />
                </div>

                {/* Subtotal */}
                <div className="border-t border-neutral-800 pt-2 flex justify-between items-center">
                  <span className="font-display uppercase text-xs text-neutral-400">Total da Comanda:</span>
                  <span className="font-display text-xl font-bold text-amber-400">{fmt(totalComanda)}</span>
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setMesaSelecionada(null)}
                className="py-2.5 px-3 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-display font-semibold uppercase text-xs transition-colors"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={handleSalvarComanda}
                className="py-2.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-display font-bold uppercase text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Comanda</span>
              </button>

              <button
                type="button"
                disabled={comandaItens.length === 0}
                onClick={handleFecharConta}
                className="py-2.5 px-3 rounded-lg bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-300 text-black font-display font-bold uppercase text-xs shadow-[0_0_15px_rgba(255,193,7,0.4)] disabled:opacity-40 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Fechar Conta</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Payment Modal for Table Checkout */}
      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          subtotal={totalComanda}
          desconto={0}
          total={totalComanda}
          mesaNum={mesaSelecionada || undefined}
          onVendaConcluida={handleVendaConcluida}
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        venda={lastSale}
        onClose={() => setIsReceiptOpen(false)}
      />

    </div>
  );
};
