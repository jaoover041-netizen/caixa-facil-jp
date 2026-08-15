import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { fmt, dataAgora, iniciais } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { 
  Lock, 
  Unlock, 
  User, 
  Store, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Crown,
  Users
} from 'lucide-react';

interface LoginScreenProps {
  onOpenSetup: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onOpenSetup }) => {
  const { 
    config, 
    caixa, 
    operador, 
    setOperador, 
    abrirCaixa, 
    vendas, 
    fechamentos, 
    mesas, 
    setTelaAtiva, 
    showToast,
    operadores,
    loginAdmin,
    loginCaixa
  } = usePOS();

  // Login Mode: 'caixa' | 'admin'
  const [loginMode, setLoginMode] = useState<'caixa' | 'admin'>('caixa');

  // Operator credentials
  const [selectedOpName, setSelectedOpName] = useState(operador || (operadores[0]?.nome || ''));
  const [opPassword, setOpPassword] = useState('');
  const [showOpPass, setShowOpPass] = useState(false);
  const [opError, setOpError] = useState('');

  // Admin credentials
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Cash Opening Modal state
  const [fundoInput, setFundoInput] = useState('100.00');
  const [isAberturaModalOpen, setIsAberturaModalOpen] = useState(false);

  const storeInitials = config ? iniciais(config.nome) : 'CF';
  const storeName = config?.nome || 'Caixa Fácil';
  const storeTag = config?.tag || 'Sistema de PDV Universal para todo tipo de comércio';

  const vendasHoje = vendas.filter(v => v.data === dataAgora());
  const faturamentoHoje = vendasHoje.reduce((s, v) => s + v.total, 0);
  const ultimoFechamento = fechamentos.length > 0 ? fechamentos[fechamentos.length - 1] : null;
  const mesasOcupadas = mesas.filter(m => m.status === 'OCUPADA').length;

  const handleLoginCaixa = (e: React.FormEvent) => {
    e.preventDefault();
    setOpError('');

    if (!selectedOpName) {
      setOpError('Selecione ou digite o nome do operador.');
      sounds.error();
      return;
    }

    if (!opPassword) {
      setOpError('Digite a sua senha de operador.');
      sounds.error();
      return;
    }

    const res = loginCaixa(selectedOpName, opPassword);
    if (res.success) {
      setOpPassword('');
      if (caixa.aberto) {
        setTelaAtiva('pdv');
      } else {
        setIsAberturaModalOpen(true);
      }
    } else {
      setOpError(res.msg || 'Acesso não encontrado. Peça ao dono para cadastrar você.');
    }
  };

  const handleLoginAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (!adminPassword) {
      setAdminError('Digite a senha do administrador.');
      sounds.error();
      return;
    }

    const res = loginAdmin(adminPassword);
    if (res.success) {
      setAdminPassword('');
      if (caixa.aberto) {
        setTelaAtiva('pdv');
      } else {
        setTelaAtiva('dash');
      }
    } else {
      setAdminError('Senha incorreta. Acesso não autorizado.');
    }
  };

  const handleConfirmarAbertura = (e: React.FormEvent) => {
    e.preventDefault();
    const fundoNum = parseFloat(fundoInput) || 0;
    abrirCaixa(fundoNum);
    setIsAberturaModalOpen(false);
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        
        {/* Left: Login & Terminal (7 cols) */}
        <div className="md:col-span-7 bg-[#111111] border border-neutral-800 border-t-3 border-t-amber-400 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-4 flex flex-col justify-between">
          
          {/* Logo & Brand Identity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-13 h-13 rounded-xl bg-linear-to-b from-[#1e1a0e] to-[#0c0c0c] border-2 border-amber-400 flex flex-col items-center justify-center text-amber-400 font-bold shadow-[0_0_20px_rgba(255,193,7,0.3)]">
                <span className="font-display text-xl">{storeInitials}</span>
                <span className="text-[7px] tracking-widest text-neutral-400 font-mono">PDV</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/40 text-[10px] text-emerald-300 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>100% Offline &amp; Seguro</span>
              </div>
            </div>
            
            <div>
              <span className="text-[11px] font-display uppercase tracking-widest text-amber-400 font-bold block">
                CAIXA FÁCIL JP
              </span>
              <h1 className="font-display text-2xl font-bold text-white tracking-wide">
                {storeName}
              </h1>
            </div>
            <p className="text-xs text-neutral-400">
              {storeTag}
            </p>
          </div>

          {/* Mode Selector Tabs (Caixa vs Admin) */}
          <div className="grid grid-cols-2 p-1 bg-[#090909] border border-neutral-800 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setLoginMode('caixa');
                setOpError('');
                setAdminError('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                loginMode === 'caixa'
                  ? 'bg-amber-400 text-black font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Operador / Caixa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('admin');
                setOpError('');
                setAdminError('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                loginMode === 'admin'
                  ? 'bg-amber-400 text-black font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-500" />
              <span>Dono / Administrador</span>
            </button>
          </div>

          {/* Form: Operador / Caixa */}
          {loginMode === 'caixa' && (
            <form onSubmit={handleLoginCaixa} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
                  Nome do Operador
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={selectedOpName}
                    onChange={(e) => setSelectedOpName(e.target.value)}
                    placeholder="Selecione ou digite seu nome..."
                    required
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              {/* Registered Operators Fast-Select Pills */}
              {operadores.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-display block">Operadores Cadastrados:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {operadores.map((op) => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => setSelectedOpName(op.nome)}
                        className={`px-2.5 py-1 rounded-full text-xs font-mono transition-colors cursor-pointer border ${
                          selectedOpName === op.nome
                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 font-semibold'
                            : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {op.nome} ({op.perfil})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
                  Senha do Operador
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showOpPass ? 'text' : 'password'}
                    value={opPassword}
                    onChange={(e) => setOpPassword(e.target.value)}
                    placeholder="Digite sua senha..."
                    required
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpPass(!showOpPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-0.5"
                  >
                    {showOpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {opError && (
                <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                  <span>❌</span>
                  <span>{opError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-display font-bold uppercase text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,193,7,0.35)] transition-all cursor-pointer"
              >
                {caixa.aberto ? <ArrowRight className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                <span>{caixa.aberto ? 'Acessar Caixa do Turno' : 'Entrar e Abrir Caixa'}</span>
              </button>
            </form>
          )}

          {/* Form: Dono / Administrador */}
          {loginMode === 'admin' && (
            <form onSubmit={handleLoginAdmin} className="space-y-3">
              <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-3 text-xs text-neutral-300 flex items-start gap-2.5">
                <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  O <strong>Acesso do Administrador</strong> libera todas as telas do sistema: Gerenciamento de Estoque, Lucro &amp; Métricas, Relatórios Fiscais, Cadastro de Operadores e Configurações Gerais.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
                  Senha Exclusiva do Administrador
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Digite a senha do administrador..."
                    autoFocus
                    required
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-0.5"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {adminError && (
                <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                  <span>❌</span>
                  <span>{adminError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-display font-bold uppercase text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,193,7,0.35)] transition-all cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Liberar Acesso Total</span>
              </button>
            </form>
          )}

          {/* Shortcuts Info */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
            <span>Atalhos: F2 pagar · F4 limpar · F6 busca</span>
            <button onClick={onOpenSetup} className="text-amber-400 hover:underline">
              ⚙️ Assistente
            </button>
          </div>

        </div>

        {/* Right: Quick Ledger & Shift Summary Panel (5 cols) */}
        <div className="md:col-span-5 bg-[#111111] border border-neutral-800 border-l-3 border-l-amber-400 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between space-y-4">
          
          <div>
            <h3 className="font-display text-base text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400" /> Painel Rápido de Status
            </h3>

            <div className="divide-y divide-neutral-800/80 text-xs mt-2">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-neutral-400">Status do Caixa:</span>
                <span className={`font-display font-bold px-2 py-0.5 rounded text-xs ${
                  caixa.aberto ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50' : 'bg-neutral-900 text-neutral-400'
                }`}>
                  {caixa.aberto ? `ABERTO (${caixa.operador})` : 'FECHADO'}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-neutral-400">Vendas Realizadas Hoje:</span>
                <strong className="font-mono text-white text-sm">{vendasHoje.length}</strong>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-neutral-400">Faturamento Hoje:</span>
                <strong className="font-display text-amber-400 text-lg font-bold">{fmt(faturamentoHoje)}</strong>
              </div>

              {mesas.length > 0 && (
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-neutral-400">Ocupação de Mesas:</span>
                  <span className="font-mono text-white">{mesasOcupadas} de {mesas.length} ocupadas</span>
                </div>
              )}

              {ultimoFechamento && (
                <div className="py-2.5 space-y-1">
                  <span className="text-neutral-500 text-[10px] uppercase font-display block">Último Fechamento:</span>
                  <div className="flex justify-between text-neutral-300">
                    <span>{ultimoFechamento.data} ({ultimoFechamento.operador})</span>
                    <strong className="font-mono text-amber-400">{fmt(ultimoFechamento.faturamento)}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#161616] p-3 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
            💡 <strong>100% Offline &amp; Seguro:</strong> Funciona mesmo sem conexão com a internet. Suporta leitores de código de barras USB/Bluetooth e impressoras térmicas ESC/POS de 80mm/58mm.
          </div>

        </div>

      </div>

      {/* Cash Opening Modal (Abertura de Caixa) */}
      {isAberturaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-amber-400/40 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-display text-base text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <Unlock className="w-5 h-5 text-amber-400" /> Abertura de Caixa
            </h3>

            <p className="text-xs text-neutral-400">
              Informe o valor em dinheiro presente na gaveta para troco no início deste turno.
            </p>

            <form onSubmit={handleConfirmarAbertura} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
                  Fundo de Troco Inicial (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-base">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={fundoInput}
                    onChange={(e) => setFundoInput(e.target.value)}
                    autoFocus
                    required
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg pl-10 pr-3 py-2.5 text-right font-display text-2xl text-amber-400 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAberturaModalOpen(false)}
                  className="py-2.5 px-3 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-display text-xs uppercase"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-lg bg-linear-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 text-white font-display font-bold uppercase text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                >
                  ✔ Abrir Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
