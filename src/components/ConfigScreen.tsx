import React, { useState, useRef } from 'react';
import { usePOS } from '../context/POSContext';
import { StoreConfig } from '../types/pos';
import { PRESETS } from '../utils/presets';
import { slug, dataAgora } from '../utils/formatters';
import { sounds } from '../utils/sound';
import { AdminAuthModal } from './AdminAuthModal';
import { 
  Settings, 
  Store, 
  Database, 
  Cloud, 
  Download, 
  Upload, 
  Trash2, 
  ArrowLeft, 
  Check, 
  Copy, 
  HelpCircle,
  Smartphone,
  AlertTriangle,
  X,
  ShieldCheck,
  Lock,
  KeyRound,
  Users,
  UserPlus,
  Edit2
} from 'lucide-react';
import { Operator } from '../types/pos';

export const ConfigScreen: React.FC = () => {
  const { 
    config, 
    produtos, 
    vendas, 
    mov, 
    caixa, 
    fechamentos, 
    mesas, 
    nuvemCfg, 
    salvarConfig, 
    aplicarPreset, 
    conectarNuvem, 
    desconectarNuvem, 
    restaurarBackup, 
    zerarTodosOsDados,
    alterarSenhaAdmin,
    setTelaAtiva, 
    showToast,
    installPWA,
    pwaInstallEvent,
    operadores,
    adicionarOperador,
    editarOperador,
    removerOperador
  } = usePOS();

  // Store identity form state
  const [nome, setNome] = useState(config?.nome || '');
  const [tag, setTag] = useState(config?.tag || '');
  const [endereco, setEndereco] = useState(config?.endereco || '');
  const [doc, setDoc] = useState(config?.doc || '');
  const [msg, setMsg] = useState(config?.msg || '');
  const [nMesas, setNMesas] = useState(config?.nMesas?.toString() ?? '12');
  const [chavePix, setChavePix] = useState(config?.chavePix || '');
  const [telefoneWhatsapp, setTelefoneWhatsapp] = useState(config?.telefoneWhatsapp || '');

  // Operator Management Form state
  const [isOpModalOpen, setIsOpModalOpen] = useState(false);
  const [editingOpId, setEditingOpId] = useState<string | null>(null);
  const [opNome, setOpNome] = useState('');
  const [opSenha, setOpSenha] = useState('');
  const [opPerfil, setOpPerfil] = useState<'caixa' | 'gerente'>('caixa');
  const [opToDelete, setOpToDelete] = useState<Operator | null>(null);

  // Cloud form state
  const [nuvCodigo, setNuvCodigo] = useState(nuvemCfg?.codigo || '');
  const [nuvConfigJson, setNuvConfigJson] = useState(nuvemCfg?.cfg ? JSON.stringify(nuvemCfg.cfg, null, 2) : '');

  // Confirmation Modal for Zerar Tudo
  const [isConfirmZerarOpen, setIsConfirmZerarOpen] = useState(false);

  // Admin Auth Dialog State
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [adminAuthTitle, setAdminAuthTitle] = useState('Autorização Administrativa');
  const [adminAuthDesc, setAdminAuthDesc] = useState('');
  const [adminAuthCallback, setAdminAuthCallback] = useState<(() => void) | null>(null);

  // Change Admin Password State
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmNewPassInput, setConfirmNewPassInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingBackupText = useRef<string | null>(null);

  const handleSalvarIdentidade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('O nome da loja é obrigatório', 'erro');
      sounds.error();
      return;
    }

    const newCfg: StoreConfig = {
      nome: nome.trim(),
      tag: tag.trim(),
      endereco: endereco.trim(),
      doc: doc.trim(),
      msg: msg.trim(),
      nMesas: Math.max(0, Math.min(60, parseInt(nMesas) || 0)),
      chavePix: chavePix.trim(),
      telefoneWhatsapp: telefoneWhatsapp.trim()
    };

    salvarConfig(newCfg);
  };

  const handleExportarBackup = () => {
    const backupData = {
      versao: '2.0',
      exportadoEm: new Date().toISOString(),
      config,
      produtos,
      vendas,
      mov,
      caixa,
      fechamentos,
      mesas
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug(config?.nome || 'caixa-facil')}_backup_${dataAgora().split('/').reverse().join('-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('⬇ Arquivo de backup baixado com sucesso!', 'sucesso');
    sounds.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        pendingBackupText.current = text;
        setAdminAuthTitle('Autorização para Restaurar Backup');
        setAdminAuthDesc('Digite a senha do administrador para autorizar a restauração do backup e substituição dos dados.');
        setAdminAuthCallback(() => () => {
          if (pendingBackupText.current) {
            restaurarBackup(pendingBackupText.current);
            pendingBackupText.current = null;
          }
        });
        setIsAdminAuthOpen(true);
      } catch {
        showToast('Erro ao ler arquivo de backup', 'erro');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePromptZerarAdmin = () => {
    setIsConfirmZerarOpen(false);
    setAdminAuthTitle('Autorização para Zerar Sistema');
    setAdminAuthDesc('Digite a senha do administrador para autorizar a exclusão total e permanente de todos os dados.');
    setAdminAuthCallback(() => () => {
      zerarTodosOsDados();
    });
    setIsAdminAuthOpen(true);
  };

  const handleSalvarNovaSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassInput) {
      showToast('Digite a senha atual', 'erro');
      return;
    }
    if (!newPassInput || newPassInput.length < 4) {
      showToast('A nova senha deve ter no mínimo 4 caracteres', 'erro');
      return;
    }
    if (newPassInput !== confirmNewPassInput) {
      showToast('A confirmação da nova senha não confere', 'erro');
      return;
    }

    const res = alterarSenhaAdmin(currentPassInput, newPassInput);
    if (res.success) {
      setCurrentPassInput('');
      setNewPassInput('');
      setConfirmNewPassInput('');
      setIsChangePasswordModalOpen(false);
    }
  };

  const handleOpenNovoOperador = () => {
    setEditingOpId(null);
    setOpNome('');
    setOpSenha('');
    setOpPerfil('caixa');
    setIsOpModalOpen(true);
  };

  const handleOpenEditarOperador = (op: Operator) => {
    setEditingOpId(op.id);
    setOpNome(op.nome);
    setOpSenha(op.senha);
    setOpPerfil(op.perfil || 'caixa');
    setIsOpModalOpen(true);
  };

  const handleSalvarOperador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opNome.trim()) {
      showToast('Nome do operador é obrigatório', 'erro');
      return;
    }
    if (!opSenha.trim()) {
      showToast('Senha do operador é obrigatória', 'erro');
      return;
    }

    if (editingOpId) {
      editarOperador(editingOpId, {
        nome: opNome.trim(),
        senha: opSenha.trim(),
        perfil: opPerfil
      });
      setIsOpModalOpen(false);
    } else {
      const ok = adicionarOperador({
        nome: opNome.trim(),
        senha: opSenha.trim(),
        perfil: opPerfil
      });
      if (ok) {
        setIsOpModalOpen(false);
      }
    }
  };

  const handleAplicarModelo = (key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    const confirmMsg = key === 'generico' || preset.produtos.length === 0
      ? 'Deseja iniciar em branco? O catálogo atual será limpo para você cadastrar seus próprios produtos do zero.'
      : `Aplicar o modelo "${preset.rotulo}"? O catálogo de produtos atual será substituído pelos itens deste modelo.`;
    
    if (window.confirm(confirmMsg)) {
      aplicarPreset(key);
    }
  };

  const handleConectarNuvem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuvConfigJson.trim()) {
      showToast('Cole o objeto de configuração JSON do Firebase', 'erro');
      return;
    }
    conectarNuvem(nuvCodigo, nuvConfigJson);
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
              <Settings className="w-6 h-6" /> Configurações do Sistema
            </h2>
            <p className="text-xs text-neutral-400">
              Personalize o cupom fiscal, backup offline, chave PIX e sincronização em tempo real.
            </p>
          </div>
        </div>

        {pwaInstallEvent && (
          <button
            onClick={installPWA}
            className="px-3.5 py-1.5 bg-amber-400 text-black font-display font-bold uppercase rounded-lg text-xs flex items-center gap-1.5 hover:bg-amber-300 shadow-md cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Instalar Web APK</span>
          </button>
        )}
      </div>

      {/* Grid: Identity & Backup (Left) + Cloud & Presets (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left Column: Identity & Backup (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Identity Form */}
          <div className="bg-[#111111] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
            <h3 className="font-display text-base text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Store className="w-5 h-5 text-amber-400" /> Identidade da Loja &amp; Cupom
            </h3>

            <form onSubmit={handleSalvarIdentidade} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                  Nome do Estabelecimento *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Mercadinho Central, Burger House..."
                  required
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                  Segmento / Slogan do Cupom
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Ex: Mercado, Padaria & Conveniência"
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                    CNPJ ou CPF (Opcional)
                  </label>
                  <input
                    type="text"
                    value={doc}
                    onChange={(e) => setDoc(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                    Nº de Mesas (0 desativa)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={nMesas}
                    onChange={(e) => setNMesas(e.target.value)}
                    placeholder="12"
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                  Endereço Completo (Impresso no cupom)
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Ex: Av. Brasil, 1500 - Centro"
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-display uppercase tracking-wider text-amber-400 mb-1">
                    Chave PIX (Para gerar QR Code)
                  </label>
                  <input
                    type="text"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="CNPJ, CPF, E-mail ou Celular"
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-display uppercase tracking-wider text-emerald-400 mb-1">
                    WhatsApp da Loja (Comprovantes)
                  </label>
                  <input
                    type="text"
                    value={telefoneWhatsapp}
                    onChange={(e) => setTelefoneWhatsapp(e.target.value)}
                    placeholder="DDD + Número (ex: 11999998888)"
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                  Mensagem de Rodapé do Cupom
                </label>
                <input
                  type="text"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Obrigado pela preferência! Volte sempre."
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-display font-bold uppercase text-xs rounded-lg transition-colors cursor-pointer"
              >
                💾 Salvar Configurações da Loja
              </button>
            </form>
          </div>

          {/* Backup & Data Card */}
          <div className="bg-[#111111] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-3 shadow-xl">
            <h3 className="font-display text-base text-sky-400 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Database className="w-5 h-5 text-sky-400" /> Backup Offline &amp; Restauração
            </h3>
            
            <p className="text-xs text-neutral-400">
              Todos os dados ficam armazenados localmente e com segurança no seu dispositivo. Faça backups periódicos em arquivo JSON.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportarBackup}
                className="px-3.5 py-2 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700/60 rounded-lg text-xs font-display font-semibold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Backup Completo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-display font-semibold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Restaurar Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setIsConfirmZerarOpen(true)}
                className="px-3.5 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-display font-semibold uppercase flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>Zerar Tudo</span>
              </button>
            </div>
          </div>

          {/* Security & Admin Password Management Card */}
          <div className="bg-[#111111] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-3 shadow-xl">
            <h3 className="font-display text-base text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" /> Segurança &amp; Senha Administrativa
            </h3>
            
            <p className="text-xs text-neutral-400 leading-relaxed">
              Proteja as operações críticas do sistema com a senha do gerente/administrador. A senha é criptografada e nunca exibida publicamente.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setCurrentPassInput('');
                  setNewPassInput('');
                  setConfirmNewPassInput('');
                  setIsChangePasswordModalOpen(true);
                }}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-700 hover:border-amber-400/50 rounded-lg text-xs font-display font-semibold uppercase flex items-center gap-2 transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Alterar Senha do Administrador</span>
              </button>
            </div>
          </div>

          {/* Operator Management Card (Gestão de Operadores) */}
          <div className="bg-[#111111] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-display text-base text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Operadores de Caixa Cadastrados
              </h3>
              <button
                type="button"
                onClick={handleOpenNovoOperador}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-display uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>＋ Novo Operador</span>
              </button>
            </div>
            
            <p className="text-xs text-neutral-400 leading-relaxed">
              Cadastre aqui os operadores e caixas do estabelecimento com seus respectivos nomes e senhas de acesso.
            </p>

            <div className="space-y-2 pt-1">
              {operadores.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-2.5 bg-[#0a0a0a] border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-300 font-display text-xs font-bold">
                      {op.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-white font-medium">{op.nome}</strong>
                        <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-neutral-900 text-neutral-400 border border-neutral-800">
                          {op.perfil}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Senha: ••••• {op.criadoEm ? `· Cadastrado em ${op.criadoEm}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditarOperador(op)}
                      title="Editar operador"
                      className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpToDelete(op)}
                      title="Excluir operador"
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Presets & Cloud Sync (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Business Model Presets */}
          <div className="bg-[#111111] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-3 shadow-xl">
            <h3 className="font-display text-base text-purple-400 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
              🧩 Modelos de Negócio Pré-configurados
            </h3>
            
            <p className="text-xs text-neutral-400">
              Escolha um segmento para carregar automaticamente o cardápio ou catálogo com preços, emojis e estoques:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {Object.values(PRESETS).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAplicarModelo(p.id)}
                  className={`p-3 border rounded-xl text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    p.id === 'generico'
                      ? 'bg-[#181512] hover:bg-[#221c15] border-amber-500/40 hover:border-amber-400'
                      : 'bg-[#161616] hover:bg-neutral-800 hover:border-amber-400 border-neutral-800'
                  }`}
                >
                  <span className="text-2xl shrink-0">{p.icon}</span>
                  <div className="truncate min-w-0">
                    <strong className={`text-xs block truncate ${p.id === 'generico' ? 'text-amber-300' : 'text-neutral-200'}`}>
                      {p.rotulo}
                    </strong>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {p.produtos.length === 0 ? 'Catálogo em branco (0 itens)' : `${p.produtos.length} itens inclusos`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cloud Sync (Firebase Realtime Database) */}
          <div className="bg-[#111111] border border-sky-500/30 rounded-xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="font-display text-base text-sky-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <Cloud className="w-5 h-5 text-sky-400" /> Sincronização em Nuvem (Multi-aparelhos)
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                nuvemCfg ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50' : 'bg-neutral-900 text-neutral-400'
              }`}>
                {nuvemCfg ? `Nuvem Ativa (${nuvemCfg.codigo})` : 'Modo Local Offline'}
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Deseja usar o PDV no computador e no celular ao mesmo tempo (ex: garçom nas mesas + caixa)? Conecte seu banco Firebase Realtime (gratuito).
            </p>

            <form onSubmit={handleConectarNuvem} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                  Código da Loja (Sala compartilhada)
                </label>
                <input
                  type="text"
                  value={nuvCodigo}
                  onChange={(e) => setNuvCodigo(e.target.value)}
                  placeholder="Ex: LOJA1, MATRIZ, FILIAL_CENTRO..."
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-400 mb-1">
                  Configuração JSON do Firebase (firebaseConfig)
                </label>
                <textarea
                  rows={4}
                  value={nuvConfigJson}
                  onChange={(e) => setNuvConfigJson(e.target.value)}
                  placeholder='{"apiKey": "...", "databaseURL": "https://...", "projectId": "..."}'
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg p-2.5 font-mono text-[11px] text-neutral-300 outline-none resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white font-display font-bold uppercase text-xs rounded-lg transition-colors cursor-pointer"
                >
                  ☁️ Conectar Nuvem
                </button>
                {nuvemCfg && (
                  <button
                    type="button"
                    onClick={desconectarNuvem}
                    className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-lg text-xs font-display uppercase transition-colors"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>

      </div>

      {/* Modal de Confirmação de Segurança - Zerar Tudo */}
      {isConfirmZerarOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-rose-500/50 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5 text-rose-500">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-rose-400">
                  Zerar Todos os Dados
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmZerarOpen(false)}
                className="text-neutral-500 hover:text-neutral-300 p-1 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed">
              ATENÇÃO! Tem certeza que deseja ZERAR TUDO? Todos os dados do comércio serão apagados permanentemente. Esta ação não poderá ser desfeita.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmZerarOpen(false)}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-lg text-xs font-display font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePromptZerarAdmin}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-950"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Zerar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Senha Administrativa */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-amber-400/40 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400">
                <KeyRound className="w-5 h-5 shrink-0" />
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                  Alterar Senha do Administrador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-300 p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Digite a senha atual para validação de segurança e defina a nova senha com no mínimo 4 caracteres.
            </p>

            <form onSubmit={handleSalvarNovaSenha} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
                  Senha Atual *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={currentPassInput}
                    onChange={(e) => setCurrentPassInput(e.target.value)}
                    placeholder="Digite a senha atual..."
                    autoComplete="off"
                    required
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
                  Nova Senha *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="Nova senha (mínimo 4 caracteres)..."
                    autoComplete="off"
                    required
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
                  Confirmar Nova Senha *
                </label>
                <div className="relative">
                  <Check className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmNewPassInput}
                    onChange={(e) => setConfirmNewPassInput(e.target.value)}
                    placeholder="Repita a nova senha..."
                    autoComplete="off"
                    required
                    className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-amber-400 rounded-lg pl-9 pr-3 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="py-2.5 px-3 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-display text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-lg bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-300 text-black font-display font-bold uppercase text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Gravar Nova Senha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição de Operador */}
      {isOpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-emerald-500/40 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <Users className="w-5 h-5 shrink-0" />
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                  {editingOpId ? 'Editar Operador' : 'Novo Operador de Caixa'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-300 p-1 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Defina o nome de exibição, perfil de função e a senha numérica/alfanumérica para o login no caixa.
            </p>

            <form onSubmit={handleSalvarOperador} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
                  Nome do Operador *
                </label>
                <input
                  type="text"
                  value={opNome}
                  onChange={(e) => setOpNome(e.target.value)}
                  placeholder="Ex: Ana, Bruno, Operador 01..."
                  autoFocus
                  required
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-emerald-400 rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
                  Senha do Operador *
                </label>
                <input
                  type="text"
                  value={opSenha}
                  onChange={(e) => setOpSenha(e.target.value)}
                  placeholder="Ex: 123 ou PIN numérico..."
                  required
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-emerald-400 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display uppercase tracking-wider text-neutral-300 mb-1">
                  Perfil de Acesso
                </label>
                <select
                  value={opPerfil}
                  onChange={(e) => setOpPerfil(e.target.value as 'caixa' | 'gerente')}
                  className="w-full bg-[#0a0a0a] border border-neutral-700 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="caixa">Caixa / Atendente (Acesso a vendas e comandas)</option>
                  <option value="gerente">Gerente de Turno (Acesso a vendas e sangrias)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpModalOpen(false)}
                  className="py-2.5 px-3 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-display text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-lg bg-linear-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 text-white font-display font-bold uppercase text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{editingOpId ? 'Salvar Alterações' : 'Cadastrar Operador'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Operador */}
      {opToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-amber-500/40 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400">
                <Trash2 className="w-5 h-5 shrink-0 text-rose-400" />
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                  Excluir Operador: {opToDelete.nome}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpToDelete(null)}
                className="text-neutral-500 hover:text-neutral-300 p-1 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 space-y-2">
              <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                Tem certeza que deseja excluir este operador? O cadastro de acesso será removido, mas todas as vendas feitas por ele permanecem salvas nos relatórios!
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400/90">
                <span>Operador: <strong>{opToDelete.nome}</strong></span>
                <span>•</span>
                <span className="uppercase">Perfil: {opToDelete.perfil}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpToDelete(null)}
                className="py-2.5 px-3 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-display text-xs uppercase cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (opToDelete) {
                    removerOperador(opToDelete.id);
                    setOpToDelete(null);
                  }
                }}
                className="py-2.5 px-3 rounded-lg bg-linear-to-b from-rose-600 to-rose-700 hover:from-rose-500 text-white font-display font-bold uppercase text-xs shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Operador</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Authorization Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => {
          setIsAdminAuthOpen(false);
          setAdminAuthCallback(null);
        }}
        onSuccess={() => {
          if (adminAuthCallback) {
            adminAuthCallback();
          }
        }}
        title={adminAuthTitle}
        description={adminAuthDesc}
      />

    </div>
  );
};
