import { Sale, CashClosing, StoreConfig, Product } from '../types/pos';

export function fmt(valor?: number | null): string {
  const v = valor || 0;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtNumber(valor?: number | null): string {
  const v = valor || 0;
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function dataAgora(): string {
  return new Date().toLocaleDateString('pt-BR');
}

export function horaAgora(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function slug(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function iniciais(nome: string): string {
  const parts = String(nome || '').trim().split(/\s+/);
  const first = (parts[0] || '')[0] || '';
  const second = (parts[1] || '')[0] || '';
  return (first + second).toUpperCase() || 'CF';
}

export function centro(str: string, width = 36): string {
  const s = String(str || '');
  if (s.length >= width) return s;
  const left = Math.floor((width - s.length) / 2);
  return ' '.repeat(Math.max(0, left)) + s;
}

export function iconeMetodo(m: string): string {
  switch (m) {
    case 'DINHEIRO': return '💵';
    case 'DÉBITO': return '💳';
    case 'CRÉDITO': return '💳';
    case 'PIX': return '📱';
    default: return '🎟️';
  }
}

export function gerarTextoCupom(venda: Sale, config: StoreConfig | null): string {
  const sep = '------------------------------------';
  const nomeLoja = config?.nome || 'CAIXA FÁCIL PDV';
  
  let c = '';
  c += centro(nomeLoja.toUpperCase()) + '\n';
  if (config?.tag) c += centro(config.tag) + '\n';
  if (config?.endereco) c += centro(config.endereco) + '\n';
  if (config?.doc) c += centro(`CNPJ/CPF: ${config.doc}`) + '\n';
  c += sep + '\n';
  c += `Data: ${venda.data}  ${venda.hora}\n`;
  c += `Op: ${venda.operador}  Venda #${String(venda.id).slice(-6)}\n`;
  if (venda.mesa) c += `*** ATENDIMENTO MESA: ${venda.mesa} ***\n`;
  c += sep + '\n';
  c += 'QTD  DESCRIÇÃO            TOTAL(R$)\n';
  c += sep + '\n';
  
  venda.itens.forEach((it) => {
    const nomeTrunc = it.nome.padEnd(20).slice(0, 20);
    const sub = fmtNumber(it.preco * it.qtd).padStart(9);
    c += `${String(it.qtd).padStart(2)}x  ${nomeTrunc} ${sub}\n`;
    if (it.qtd > 1) {
      c += `     (${fmtNumber(it.preco)} cada)\n`;
    }
  });

  c += sep + '\n';
  c += `Subtotal:`.padEnd(24) + fmtNumber(venda.subtotal).padStart(12) + '\n';
  if (venda.desconto > 0) {
    c += `Desconto:`.padEnd(24) + `-${fmtNumber(venda.desconto)}`.padStart(12) + '\n';
  }
  c += `TOTAL:`.padEnd(24) + fmtNumber(venda.total).padStart(12) + '\n';
  c += sep + '\n';
  
  c += 'PAGAMENTO:\n';
  venda.pagamentos.forEach((p) => {
    c += ` ${p.metodo}:`.padEnd(24) + fmtNumber(p.valor).padStart(12) + '\n';
  });

  if (venda.troco > 0) {
    c += ` Troco:`.padEnd(24) + fmtNumber(venda.troco).padStart(12) + '\n';
  }

  if (venda.obs) {
    c += sep + '\n';
    c += `OBS: ${venda.obs}\n`;
  }

  c += sep + '\n';
  const msg = config?.msg || 'Obrigado pela preferência! Volte sempre.';
  c += centro(msg) + '\n';
  c += centro('www.caixafacil.app') + '\n';

  return c;
}

export function gerarTextoWhatsApp(venda: Sale, config: StoreConfig | null): string {
  const nomeLoja = config?.nome || 'Caixa Fácil';
  let t = `🧾 *CUPOM FISCAL / COMPROVANTE*\n`;
  t += `*${nomeLoja}*\n`;
  if (config?.endereco) t += `📍 ${config.endereco}\n`;
  t += `📅 Data: ${venda.data} às ${venda.hora}\n`;
  t += `👤 Operador: ${venda.operador} | Pedido #${String(venda.id).slice(-6)}\n`;
  if (venda.mesa) t += `🍽️ Mesa: ${venda.mesa}\n`;
  t += `--------------------------------\n`;
  
  venda.itens.forEach((it) => {
    t += `• ${it.qtd}x *${it.nome}* = ${fmt(it.preco * it.qtd)}\n`;
  });

  t += `--------------------------------\n`;
  t += `Subtotal: ${fmt(venda.subtotal)}\n`;
  if (venda.desconto > 0) t += `Desconto: -${fmt(venda.desconto)}\n`;
  t += `*TOTAL PAGO: ${fmt(venda.total)}*\n`;
  t += `Forma: ${venda.pagamentos.map(p => `${p.metodo} (${fmt(p.valor)})`).join(', ')}\n`;
  if (venda.troco > 0) t += `Troco: ${fmt(venda.troco)}\n`;
  if (venda.obs) t += `Obs: _${venda.obs}_\n`;
  t += `\n_${config?.msg || 'Obrigado pela preferência! Volte sempre.'}_`;

  return encodeURIComponent(t);
}

export function escCSV(s: string): string {
  return '"' + String(s || '').replace(/"/g, '""') + '"';
}

export function baixarArquivoCSV(nome: string, linhas: string[]): void {
  const blob = new Blob(['\ufeff' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function exportarVendasCSV(vendas: Sale[], produtos: Product[], config: StoreConfig | null, escopo: 'dia' | 'geral'): void {
  const soHoje = escopo === 'dia';
  const hoje = dataAgora();
  const linhas = [
    'data;hora;venda_id;operador;mesa;cod_produto;produto;qtd;preco_unit;custo_unit;total_item;lucro_item;subtotal_venda;desconto;total_venda;pagamentos;troco;observacao'
  ];

  const filtradas = vendas.filter(v => !soHoje || v.data === hoje);

  filtradas.forEach((v) => {
    const pgs = v.pagamentos.map(p => `${p.metodo} ${p.valor.toFixed(2)}`).join(' | ');
    v.itens.forEach((i) => {
      const prod = produtos.find(p => p.cod === i.cod);
      const custo = prod?.custo || 0;
      const totalItem = i.preco * i.qtd;
      const lucroItem = (i.preco - custo) * i.qtd;

      linhas.push([
        v.data,
        v.hora,
        escCSV(String(v.id).slice(-6)),
        escCSV(v.operador),
        v.mesa || '',
        i.cod,
        escCSV(i.nome),
        i.qtd,
        i.preco.toFixed(2),
        custo.toFixed(2),
        totalItem.toFixed(2),
        lucroItem.toFixed(2),
        v.subtotal.toFixed(2),
        v.desconto.toFixed(2),
        v.total.toFixed(2),
        escCSV(pgs),
        (v.troco || 0).toFixed(2),
        escCSV(v.obs || '')
      ].join(';'));
    });
  });

  const nomeArquivo = `${slug(config?.nome || 'caixa-facil')}_vendas_${hoje.split('/').reverse().join('-')}${soHoje ? '_dia' : '_geral'}.csv`;
  baixarArquivoCSV(nomeArquivo, linhas);
}

export function exportarFechamentosCSV(fechamentos: CashClosing[], config: StoreConfig | null): void {
  const linhas = [
    'data;hora;operador;qtd_vendas;fundo_abertura;suprimentos;sangrias;dinheiro;debito;credito;pix;outros;faturamento_total;esperado_especie;contado_especie;diferenca'
  ];

  fechamentos.forEach((f) => {
    linhas.push([
      f.data,
      f.hora,
      escCSV(f.operador),
      f.vendas,
      f.fundo.toFixed(2),
      f.sup.toFixed(2),
      f.san.toFixed(2),
      (f.porMet['DINHEIRO'] || 0).toFixed(2),
      (f.porMet['DÉBITO'] || 0).toFixed(2),
      (f.porMet['CRÉDITO'] || 0).toFixed(2),
      (f.porMet['PIX'] || 0).toFixed(2),
      (f.porMet['OUTRO'] || 0).toFixed(2),
      f.faturamento.toFixed(2),
      f.esperado.toFixed(2),
      f.contado.toFixed(2),
      f.dif.toFixed(2)
    ].join(';'));
  });

  const hoje = dataAgora();
  const nomeArquivo = `${slug(config?.nome || 'caixa-facil')}_fechamentos_${hoje.split('/').reverse().join('-')}.csv`;
  baixarArquivoCSV(nomeArquivo, linhas);
}
