import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  StoreConfig,
  Product,
  CartItem,
  Sale,
  CashMovement,
  CashRegisterState,
  CashClosing,
  TableOrder,
  CloudConfig,
  ActiveScreen,
  PaymentRecord,
  Operator,
  AuthUser
} from '../types/pos';
import { PRESETS } from '../utils/presets';
import { sounds } from '../utils/sound';
import { dataAgora, horaAgora } from '../utils/formatters';
import {
  verifyAdminCredential,
  updateAdminCredential,
  resetAdminCredential
} from '../utils/security';

interface ToastItem {
  id: string;
  msg: string;
  tipo?: 'erro' | 'sucesso' | 'info';
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface POSContextType {
  config: StoreConfig | null;
  produtos: Product[];
  vendas: Sale[];
  mov: CashMovement[];
  caixa: CashRegisterState;
  fechamentos: CashClosing[];
  mesas: TableOrder[];
  operador: string;
  nuvemCfg: CloudConfig | null;
  carrinho: CartItem[];
  telaAtiva: ActiveScreen;
  toasts: ToastItem[];
  cloudStatus: 'offline' | 'connecting' | 'connected' | 'error';
  pwaInstallEvent: BeforeInstallPromptEvent | null;
  soundEnabled: boolean;
  
  // Navigation & Modals
  setTelaAtiva: (tela: ActiveScreen) => void;
  setOperador: (op: string) => void;
  toggleSound: () => void;
  showToast: (msg: string, tipo?: 'erro' | 'sucesso' | 'info') => void;
  installPWA: () => Promise<void>;

  // Store Setup
  criarLoja: (nome: string, tag: string, presetKey?: string) => void;
  salvarConfig: (newCfg: StoreConfig) => void;
  aplicarPreset: (presetKey: string) => void;
  
  // Cash Register
  abrirCaixa: (fundo: number) => void;
  fecharCaixa: (contado: number) => void;
  registrarMovimento: (tipo: 'SUPRIMENTO' | 'SANGRIA', valor: number, motivo: string) => void;
  
  // Cart Actions
  addAoCarrinho: (cod: string, qtd?: number) => void;
  mudarQtdCarrinho: (cod: string, delta: number) => void;
  removerDoCarrinho: (cod: string) => void;
  limparCarrinho: () => void;
  setCarrinhoDireto: (itens: CartItem[]) => void;
  
  // Sales
  finalizarVenda: (
    subtotal: number,
    desconto: number,
    total: number,
    pagamentos: PaymentRecord[],
    obs?: string,
    mesaNum?: number
  ) => Sale;
  
  // Products
  salvarProduto: (prod: Product, editandoCod?: string | null) => boolean;
  excluirProduto: (cod: string) => void;
  reporEstoque: (cod: string, qtd: number) => void;
  
  // Tables
  salvarComandaMesa: (mesaNum: number, itens: CartItem[], obs?: string) => void;
  liberarMesa: (mesaNum: number) => void;

  // Cloud Sync & Backup
  conectarNuvem: (codigo: string, configJson: string) => boolean;
  desconectarNuvem: () => void;
  restaurarBackup: (jsonContent: string) => boolean;
  zerarTodosOsDados: () => void;

  // Administrative Security
  validarSenhaAdmin: (senha: string) => boolean;
  alterarSenhaAdmin: (senhaAtual: string, novaSenha: string) => { success: boolean; msg: string };

  // Operators & Auth
  operadores: Operator[];
  usuarioLogado: AuthUser;
  adicionarOperador: (op: Omit<Operator, 'id'>) => boolean;
  editarOperador: (id: string, op: Partial<Operator>) => boolean;
  removerOperador: (id: string) => boolean;
  loginAdmin: (senha: string) => { success: boolean; msg?: string };
  loginCaixa: (nome: string, senha: string) => { success: boolean; msg?: string };
  logout: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const LS_PREFIX = 'cfjp_v2_';

function getLS<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(LS_PREFIX + key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function setLS<T>(key: string, val: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
  } catch {
    // quota exceeded fallback
  }
}

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<StoreConfig | null>(() => getLS('config', null));
  const [produtos, setProdutos] = useState<Product[]>(() => {
    const raw = localStorage.getItem(LS_PREFIX + 'produtos');
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(p => ({
            ...p,
            min: p.min ?? 3,
            custo: p.custo ?? 0
          }));
        }
      } catch {
        return [];
      }
    }
    // Only if first ever launch and no configuration exists
    const cfg = getLS('config', null);
    if (!cfg && raw === null) {
      return PRESETS.mercado.produtos;
    }
    return [];
  });
  const [vendas, setVendas] = useState<Sale[]>(() => getLS('vendas', []));
  const [mov, setMov] = useState<CashMovement[]>(() => getLS('mov', []));
  const [caixa, setCaixa] = useState<CashRegisterState>(() => getLS('caixa', { aberto: false }));
  const [fechamentos, setFechamentos] = useState<CashClosing[]>(() => getLS('fechamentos', []));
  const [mesas, setMesas] = useState<TableOrder[]>(() => {
    const saved = getLS<TableOrder[]>('mesas', []);
    const n = 12;
    if (!saved || !saved.length) {
      return Array.from({ length: n }, (_, i) => ({
        num: i + 1,
        status: 'LIVRE' as const,
        comanda: null
      }));
    }
    return saved;
  });
  const [operador, setOperadorState] = useState<string>(() => getLS('operador', 'Caixa 01'));
  const [nuvemCfg, setNuvemCfg] = useState<CloudConfig | null>(() => getLS('nuvem', null));
  
  const [operadores, setOperadores] = useState<Operator[]>(() => {
    const DEFAULT_OPERADORES: Operator[] = [
      { id: '1', nome: 'Ana', senha: '123', perfil: 'caixa', criadoEm: '14/08/2026' },
      { id: '2', nome: 'Bruno', senha: '123', perfil: 'gerente', criadoEm: '14/08/2026' },
      { id: '3', nome: 'Caixa 01', senha: '123', perfil: 'caixa', criadoEm: '14/08/2026' }
    ];
    const saved = getLS<Operator[]>('operadores', DEFAULT_OPERADORES);
    return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_OPERADORES;
  });
  const [usuarioLogado, setUsuarioLogado] = useState<AuthUser>(() => getLS('usuario_logado', null));

  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [telaAtiva, setTelaAtivaState] = useState<ActiveScreen>('pdv');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [cloudStatus, setCloudStatus] = useState<'offline' | 'connecting' | 'connected' | 'error'>('offline');
  const [pwaInstallEvent, setPwaInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Set default initial screen
  useEffect(() => {
    if (!config) {
      setTelaAtivaState('login');
    } else if (!caixa.aberto) {
      setTelaAtivaState('login');
    } else {
      setTelaAtivaState('pdv');
    }
  }, []);

  // Sync to LocalStorage
  useEffect(() => { setLS('config', config); }, [config]);
  useEffect(() => { setLS('produtos', produtos); }, [produtos]);
  useEffect(() => { setLS('vendas', vendas); }, [vendas]);
  useEffect(() => { setLS('mov', mov); }, [mov]);
  useEffect(() => { setLS('caixa', caixa); }, [caixa]);
  useEffect(() => { setLS('fechamentos', fechamentos); }, [fechamentos]);
  useEffect(() => { setLS('mesas', mesas); }, [mesas]);
  useEffect(() => { setLS('operador', operador); }, [operador]);
  useEffect(() => { setLS('nuvem', nuvemCfg); }, [nuvemCfg]);
  useEffect(() => { setLS('operadores', operadores); }, [operadores]);
  useEffect(() => { setLS('usuario_logado', usuarioLogado); }, [usuarioLogado]);

  // Adjust table count when config changes
  useEffect(() => {
    const desired = config?.nMesas !== undefined ? config.nMesas : 12;
    setMesas(prev => {
      if (desired <= 0) return [];
      const current = [...prev];
      while (current.length < desired) {
        current.push({ num: current.length + 1, status: 'LIVRE', comanda: null });
      }
      return current.slice(0, desired);
    });
  }, [config?.nMesas]);

  // Toast Helper
  const showToast = useCallback((msg: string, tipo: 'erro' | 'sucesso' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, msg, tipo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  }, []);

  // Sound toggle
  const toggleSound = useCallback(() => {
    const newState = sounds.toggle();
    setSoundEnabled(newState);
    showToast(newState ? '🔊 Efeitos sonoros ativados' : '🔇 Efeitos sonoros desativados');
  }, [showToast]);

  const setOperador = useCallback((op: string) => {
    setOperadorState(op);
  }, []);

  const setTelaAtiva = useCallback((tela: ActiveScreen) => {
    setTelaAtivaState(tela);
    sounds.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen for PWA beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPwaInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPWA = useCallback(async () => {
    if (!pwaInstallEvent) {
      showToast('Para instalar como APK Web: use a opção "Adicionar à tela inicial" no menu do navegador', 'info');
      return;
    }
    await pwaInstallEvent.prompt();
    const res = await pwaInstallEvent.userChoice;
    if (res.outcome === 'accepted') {
      showToast('🚀 Caixa Fácil instalado com sucesso!', 'sucesso');
      setPwaInstallEvent(null);
    }
  }, [pwaInstallEvent, showToast]);

  // Store Creation
  const criarLoja = useCallback((nome: string, tag: string, presetKey = 'mercado') => {
    const selectedPreset = PRESETS[presetKey] || PRESETS.mercado;
    const newCfg: StoreConfig = {
      nome: nome.trim() || 'Meu Comércio',
      tag: tag.trim() || selectedPreset.tag,
      endereco: '',
      doc: '',
      msg: 'Obrigado pela preferência! Volte sempre. 💛',
      nMesas: 12
    };
    const novosProdutos = selectedPreset.produtos.map(p => ({ ...p }));
    setConfig(newCfg);
    setLS('config', newCfg);
    setProdutos(novosProdutos);
    setLS('produtos', novosProdutos);
    setCarrinho([]);
    setLS('carrinho', []);
    
    if (novosProdutos.length === 0) {
      showToast(`🚀 Loja "${newCfg.nome}" criada em branco! Pronto para cadastrar produtos.`, 'sucesso');
    } else {
      showToast(`🚀 Loja "${newCfg.nome}" configurada com sucesso!`, 'sucesso');
    }
    sounds.cashRegisterDing();
  }, [showToast]);

  const salvarConfig = useCallback((newCfg: StoreConfig) => {
    setConfig(newCfg);
    setLS('config', newCfg);
    showToast('✔ Configurações da loja salvas com sucesso', 'sucesso');
    sounds.click();
  }, [showToast]);

  const aplicarPreset = useCallback((presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    const novosProdutos = preset.produtos.map(p => ({ ...p }));
    setProdutos(novosProdutos);
    setLS('produtos', novosProdutos);
    setCarrinho([]);
    setLS('carrinho', []);
    
    setConfig(prev => {
      const updated: StoreConfig = prev ? { ...prev, tag: preset.tag } : {
        nome: 'Meu Comércio',
        tag: preset.tag,
        endereco: '',
        doc: '',
        msg: 'Obrigado pela preferência! Volte sempre. 💛',
        nMesas: 12
      };
      setLS('config', updated);
      return updated;
    });

    if (novosProdutos.length === 0) {
      showToast('✨ Catálogo iniciado em branco! Pronto para cadastrar seus produtos.', 'sucesso');
    } else {
      showToast(`🧩 Catálogo substituído pelo modelo "${preset.rotulo}"`, 'sucesso');
    }
    sounds.cashRegisterDing();
  }, [showToast]);

  // Cash Register actions
  const abrirCaixa = useCallback((fundo: number) => {
    const op = operador || 'Caixa 01';
    setCaixa({
      aberto: true,
      operador: op,
      abertura: fundo,
      inicio: Date.now()
    });
    setMov(prev => [
      ...prev,
      {
        tipo: 'ABERTURA',
        valor: fundo,
        motivo: 'Fundo de troco inicial',
        data: dataAgora(),
        hora: horaAgora(),
        operador: op
      }
    ]);
    showToast(`🔓 Caixa aberto com ${fundo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de fundo`, 'sucesso');
    sounds.cashRegisterDing();
    setTelaAtivaState('pdv');
  }, [operador, showToast]);

  const fecharCaixa = useCallback((contado: number) => {
    if (!caixa.aberto) return;
    
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
    const dif = contado - esperado;

    const novoFechamento: CashClosing = {
      id: Date.now(),
      data: dataAgora(),
      hora: horaAgora(),
      operador: caixa.operador || operador,
      fundo: caixa.abertura || 0,
      sup,
      san,
      porMet,
      faturamento,
      esperado,
      contado,
      dif,
      vendas: vs.length
    };

    setFechamentos(prev => [...prev, novoFechamento]);
    setCaixa({ aberto: false });
    setCarrinho([]);
    showToast('🔒 Fechamento de caixa registrado!', 'sucesso');
    sounds.cashRegisterDing();
    setTelaAtivaState('login');
  }, [caixa, vendas, mov, operador, showToast]);

  const registrarMovimento = useCallback((tipo: 'SUPRIMENTO' | 'SANGRIA', valor: number, motivo: string) => {
    if (!caixa.aberto) {
      showToast('Abra o caixa primeiro', 'erro');
      return;
    }
    const op = caixa.operador || operador;
    setMov(prev => [
      ...prev,
      {
        tipo,
        valor,
        motivo: motivo.trim() || (tipo === 'SUPRIMENTO' ? 'Reforço de troco' : 'Retirada de caixa'),
        data: dataAgora(),
        hora: horaAgora(),
        operador: op
      }
    ]);
    showToast(`${tipo === 'SUPRIMENTO' ? '＋ Suprimento' : '－ Sangria'} de R$ ${valor.toFixed(2)} registrado!`, 'sucesso');
    sounds.click();
  }, [caixa, operador, showToast]);

  // Cart actions
  const addAoCarrinho = useCallback((cod: string, qtd = 1) => {
    const prod = produtos.find(p => p.cod === cod);
    if (!prod) {
      sounds.error();
      showToast('Produto não encontrado', 'erro');
      return;
    }

    setCarrinho(prev => {
      const existing = prev.find(item => item.cod === cod);
      const curQtd = existing ? existing.qtd : 0;
      if (curQtd + qtd > prod.estoque) {
        sounds.error();
        showToast(`Estoque esgotado para "${prod.nome}" (Disponível: ${prod.estoque})`, 'erro');
        return prev;
      }

      sounds.scanItem();
      if (existing) {
        return prev.map(item => item.cod === cod ? { ...item, qtd: item.qtd + qtd } : item);
      }
      return [...prev, { cod, qtd }];
    });
  }, [produtos, showToast]);

  const mudarQtdCarrinho = useCallback((cod: string, delta: number) => {
    const prod = produtos.find(p => p.cod === cod);
    setCarrinho(prev => {
      const item = prev.find(i => i.cod === cod);
      if (!item) return prev;
      const nextQtd = item.qtd + delta;
      if (nextQtd <= 0) {
        sounds.click();
        return prev.filter(i => i.cod !== cod);
      }
      if (prod && nextQtd > prod.estoque) {
        sounds.error();
        showToast(`Limite de estoque atingido (${prod.estoque} un)`, 'erro');
        return prev;
      }
      sounds.click();
      return prev.map(i => i.cod === cod ? { ...i, qtd: nextQtd } : i);
    });
  }, [produtos, showToast]);

  const removerDoCarrinho = useCallback((cod: string) => {
    setCarrinho(prev => prev.filter(i => i.cod !== cod));
    sounds.click();
  }, []);

  const limparCarrinho = useCallback(() => {
    setCarrinho([]);
    sounds.click();
  }, []);

  const setCarrinhoDireto = useCallback((itens: CartItem[]) => {
    setCarrinho(itens);
  }, []);

  // Finalize Sale
  const finalizarVenda = useCallback((
    subtotal: number,
    desconto: number,
    total: number,
    pagamentos: PaymentRecord[],
    obs?: string,
    mesaNum?: number
  ): Sale => {
    const saleItems = carrinho.map(c => {
      const p = produtos.find(item => item.cod === c.cod);
      return {
        cod: c.cod,
        nome: p ? p.nome : 'Item',
        preco: p ? p.preco : 0,
        custo: p?.custo || 0,
        qtd: c.qtd
      };
    });

    const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0);
    const troco = Math.max(0, totalPago - total);

    const novaVenda: Sale = {
      id: Date.now(),
      data: dataAgora(),
      hora: horaAgora(),
      operador: caixa.operador || operador || 'Caixa 01',
      caixaId: caixa.inicio,
      itens: saleItems,
      subtotal,
      desconto,
      total,
      pagamentos,
      troco,
      obs: obs?.trim() || undefined,
      mesa: mesaNum
    };

    // Decrease stock
    setProdutos(prev => prev.map(p => {
      const sold = saleItems.find(it => it.cod === p.cod);
      if (sold) {
        return { ...p, estoque: Math.max(0, p.estoque - sold.qtd) };
      }
      return p;
    }));

    // If table sale, clear table
    if (mesaNum) {
      setMesas(prev => prev.map(m => m.num === mesaNum ? { ...m, status: 'LIVRE', comanda: null } : m));
    }

    setVendas(prev => [...prev, novaVenda]);
    setCarrinho([]);
    sounds.cashRegisterDing();
    return novaVenda;
  }, [carrinho, produtos, caixa, operador]);

  // Product actions
  const salvarProduto = useCallback((prod: Product, editandoCod?: string | null): boolean => {
    let success = false;
    setProdutos(prev => {
      if (editandoCod) {
        success = true;
        return prev.map(p => p.cod === editandoCod ? { ...prod } : p);
      }
      if (prev.some(p => p.cod === prod.cod)) {
        showToast('Código de barras já existe no cadastro', 'erro');
        sounds.error();
        success = false;
        return prev;
      }
      success = true;
      return [...prev, { ...prod }];
    });
    if (success) {
      showToast(editandoCod ? '✔ Produto atualizado!' : '✔ Produto cadastrado com sucesso!', 'sucesso');
      sounds.click();
    }
    return success;
  }, [showToast]);

  const excluirProduto = useCallback((cod: string) => {
    setProdutos(prev => prev.filter(p => p.cod !== cod));
    showToast('Produto excluído do catálogo', 'info');
    sounds.click();
  }, [showToast]);

  const reporEstoque = useCallback((cod: string, qtd: number) => {
    if (qtd <= 0) return;
    setProdutos(prev => prev.map(p => p.cod === cod ? { ...p, estoque: p.estoque + qtd } : p));
    showToast(`📥 Estoque reabastecido (+${qtd} un)`, 'sucesso');
    sounds.click();
  }, [showToast]);

  // Tables actions
  const salvarComandaMesa = useCallback((mesaNum: number, itens: CartItem[], obs?: string) => {
    setMesas(prev => prev.map(m => {
      if (m.num === mesaNum) {
        if (itens.length > 0) {
          return {
            ...m,
            status: 'OCUPADA',
            comanda: {
              itens,
              obs: obs?.trim() || '',
              abertura: m.comanda?.abertura || Date.now()
            }
          };
        }
        return { ...m, status: 'LIVRE', comanda: null };
      }
      return m;
    }));
    showToast(`🍽️ Mesa ${mesaNum} salva!`, 'sucesso');
    sounds.click();
  }, [showToast]);

  const liberarMesa = useCallback((mesaNum: number) => {
    setMesas(prev => prev.map(m => m.num === mesaNum ? { ...m, status: 'LIVRE', comanda: null } : m));
    showToast(`Mesa ${mesaNum} liberada`, 'info');
    sounds.click();
  }, [showToast]);

  // Backup & restore
  const restaurarBackup = useCallback((jsonContent: string): boolean => {
    try {
      const data = JSON.parse(jsonContent);
      if (!data || !Array.isArray(data.produtos)) {
        throw new Error('Formato inválido');
      }
      if (data.config) setConfig(data.config);
      if (data.produtos) setProdutos(data.produtos);
      if (data.vendas) setVendas(data.vendas);
      if (data.mov) setMov(data.mov);
      if (data.caixa) setCaixa(data.caixa);
      if (data.fechamentos) setFechamentos(data.fechamentos);
      if (data.mesas) setMesas(data.mesas);
      showToast('✔ Backup restaurado com sucesso!', 'sucesso');
      sounds.cashRegisterDing();
      return true;
    } catch {
      showToast('Arquivo de backup inválido ou corrompido', 'erro');
      sounds.error();
      return false;
    }
  }, [showToast]);

  const zerarTodosOsDados = useCallback(() => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }

    resetAdminCredential();

    // Explicitly persist cleared state so reloads start completely clean
    setLS('config', null);
    setLS('produtos', []);
    setLS('vendas', []);
    setLS('mov', []);
    setLS('caixa', { aberto: false });
    setLS('fechamentos', []);
    setLS('mesas', []);
    setLS('carrinho', []);
    setLS('operador', '');
    setLS('nuvem', null);

    // Reset all React state
    setConfig(null);
    setProdutos([]);
    setVendas([]);
    setMov([]);
    setCaixa({ aberto: false });
    setFechamentos([]);
    setMesas([]);
    setCarrinho([]);
    setOperadorState('');
    setNuvemCfg(null);
    setCloudStatus('offline');

    showToast('Sistema zerado com sucesso! Todos os dados do comércio foram removidos.', 'sucesso');
    sounds.cashRegisterDing();
    setTelaAtivaState('login');
  }, [showToast]);

  const validarSenhaAdmin = useCallback((senha: string): boolean => {
    return verifyAdminCredential(senha);
  }, []);

  const alterarSenhaAdmin = useCallback((senhaAtual: string, novaSenha: string): { success: boolean; msg: string } => {
    const res = updateAdminCredential(senhaAtual, novaSenha);
    if (res.success) {
      showToast(res.msg, 'sucesso');
      sounds.cashRegisterDing();
    } else {
      showToast(res.msg, 'erro');
      sounds.error();
    }
    return res;
  }, [showToast]);

  const loginAdmin = useCallback((senha: string): { success: boolean; msg?: string } => {
    const clean = senha.trim();
    if (verifyAdminCredential(clean)) {
      const user: AuthUser = { tipo: 'admin', nome: 'Administrador (Dono)' };
      setUsuarioLogado(user);
      setOperadorState('Administrador');
      showToast('✅ Acesso total liberado!', 'sucesso');
      sounds.cashRegisterDing();
      return { success: true };
    } else {
      showToast('❌ Senha incorreta', 'erro');
      sounds.error();
      return { success: false, msg: 'Senha incorreta' };
    }
  }, [showToast]);

  const loginCaixa = useCallback((nome: string, senha: string): { success: boolean; msg?: string } => {
    const cleanNome = nome.trim();
    const cleanSenha = senha.trim();
    
    if (!cleanNome || !cleanSenha) {
      showToast('Informe o nome do operador e a senha', 'erro');
      sounds.error();
      return { success: false, msg: 'Preencha todos os campos' };
    }

    const valido = operadores.some(
      op => op.nome.toLowerCase() === cleanNome.toLowerCase() && op.senha === cleanSenha
    );

    if (valido) {
      const matchedOp = operadores.find(op => op.nome.toLowerCase() === cleanNome.toLowerCase());
      const nomeReal = matchedOp ? matchedOp.nome : cleanNome;
      setOperadorState(nomeReal);
      const user: AuthUser = { tipo: 'caixa', nome: nomeReal };
      setUsuarioLogado(user);
      showToast('✅ Acesso ao caixa liberado!', 'sucesso');
      sounds.cashRegisterDing();
      return { success: true };
    } else {
      showToast('❌ Acesso não encontrado. Peça ao dono para cadastrar você.', 'erro');
      sounds.error();
      return { success: false, msg: 'Acesso não encontrado. Peça ao dono para cadastrar você.' };
    }
  }, [operadores, showToast]);

  const logout = useCallback(() => {
    setUsuarioLogado(null);
    setTelaAtivaState('login');
    showToast('Sessão encerrada com sucesso', 'info');
    sounds.click();
  }, [showToast]);

  const adicionarOperador = useCallback((opData: Omit<Operator, 'id'>): boolean => {
    const cleanNome = opData.nome.trim();
    const cleanSenha = opData.senha.trim();
    if (!cleanNome) {
      showToast('Nome do operador é obrigatório', 'erro');
      sounds.error();
      return false;
    }
    if (!cleanSenha) {
      showToast('Senha do operador é obrigatória', 'erro');
      sounds.error();
      return false;
    }
    if (operadores.some(o => o.nome.toLowerCase() === cleanNome.toLowerCase())) {
      showToast('Já existe um operador cadastrado com este nome', 'erro');
      sounds.error();
      return false;
    }
    const novoOp: Operator = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      nome: cleanNome,
      senha: cleanSenha,
      perfil: opData.perfil || 'caixa',
      criadoEm: dataAgora()
    };
    setOperadores(prev => [...prev, novoOp]);
    showToast(`Operador ${cleanNome} cadastrado com sucesso!`, 'sucesso');
    sounds.cashRegisterDing();
    return true;
  }, [operadores, showToast]);

  const editarOperador = useCallback((id: string, opData: Partial<Operator>): boolean => {
    setOperadores(prev => prev.map(o => {
      if (o.id === id) {
        return {
          ...o,
          ...opData,
          nome: opData.nome !== undefined ? opData.nome.trim() : o.nome,
          senha: opData.senha !== undefined ? opData.senha.trim() : o.senha
        };
      }
      return o;
    }));
    showToast('Operador atualizado com sucesso!', 'sucesso');
    sounds.click();
    return true;
  }, [showToast]);

  const removerOperador = useCallback((id: string): boolean => {
    setOperadores(prev => prev.filter(o => o.id !== id));
    showToast('✅ Operador excluído. Acesso removido, registros de vendas mantidos.', 'sucesso');
    sounds.click();
    return true;
  }, [showToast]);

  const conectarNuvem = useCallback((codigo: string, configJson: string): boolean => {
    try {
      const parsed = JSON.parse(configJson);
      const cleanCod = (codigo.trim() || 'LOJA1').toUpperCase().replace(/\s+/g, '_');
      setNuvemCfg({ codigo: cleanCod, cfg: parsed });
      setCloudStatus('connected');
      showToast(`☁️ Nuvem conectada (Código: ${cleanCod})`, 'sucesso');
      sounds.cashRegisterDing();
      return true;
    } catch {
      showToast('Configuração Firebase JSON inválida', 'erro');
      sounds.error();
      return false;
    }
  }, [showToast]);

  const desconectarNuvem = useCallback(() => {
    setNuvemCfg(null);
    setCloudStatus('offline');
    showToast('Nuvem desconectada — operando 100% offline', 'info');
    sounds.click();
  }, [showToast]);

  return (
    <POSContext.Provider
      value={{
        config,
        produtos,
        vendas,
        mov,
        caixa,
        fechamentos,
        mesas,
        operador,
        nuvemCfg,
        carrinho,
        telaAtiva,
        toasts,
        cloudStatus,
        pwaInstallEvent,
        soundEnabled,
        setTelaAtiva,
        setOperador,
        toggleSound,
        showToast,
        installPWA,
        criarLoja,
        salvarConfig,
        aplicarPreset,
        abrirCaixa,
        fecharCaixa,
        registrarMovimento,
        addAoCarrinho,
        mudarQtdCarrinho,
        removerDoCarrinho,
        limparCarrinho,
        setCarrinhoDireto,
        finalizarVenda,
        salvarProduto,
        excluirProduto,
        reporEstoque,
        salvarComandaMesa,
        liberarMesa,
        conectarNuvem,
        desconectarNuvem,
        restaurarBackup,
        zerarTodosOsDados,
        validarSenhaAdmin,
        alterarSenhaAdmin,
        operadores,
        usuarioLogado,
        adicionarOperador,
        editarOperador,
        removerOperador,
        loginAdmin,
        loginCaixa,
        logout
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export function usePOS(): POSContextType {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS deve ser usado dentro de POSProvider');
  }
  return context;
}
