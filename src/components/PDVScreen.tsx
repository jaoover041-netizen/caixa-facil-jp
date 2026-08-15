import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { fmt } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { Product, Sale } from '../types/pos';
import { CameraScannerModal } from './CameraScannerModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { 
  Search, 
  Camera, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  ShoppingBag, 
  AlertCircle,
  Tag,
  Percent,
  Check
} from 'lucide-react';

export const PDVScreen: React.FC = () => {
  const {
    produtos,
    carrinho,
    addAoCarrinho,
    mudarQtdCarrinho,
    removerDoCarrinho,
    limparCarrinho,
    caixa,
    showToast,
    setTelaAtiva
  } = usePOS();

  const [busca, setBusca] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('TODOS');
  const [desconto, setDesconto] = useState<string>('0');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Extract unique categories
  const categorias = useMemo(() => {
    const set = new Set(produtos.map(p => p.cat));
    return ['TODOS', ...Array.from(set)];
  }, [produtos]);

  // Filter products by category and search string
  const produtosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return produtos.filter(p => {
      const matchCat = categoriaSel === 'TODOS' || p.cat === categoriaSel;
      const matchSearch = !q || p.nome.toLowerCase().includes(q) || p.cod.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [produtos, categoriaSel, busca]);

  // Subtotal & Discount calculations
  const subtotal = useMemo(() => {
    return carrinho.reduce((acc, item) => {
      const prod = produtos.find(p => p.cod === item.cod);
      return acc + (prod ? prod.preco * item.qtd : 0);
    }, 0);
  }, [carrinho, produtos]);

  const totalUnidades = useMemo(() => {
    return carrinho.reduce((acc, item) => acc + item.qtd, 0);
  }, [carrinho]);

  const descontoNum = Math.min(Math.max(parseFloat(desconto) || 0, 0), subtotal);
  const total = Math.max(0, subtotal - descontoNum);

  // Keyboard Shortcuts (F2: Pay, F4: Clear cart, F6: Search focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (carrinho.length > 0 && caixa.aberto) {
          setIsPaymentOpen(true);
        } else if (!caixa.aberto) {
          showToast('Abra o caixa antes de vender', 'erro');
        } else {
          showToast('Adicione produtos ao carrinho', 'erro');
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (carrinho.length > 0) {
          if (window.confirm('Deseja limpar todo o carrinho?')) {
            limparCarrinho();
          }
        }
      } else if (e.key === 'F6') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carrinho, caixa, limparCarrinho, showToast]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = busca.trim();
    if (!q) return;

    // Exact barcode match first
    const exact = produtos.find(p => p.cod.toLowerCase() === q.toLowerCase());
    if (exact) {
      addAoCarrinho(exact.cod);
      setBusca('');
      return;
    }

    // If only one product filtered, add it
    if (produtosFiltrados.length === 1) {
      addAoCarrinho(produtosFiltrados[0].cod);
      setBusca('');
      return;
    }

    if (produtosFiltrados.length === 0) {
      sounds.error();
      showToast('Nenhum produto encontrado com este código/nome', 'erro');
    }
  };

  const handleBarcodeScanned = (code: string) => {
    const prod = produtos.find(p => p.cod.toLowerCase() === code.toLowerCase());
    if (prod) {
      addAoCarrinho(prod.cod);
      showToast(`✔ "${prod.nome}" adicionado!`, 'sucesso');
    } else {
      sounds.error();
      showToast(`Código "${code}" não cadastrado no estoque`, 'erro');
    }
  };

  const handleOpenPayment = () => {
    if (!caixa.aberto) {
      showToast('O caixa precisa estar aberto para efetuar vendas', 'erro');
      sounds.error();
      return;
    }
    if (carrinho.length === 0) {
      showToast('Adicione ao menos um item ao carrinho', 'erro');
      sounds.error();
      return;
    }
    setIsPaymentOpen(true);
  };

  const handleVendaConcluida = (venda: Sale) => {
    setIsPaymentOpen(false);
    setDesconto('0');
    setLastCompletedSale(venda);
    setIsReceiptOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4 space-y-3 pb-24 lg:pb-6">
      
      {/* Search & Camera Barcode Scanner Row */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="🔎 Bipe o código ou digite o nome do produto... (F6 para focar)"
            className="w-full bg-[#0e0e0e] border border-neutral-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl pl-11 pr-24 py-3 text-sm sm:text-base text-white outline-none shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400">
            {produtosFiltrados.length} itens
          </div>
        </form>

        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          className="px-3.5 py-3 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-700 hover:border-amber-400 rounded-xl flex items-center gap-1.5 font-display text-xs uppercase tracking-wider shrink-0 transition-colors shadow-sm cursor-pointer"
          title="Abrir Câmera para Leitura de Código de Barras"
        >
          <Camera className="w-5 h-5" />
          <span className="hidden sm:inline">Câmera Barcode</span>
        </button>
      </div>

      {/* Category Chips Carousel */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategoriaSel(cat);
              sounds.click();
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-display uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              categoriaSel === cat
                ? 'bg-amber-400 text-black font-bold shadow-[0_0_12px_rgba(255,193,7,0.35)]'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Products Grid (Left) + Cart Box (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        
        {/* Products Grid (8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-2">
          {produtosFiltrados.length === 0 ? (
            <div className="bg-[#101010] border border-neutral-800 rounded-xl p-10 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto" />
              <h3 className="font-display text-lg text-neutral-300">Nenhum produto encontrado</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Tente buscar por outro termo ou cadastre novos produtos no menu de Estoque.
              </p>
              <button
                onClick={() => setTelaAtiva('prod')}
                className="px-4 py-2 bg-amber-400 text-black font-display font-bold uppercase rounded-lg text-xs hover:bg-amber-300"
              >
                ＋ Cadastrar Produto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
              {produtosFiltrados.map((prod) => {
                const isOutOfStock = prod.estoque <= 0;
                const isLowStock = prod.min > 0 && prod.estoque <= prod.min;

                return (
                  <div
                    key={prod.cod}
                    onClick={() => !isOutOfStock && addAoCarrinho(prod.cod)}
                    className={`relative bg-[#101010] border rounded-xl p-2.5 sm:p-3 flex flex-col justify-between transition-all select-none group cursor-pointer ${
                      isOutOfStock
                        ? 'opacity-40 border-neutral-800 grayscale cursor-not-allowed'
                        : 'border-neutral-800 hover:border-neutral-600 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.5)] active:scale-97'
                    }`}
                  >
                    {/* Top Stock Badge */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-2xl sm:text-3xl">{prod.emoji || '🛒'}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isOutOfStock
                          ? 'bg-rose-950/80 border-rose-600/60 text-rose-300 font-bold'
                          : isLowStock
                          ? 'bg-amber-950/80 border-amber-600/60 text-amber-300 font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}>
                        {isOutOfStock ? '0 un' : `${prod.estoque} un`}
                      </span>
                    </div>

                    {/* Title & Info */}
                    <div className="space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-medium text-neutral-100 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                        {prod.nome}
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        #{prod.cod} · {prod.cat}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mt-2 pt-1 border-t border-neutral-800/80 flex items-center justify-between">
                      <span className="font-display font-bold text-amber-400 text-sm sm:text-base tracking-wide">
                        {fmt(prod.preco)}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-neutral-900 text-neutral-400 group-hover:bg-amber-400 group-hover:text-black flex items-center justify-center text-xs transition-colors">
                        ＋
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Column (4-5 cols on desktop, sticky) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#111111] border border-neutral-800 border-t-3 border-t-amber-400 rounded-xl overflow-hidden shadow-2xl flex flex-col sticky top-16">
          
          {/* Cart Header */}
          <div className="p-3 sm:p-3.5 border-b border-neutral-800 flex items-center justify-between bg-[#141414]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                Carrinho de Compras
              </h3>
              {totalUnidades > 0 && (
                <span className="bg-amber-400 text-black text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                  {totalUnidades} un
                </span>
              )}
            </div>
            {carrinho.length > 0 && (
              <button
                onClick={limparCarrinho}
                className="text-[11px] text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Limpar (F4)
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="p-2 sm:p-3 space-y-2 max-h-[42vh] overflow-y-auto min-h-[160px]">
            {carrinho.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-center text-neutral-400 space-y-1">
                <ShoppingBag className="w-8 h-8 opacity-30" />
                <p className="text-xs">Carrinho vazio</p>
                <p className="text-[10px]">Toque nos produtos ou bipe códigos de barras.</p>
              </div>
            ) : (
              carrinho.map((item) => {
                const prod = produtos.find(p => p.cod === item.cod);
                if (!prod) return null;
                const itemTotal = prod.preco * item.qtd;

                return (
                  <div
                    key={item.cod}
                    className="bg-[#161616] border border-neutral-800/80 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{prod.emoji}</span>
                        <strong className="text-neutral-100 truncate block">{prod.nome}</strong>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {fmt(prod.preco)} × {item.qtd}
                      </div>
                    </div>

                    {/* Stepper (+ / -) */}
                    <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700/80 rounded-md p-0.5">
                      <button
                        onClick={() => mudarQtdCarrinho(item.cod, -1)}
                        className="w-6 h-6 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-white">
                        {item.qtd}
                      </span>
                      <button
                        onClick={() => mudarQtdCarrinho(item.cod, 1)}
                        className="w-6 h-6 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Item Subtotal & Delete */}
                    <div className="text-right flex items-center gap-2">
                      <strong className="font-display font-bold text-amber-400 text-sm">
                        {fmt(itemTotal)}
                      </strong>
                      <button
                        onClick={() => removerDoCarrinho(item.cod)}
                        className="text-neutral-500 hover:text-rose-400 p-1 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-3 sm:p-4 border-t border-neutral-800 bg-[#0e0e0e] space-y-2.5">
            
            {/* Subtotal */}
            <div className="flex justify-between items-center text-xs text-neutral-400">
              <span>Subtotal:</span>
              <strong className="font-mono text-neutral-200">{fmt(subtotal)}</strong>
            </div>

            {/* Discount field */}
            <div className="flex justify-between items-center text-xs text-neutral-400 gap-2">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-400" /> Desconto (R$):
              </span>
              <div className="w-28 relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  className="w-full bg-[#161616] border border-neutral-700 focus:border-amber-400 rounded px-2 py-1 text-right font-mono text-xs text-amber-300 outline-none"
                />
              </div>
            </div>

            {/* Big Total */}
            <div className="border-t border-dashed border-neutral-800 pt-2 flex justify-between items-center">
              <div>
                <span className="font-display uppercase tracking-wider text-xs text-neutral-400 block">Total a Pagar</span>
                <span className="text-[10px] text-neutral-400">{totalUnidades} produtos</span>
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-amber-400 drop-shadow-[0_0_12px_rgba(255,193,7,0.35)]">
                {fmt(total)}
              </div>
            </div>

            {/* Action Buttons (Cancel / Finalize) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={carrinho.length === 0}
                onClick={limparCarrinho}
                className="py-2.5 px-3 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-display font-semibold uppercase text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar (F4)</span>
              </button>

              <button
                type="button"
                disabled={carrinho.length === 0}
                onClick={handleOpenPayment}
                className="py-2.5 px-3 rounded-lg bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-display font-bold uppercase text-xs shadow-[0_0_15px_rgba(255,193,7,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pagar (F2)</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Floating Bottom Bar for Mobile viewports */}
      <div className="lg:hidden fixed left-0 right-0 bottom-0 z-40 bg-[#0d0d0d] border-t-2 border-amber-400 p-3 px-4 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] text-neutral-400 uppercase font-mono block">
            {totalUnidades} itens no carrinho
          </span>
          <strong className="font-display text-xl text-amber-400">
            {fmt(total)}
          </strong>
        </div>

        <button
          type="button"
          disabled={carrinho.length === 0}
          onClick={handleOpenPayment}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-display font-bold uppercase text-xs rounded-lg shadow-lg disabled:opacity-40 transition-colors cursor-pointer"
        >
          Pagar ➜
        </button>
      </div>

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={handleBarcodeScanned}
      />

      {/* Payment Processing Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        subtotal={subtotal}
        desconto={descontoNum}
        total={total}
        onVendaConcluida={handleVendaConcluida}
      />

      {/* Thermal Receipt Visualizer / Print Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        venda={lastCompletedSale}
        onClose={() => setIsReceiptOpen(false)}
      />

    </div>
  );
};
