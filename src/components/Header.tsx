import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { iniciais } from '../utils/formatters';
import { AdminAuthModal } from './AdminAuthModal';
import { 
  ShoppingCart, 
  UtensilsCrossed, 
  BarChart3, 
  TrendingUp, 
  Package, 
  Settings, 
  Lock, 
  Volume2, 
  VolumeX, 
  DownloadCloud, 
  Power,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  onOpenSuprimento: () => void;
  onOpenSangria: () => void;
  onOpenFechamento: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSuprimento,
  onOpenSangria,
  onOpenFechamento
}) => {
  const { 
    config, 
    caixa, 
    operador, 
    telaAtiva, 
    setTelaAtiva, 
    soundEnabled, 
    toggleSound, 
    nuvemCfg, 
    pwaInstallEvent, 
    installPWA,
    usuarioLogado,
    logout
  } = usePOS();

  const [hora, setHora] = useState('');
  const [data, setData] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setHora(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setData(now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavAjustes = () => {
    if (usuarioLogado?.tipo === 'admin') {
      setTelaAtiva('config');
    } else {
      setIsAdminAuthOpen(true);
    }
  };

  const storeInitials = config ? iniciais(config.nome) : 'CF';
  const storeName = config?.nome || 'Caixa Fácil';
  const isAdmin = usuarioLogado?.tipo === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d0d0d] border-b border-[#242424] px-3 sm:px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* ZONE 1: BRAND TITLE (single-line brand title) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-linear-to-b from-[#1c1a14] to-[#0c0c0c] border border-amber-400/80 flex flex-col items-center justify-center text-amber-400 font-bold leading-none shadow-[0_0_12px_rgba(255,193,7,0.2)]">
            <span className="font-display text-sm sm:text-base">{storeInitials}</span>
            <span className="text-[7px] tracking-widest text-neutral-400 font-mono">PDV</span>
          </div>
          <button 
            onClick={() => setTelaAtiva('pdv')}
            className="text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded-sm"
          >
            <div className="flex items-center gap-2">
              <span className="font-display text-xs sm:text-sm font-bold text-amber-400 tracking-wider uppercase whitespace-nowrap">
                CAIXA FÁCIL JP
              </span>
              {storeName && storeName.toLowerCase() !== 'caixa fácil jp' && (
                <>
                  <span className="text-neutral-600 hidden sm:inline">•</span>
                  <span className="font-display text-xs sm:text-sm text-neutral-300 tracking-wide truncate max-w-[120px] md:max-w-[180px] hidden sm:inline whitespace-nowrap">
                    {storeName}
                  </span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* ZONE 2: NAV LINKS (Administrative options only visible for Admin/Dono) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
          <button
            onClick={() => setTelaAtiva('pdv')}
            className={`px-3 py-1.5 rounded-md text-xs font-display font-medium uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              telaAtiva === 'pdv'
                ? 'bg-amber-400 text-black font-bold shadow-[0_0_15px_rgba(255,193,7,0.3)]'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>PDV</span>
          </button>

          {(config?.nMesas ?? 12) > 0 && (
            <button
              onClick={() => setTelaAtiva('mesas')}
              className={`px-3 py-1.5 rounded-md text-xs font-display font-medium uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                telaAtiva === 'mesas'
                  ? 'bg-amber-400 text-black font-bold shadow-[0_0_15px_rgba(255,193,7,0.3)]'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Mesas</span>
            </button>
          )}

          {isAdmin && (
            <>
              <button
                onClick={() => setTelaAtiva('dash')}
                className={`px-3 py-1.5 rounded-md text-xs font-display font-medium uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  telaAtiva === 'dash'
                    ? 'bg-amber-400 text-black font-bold shadow-[0_0_15px_rgba(255,193,7,0.3)]'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Lucro</span>
              </button>

              <button
                onClick={() => setTelaAtiva('rel')}
                className={`px-3 py-1.5 rounded-md text-xs font-display font-medium uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  telaAtiva === 'rel'
                    ? 'bg-amber-400 text-black font-bold shadow-[0_0_15px_rgba(255,193,7,0.3)]'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Relatórios</span>
              </button>

              <button
                onClick={() => setTelaAtiva('prod')}
                className={`px-3 py-1.5 rounded-md text-xs font-display font-medium uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  telaAtiva === 'prod'
                    ? 'bg-amber-400 text-black font-bold shadow-[0_0_15px_rgba(255,193,7,0.3)]'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Estoque</span>
              </button>

              <button
                onClick={handleNavAjustes}
                className={`px-3 py-1.5 rounded-md text-xs font-display font-medium uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  telaAtiva === 'config'
                    ? 'bg-amber-400 text-black font-bold shadow-[0_0_15px_rgba(255,193,7,0.3)]'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Ajustes</span>
              </button>
            </>
          )}
        </nav>

        {/* ZONE 3: PRIMARY ACTIONS & STATUS */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Audio toggle button */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? "Silenciar efeitos de áudio" : "Ativar sons"}
            className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-900 rounded-md border border-neutral-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>

          {/* Cloud Badge (if connected) */}
          {nuvemCfg && (
            <span 
              onClick={handleNavAjustes}
              className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sky-950/80 text-sky-300 border border-sky-600/50 cursor-pointer hover:border-sky-400"
            >
              ☁️ {nuvemCfg.codigo}
            </span>
          )}

          {/* Quick Cash Flow Dropdown / Drawer */}
          {caixa.aberto && (
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={onOpenSuprimento}
                className="px-2.5 py-1.5 rounded-md text-xs font-display bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-amber-400/50 transition-colors whitespace-nowrap"
              >
                ＋ Suprimento
              </button>
              <button
                onClick={onOpenSangria}
                className="px-2.5 py-1.5 rounded-md text-xs font-display bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-rose-400/50 transition-colors whitespace-nowrap"
              >
                － Sangria
              </button>
            </div>
          )}

          {/* Primary Cashier Button */}
          {caixa.aberto ? (
            <button
              onClick={onOpenFechamento}
              className="px-3 py-1.5 rounded-md text-xs font-display font-semibold uppercase tracking-wider bg-linear-to-b from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white shadow-[0_0_12px_rgba(225,29,72,0.3)] transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fechar Caixa</span>
              <span className="sm:hidden">Fechar</span>
            </button>
          ) : (
            <button
              onClick={() => setTelaAtiva('login')}
              className="px-3 py-1.5 rounded-md text-xs font-display font-semibold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-all whitespace-nowrap cursor-pointer"
            >
              Abrir Caixa
            </button>
          )}

          {/* Administrative Menu Dropdown Toggle (Visible strictly for Dono / Administrador) */}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setMenuAberto(!menuAberto)}
                className="p-1.5 rounded-md bg-neutral-900 text-neutral-200 border border-neutral-700 hover:border-amber-400 cursor-pointer"
                aria-label="Abrir menu de navegação administrativa"
                title="Menu do Administrador"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuAberto ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>

              {menuAberto && (
                <div className="absolute right-0 mt-2 w-52 bg-[#121212] border border-neutral-700 rounded-lg shadow-2xl p-2 z-50 flex flex-col gap-1">
                  <button
                    onClick={() => { setTelaAtiva('pdv'); setMenuAberto(false); }}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-display uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
                      telaAtiva === 'pdv' ? 'bg-amber-400 text-black font-bold' : 'text-neutral-200 hover:bg-neutral-800'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" /> PDV Principal
                  </button>
                  {(config?.nMesas ?? 12) > 0 && (
                    <button
                      onClick={() => { setTelaAtiva('mesas'); setMenuAberto(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-xs font-display uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
                        telaAtiva === 'mesas' ? 'bg-amber-400 text-black font-bold' : 'text-neutral-200 hover:bg-neutral-800'
                      }`}
                    >
                      <UtensilsCrossed className="w-4 h-4" /> Mesas &amp; Comandas
                    </button>
                  )}
                  <button
                    onClick={() => { setTelaAtiva('dash'); setMenuAberto(false); }}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-display uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
                      telaAtiva === 'dash' ? 'bg-amber-400 text-black font-bold' : 'text-neutral-200 hover:bg-neutral-800'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" /> Lucro &amp; Métricas
                  </button>
                  <button
                    onClick={() => { setTelaAtiva('rel'); setMenuAberto(false); }}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-display uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
                      telaAtiva === 'rel' ? 'bg-amber-400 text-black font-bold' : 'text-neutral-200 hover:bg-neutral-800'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" /> Relatórios de Vendas
                  </button>
                  <button
                    onClick={() => { setTelaAtiva('prod'); setMenuAberto(false); }}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-display uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
                      telaAtiva === 'prod' ? 'bg-amber-400 text-black font-bold' : 'text-neutral-200 hover:bg-neutral-800'
                    }`}
                  >
                    <Package className="w-4 h-4" /> Produtos &amp; Estoque
                  </button>
                  <button
                    onClick={() => { handleNavAjustes(); setMenuAberto(false); }}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-display uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
                      telaAtiva === 'config' ? 'bg-amber-400 text-black font-bold' : 'text-neutral-200 hover:bg-neutral-800'
                    }`}
                  >
                    <Settings className="w-4 h-4" /> Configurações
                  </button>
                  <hr className="border-neutral-800 my-1" />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => { onOpenSuprimento(); setMenuAberto(false); }}
                      className="w-full text-left px-3 py-1.5 rounded text-xs text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                    >
                      ＋ Suprimento de Troco
                    </button>
                    <button
                      onClick={() => { onOpenSangria(); setMenuAberto(false); }}
                      className="w-full text-left px-3 py-1.5 rounded text-xs text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                    >
                      － Sangria de Caixa
                    </button>
                    <button
                      onClick={() => { logout(); setMenuAberto(false); }}
                      className="w-full text-left px-3 py-1.5 rounded text-xs text-rose-400 hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sair / Trocar Usuário
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Admin Authorization Modal for accessing settings when not logged as admin */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={() => {
          setIsAdminAuthOpen(false);
          setTelaAtiva('config');
        }}
        title="Acesso às Configurações"
        description="Digite a senha de Administrador (Dono) para acessar o painel de configurações e ajustes do sistema."
      />
    </header>
  );
};
