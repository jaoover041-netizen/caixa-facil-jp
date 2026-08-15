import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Product } from '../types/pos';
import { fmt } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ArrowLeft, 
  AlertTriangle, 
  Check, 
  RefreshCw,
  Tag
} from 'lucide-react';

export const ProductsScreen: React.FC = () => {
  const { produtos, salvarProduto, excluirProduto, reporEstoque, showToast, setTelaAtiva } = usePOS();
  
  const [busca, setBusca] = useState('');
  const [editandoCod, setEditandoCod] = useState<string | null>(null);

  // Form fields
  const [nome, setNome] = useState('');
  const [cod, setCod] = useState('');
  const [cat, setCat] = useState('');
  const [preco, setPreco] = useState('');
  const [custo, setCusto] = useState('0');
  const [estoque, setEstoque] = useState('10');
  const [min, setMin] = useState('3');
  const [emoji, setEmoji] = useState('🛒');

  // Categories list for autocomplete datalist
  const categorias = useMemo(() => {
    return Array.from(new Set(produtos.map(p => p.cat)));
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return produtos.filter(p => !q || p.nome.toLowerCase().includes(q) || p.cod.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q));
  }, [produtos, busca]);

  const resetForm = () => {
    setEditandoCod(null);
    setNome('');
    setCod('');
    setCat('');
    setPreco('');
    setCusto('0');
    setEstoque('10');
    setMin('3');
    setEmoji('🛒');
  };

  const handleEdit = (prod: Product) => {
    setEditandoCod(prod.cod);
    setNome(prod.nome);
    setCod(prod.cod);
    setCat(prod.cat);
    setPreco(prod.preco.toString());
    setCusto((prod.custo || 0).toString());
    setEstoque(prod.estoque.toString());
    setMin((prod.min || 0).toString());
    setEmoji(prod.emoji || '🛒');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    sounds.click();
  };

  const handleDelete = (prod: Product) => {
    if (window.confirm(`Deseja excluir "${prod.nome}" do catálogo?`)) {
      excluirProduto(prod.cod);
    }
  };

  const handleQuickRestock = (p: Product) => {
    const qtdStr = prompt(`Quantas unidades adicionar ao estoque de "${p.nome}"?`, '10');
    if (!qtdStr) return;
    const qtd = parseInt(qtdStr);
    if (qtd > 0) {
      reporEstoque(p.cod, qtd);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const precoNum = parseFloat(preco);
    if (!nome.trim() || isNaN(precoNum) || precoNum <= 0) {
      showToast('Preencha um nome e preço de venda válidos', 'erro');
      sounds.error();
      return;
    }

    let finalCod = cod.trim();
    if (!finalCod) {
      // Generate next automatic numeric code
      const highest = Math.max(0, ...produtos.map(p => parseInt(p.cod) || 0));
      finalCod = String(highest + 1);
    }

    const newProd: Product = {
      cod: finalCod,
      nome: nome.trim(),
      cat: cat.trim() || 'Geral',
      preco: precoNum,
      custo: Math.max(0, parseFloat(custo) || 0),
      estoque: Math.max(0, parseInt(estoque) || 0),
      min: Math.max(0, parseInt(min) || 0),
      emoji: emoji.trim() || '🛒'
    };

    const success = salvarProduto(newProd, editandoCod);
    if (success) {
      resetForm();
    }
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
              <Package className="w-6 h-6" /> Produtos &amp; Controle de Estoque
            </h2>
            <p className="text-xs text-neutral-400">
              Cadastre mercadorias, defina custos para apuração de lucro e alertas de estoque mínimo.
            </p>
          </div>
        </div>

        <button
          onClick={() => setTelaAtiva('config')}
          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-400/40 rounded-lg text-xs font-display font-medium uppercase tracking-wider cursor-pointer"
        >
          🧩 Aplicar Modelo Pronto
        </button>
      </div>

      {/* Grid: Form (Left, 5 cols) + Products Table (Right, 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Form Card (5 cols) */}
        <div className="lg:col-span-5 bg-[#111111] border border-neutral-800 border-t-3 border-t-amber-400 rounded-xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <h3 className="font-display text-base text-amber-400 font-bold uppercase tracking-wider">
              {editandoCod ? `Editando: ${nome}` : 'Novo Produto / Serviço'}
            </h3>
            {editandoCod && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Cancelar Edição
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            
            <div>
              <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Coca-Cola 2L, X-Bacon, Corte de Cabelo..."
                required
                className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={cod}
                  onChange={(e) => setCod(e.target.value)}
                  placeholder="Automático se vazio"
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                  Ícone / Emoji
                </label>
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="🛒"
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-sm text-center text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                Categoria *
              </label>
              <input
                type="text"
                list="cats-datalist"
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                placeholder="Ex: Bebidas, Lanches, Limpeza..."
                required
                className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
              <datalist id="cats-datalist">
                {categorias.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-amber-400 mb-1">
                  Preço de Venda (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 text-right outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                  Custo Unitário (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={custo}
                  onChange={(e) => setCusto(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-sm font-mono text-neutral-300 text-right outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                  Estoque Atual
                </label>
                <input
                  type="number"
                  min="0"
                  value={estoque}
                  onChange={(e) => setEstoque(e.target.value)}
                  placeholder="10"
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-mono text-white text-right outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                  Estoque Mínimo (Alerta)
                </label>
                <input
                  type="number"
                  min="0"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  placeholder="3"
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-mono text-neutral-400 text-right outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-300 text-black font-display font-bold uppercase text-xs rounded-lg shadow-[0_0_15px_rgba(255,193,7,0.3)] transition-all cursor-pointer"
              >
                {editandoCod ? '✔ Atualizar Produto' : '💾 Salvar Produto'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-lg text-xs font-display uppercase transition-colors"
              >
                Limpar
              </button>
            </div>

          </form>
        </div>

        {/* Products Table & Catalog (7 cols) */}
        <div className="lg:col-span-7 bg-[#111111] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <h3 className="font-display text-base text-neutral-200 font-bold uppercase tracking-wider">
              Catálogo de Produtos ({produtos.length})
            </h3>
            
            <div className="relative w-48 sm:w-60">
              <Search className="w-4 h-4 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar por nome/código..."
                className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#161616] z-10 border-b border-neutral-800 font-display uppercase tracking-wider text-[11px] text-neutral-400">
                <tr>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-2">Cat.</th>
                  <th className="py-2.5 px-2 text-right">Preço</th>
                  <th className="py-2.5 px-2 text-right">Custo</th>
                  <th className="py-2.5 px-2 text-center">Estoque</th>
                  <th className="py-2.5 px-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {produtosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-500">
                      Nenhum produto cadastrado com esse filtro.
                    </td>
                  </tr>
                ) : (
                  produtosFiltrados.map((p) => {
                    const isOutOfStock = p.estoque <= 0;
                    const isLowStock = p.min > 0 && p.estoque <= p.min;

                    return (
                      <tr key={p.cod} className="hover:bg-neutral-900/60 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{p.emoji}</span>
                            <div className="min-w-0">
                              <strong className="text-neutral-200 block truncate">{p.nome}</strong>
                              <span className="text-[10px] text-neutral-500 font-mono">#{p.cod}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-2 text-neutral-400 text-[11px]">
                          {p.cat}
                        </td>

                        <td className="py-2.5 px-2 text-right font-display font-bold text-amber-400">
                          {fmt(p.preco)}
                        </td>

                        <td className="py-2.5 px-2 text-right font-mono text-neutral-400">
                          {fmt(p.custo || 0)}
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <span className={`font-mono text-xs px-2 py-0.5 rounded-full border ${
                            isOutOfStock
                              ? 'bg-rose-950/80 border-rose-600 text-rose-300 font-bold'
                              : isLowStock
                              ? 'bg-amber-950/80 border-amber-600 text-amber-300 font-bold'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                          }`}>
                            {p.estoque} un
                          </span>
                        </td>

                        <td className="py-2.5 px-2 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => handleQuickRestock(p)}
                            className="p-1.5 text-neutral-400 hover:text-emerald-400 rounded hover:bg-neutral-800 transition-colors"
                            title="Repor Estoque Rapidamente"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-neutral-400 hover:text-amber-400 rounded hover:bg-neutral-800 transition-colors"
                            title="Editar Produto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800 transition-colors"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
};
