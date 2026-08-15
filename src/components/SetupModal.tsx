import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { PRESETS } from '../utils/presets';
import { sounds } from '../utils/sound';
import { Store, Rocket, X, Check } from 'lucide-react';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onClose }) => {
  const { criarLoja, config } = usePOS();
  
  const [nome, setNome] = useState(config?.nome || '');
  const [tag, setTag] = useState(config?.tag || '');
  const [selectedPreset, setSelectedPreset] = useState<string>('mercado');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    criarLoja(nome, tag, selectedPreset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#111111] border border-amber-400/60 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-400 text-black flex items-center justify-center font-display font-bold text-base shadow-[0_0_12px_rgba(255,193,7,0.3)]">
              CF
            </div>
            <div>
              <h2 className="font-display text-lg text-amber-400 font-bold uppercase tracking-wider">
                Assistente de Criação de Loja
              </h2>
              <p className="text-xs text-neutral-400">Configure seu PDV em menos de 1 minuto</p>
            </div>
          </div>
          {config && (
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-md">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
              Nome do seu comércio / loja *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Mercadinho da Ana, Point do Hambúrguer, Loja Bella..."
              required
              autoFocus
              className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
              Slogan / Especialidade (Opcional)
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Ex: Mercado, Padaria & Conveniência"
              className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-display uppercase tracking-wider text-amber-400 mb-1.5">
              Deseja carregar um catálogo pronto para seu segmento?
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {Object.values(PRESETS).map((p) => {
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(p.id);
                      sounds.click();
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(255,193,7,0.2)]'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-xl">{p.icon}</span>
                    <div className="truncate">
                      <strong className="text-xs block truncate">{p.rotulo}</strong>
                      <span className="text-[10px] text-neutral-400">
                        {p.produtos.length === 0 ? 'Catálogo em branco' : `${p.produtos.length} produtos`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-300 text-black font-display font-bold uppercase text-sm rounded-xl shadow-[0_0_20px_rgba(255,193,7,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Rocket className="w-5 h-5" />
            <span>Criar Minha Loja &amp; Iniciar PDV</span>
          </button>

        </form>

      </div>
    </div>
  );
};
