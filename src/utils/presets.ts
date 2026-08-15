import { Product } from '../types/pos';

export interface BusinessPreset {
  id: string;
  rotulo: string;
  tag: string;
  icon: string;
  produtos: Product[];
}

export const PRESETS: Record<string, BusinessPreset> = {
  mercado: {
    id: 'mercado',
    rotulo: 'Minimercado & Conveniência',
    tag: 'Mercado, Bebidas & Conveniência',
    icon: '🏪',
    produtos: [
      { cod: '1001', nome: 'Coca-Cola 2L', cat: 'Bebidas', preco: 9.99, custo: 6.20, estoque: 24, min: 6, emoji: '🥤' },
      { cod: '1002', nome: 'Água Mineral 500ml', cat: 'Bebidas', preco: 2.50, custo: 1.10, estoque: 40, min: 10, emoji: '💧' },
      { cod: '1003', nome: 'Cerveja Lata 350ml', cat: 'Bebidas', preco: 4.99, custo: 3.10, estoque: 36, min: 12, emoji: '🍺' },
      { cod: '1004', nome: 'Suco de Laranja 1L', cat: 'Bebidas', preco: 7.50, custo: 4.80, estoque: 15, min: 4, emoji: '🧃' },
      { cod: '2001', nome: 'Pão Francês (kg)', cat: 'Padaria', preco: 14.90, custo: 8.00, estoque: 20, min: 5, emoji: '🥖' },
      { cod: '2002', nome: 'Bolo Caseiro (fatia)', cat: 'Padaria', preco: 5.00, custo: 2.20, estoque: 12, min: 4, emoji: '🍰' },
      { cod: '3001', nome: 'Arroz Branco 5kg', cat: 'Mercearia', preco: 27.90, custo: 21.50, estoque: 18, min: 5, emoji: '🍚' },
      { cod: '3002', nome: 'Feijão Carioca 1kg', cat: 'Mercearia', preco: 8.49, custo: 6.10, estoque: 22, min: 6, emoji: '🫘' },
      { cod: '3003', nome: 'Leite Integral 1L', cat: 'Mercearia', preco: 5.79, custo: 4.30, estoque: 30, min: 8, emoji: '🥛' },
      { cod: '3004', nome: 'Café Torrado 500g', cat: 'Mercearia', preco: 16.90, custo: 12.40, estoque: 14, min: 4, emoji: '☕' },
      { cod: '3005', nome: 'Óleo de Soja 900ml', cat: 'Mercearia', preco: 7.29, custo: 5.60, estoque: 25, min: 6, emoji: '🌻' },
      { cod: '3006', nome: 'Açúcar Cristal 1kg', cat: 'Mercearia', preco: 4.99, custo: 3.60, estoque: 28, min: 6, emoji: '🍬' },
      { cod: '4001', nome: 'Banana Prata (kg)', cat: 'Hortifruti', preco: 5.99, custo: 3.80, estoque: 18, min: 5, emoji: '🍌' },
      { cod: '4002', nome: 'Tomate (kg)', cat: 'Hortifruti', preco: 7.99, custo: 5.20, estoque: 16, min: 5, emoji: '🍅' },
      { cod: '5001', nome: 'Mussarela Fatiada (kg)', cat: 'Frios', preco: 39.90, custo: 30.00, estoque: 8, min: 2, emoji: '🧀' },
      { cod: '5002', nome: 'Presunto Cozido (kg)', cat: 'Frios', preco: 29.90, custo: 22.00, estoque: 9, min: 2, emoji: '🥓' },
      { cod: '6001', nome: 'Detergente Líquido 500ml', cat: 'Limpeza', preco: 2.99, custo: 1.80, estoque: 32, min: 8, emoji: '🧼' },
      { cod: '6002', nome: 'Papel Higiênico 4un', cat: 'Limpeza', preco: 8.90, custo: 6.20, estoque: 20, min: 5, emoji: '🧻' },
      { cod: '7001', nome: 'Chocolate ao Leite 90g', cat: 'Snacks', preco: 6.50, custo: 4.10, estoque: 26, min: 6, emoji: '🍫' },
      { cod: '7002', nome: 'Salgadinho Ondulado 90g', cat: 'Snacks', preco: 5.50, custo: 3.40, estoque: 21, min: 6, emoji: '🥔' }
    ]
  },
  lanchonete: {
    id: 'lanchonete',
    rotulo: 'Lanchonete & Delivery',
    tag: 'Hambúrgueres, Porções & Sucos',
    icon: '🍔',
    produtos: [
      { cod: '101', nome: 'X-Burger Artesanal', cat: 'Lanches', preco: 14.90, custo: 6.20, estoque: 99, min: 0, emoji: '🍔' },
      { cod: '102', nome: 'X-Bacon Especial', cat: 'Lanches', preco: 18.90, custo: 8.10, estoque: 99, min: 0, emoji: '🥓' },
      { cod: '103', nome: 'X-Tudo da Casa', cat: 'Lanches', preco: 23.90, custo: 10.50, estoque: 99, min: 0, emoji: '🍔' },
      { cod: '104', nome: 'Misto Quente Especial', cat: 'Lanches', preco: 9.50, custo: 3.80, estoque: 99, min: 0, emoji: '🥪' },
      { cod: '105', nome: 'Esfiha de Carne', cat: 'Salgados', preco: 5.00, custo: 1.80, estoque: 60, min: 10, emoji: '🥟' },
      { cod: '106', nome: 'Coxinha com Catupiry', cat: 'Salgados', preco: 6.00, custo: 2.10, estoque: 60, min: 10, emoji: '🍗' },
      { cod: '107', nome: 'Batata Frita Crocante M', cat: 'Porções', preco: 14.00, custo: 4.80, estoque: 99, min: 0, emoji: '🍟' },
      { cod: '108', nome: 'Combo Burger + Fritas + Refri', cat: 'Combos', preco: 32.90, custo: 14.00, estoque: 99, min: 0, emoji: '🎁' },
      { cod: '109', nome: 'Refrigerante Lata 350ml', cat: 'Bebidas', preco: 6.00, custo: 3.20, estoque: 48, min: 12, emoji: '🥤' },
      { cod: '110', nome: 'Suco Natural 500ml', cat: 'Bebidas', preco: 8.50, custo: 3.00, estoque: 30, min: 6, emoji: '🧃' },
      { cod: '111', nome: 'Água Mineral c/ Gás', cat: 'Bebidas', preco: 3.50, custo: 1.30, estoque: 48, min: 12, emoji: '💧' },
      { cod: '112', nome: 'Açaí na Tigela 300ml', cat: 'Sobremesas', preco: 14.00, custo: 6.50, estoque: 40, min: 8, emoji: '🍨' },
      { cod: '113', nome: 'Pudim de Leite (Fatia)', cat: 'Sobremesas', preco: 7.00, custo: 2.40, estoque: 20, min: 4, emoji: '🍮' }
    ]
  },
  farmacia: {
    id: 'farmacia',
    rotulo: 'Farmácia & Drogaria',
    tag: 'Saúde, Medicamentos & Higiene',
    icon: '💊',
    produtos: [
      { cod: '201', nome: 'Dipirona 500mg 20cp', cat: 'Medicamentos', preco: 8.90, custo: 4.80, estoque: 40, min: 10, emoji: '💊' },
      { cod: '202', nome: 'Paracetamol 750mg 20cp', cat: 'Medicamentos', preco: 7.50, custo: 4.10, estoque: 40, min: 10, emoji: '💊' },
      { cod: '203', nome: 'Omeprazol 20mg 28cp', cat: 'Medicamentos', preco: 12.90, custo: 7.50, estoque: 30, min: 8, emoji: '💊' },
      { cod: '204', nome: 'Vitamina C Efervescente 10cp', cat: 'Vitaminas', preco: 15.90, custo: 9.20, estoque: 25, min: 6, emoji: '🍊' },
      { cod: '205', nome: 'Soro Fisiológico 500ml', cat: 'Medicamentos', preco: 5.50, custo: 2.90, estoque: 35, min: 8, emoji: '💧' },
      { cod: '206', nome: 'Álcool 70% 500ml', cat: 'Higiene', preco: 6.99, custo: 3.80, estoque: 30, min: 8, emoji: '🧴' },
      { cod: '207', nome: 'Algodão Hidrófilo 100g', cat: 'Higiene', preco: 4.50, custo: 2.40, estoque: 30, min: 8, emoji: '☁️' },
      { cod: '208', nome: 'Curativo Band-Aid c/ 40un', cat: 'Primeiros Socorros', preco: 9.90, custo: 5.60, estoque: 25, min: 6, emoji: '🩹' },
      { cod: '209', nome: 'Creme Dental 90g', cat: 'Higiene', preco: 5.90, custo: 3.50, estoque: 28, min: 6, emoji: '🪥' },
      { cod: '210', nome: 'Protetor Solar FPS50 200ml', cat: 'Beleza', preco: 46.90, custo: 28.00, estoque: 15, min: 4, emoji: '🧴' },
      { cod: '211', nome: 'Fralda Descartável M c/ 30', cat: 'Bebê', preco: 39.90, custo: 27.00, estoque: 18, min: 4, emoji: '👶' },
      { cod: '212', nome: 'Lenços Umedecidos 50un', cat: 'Bebê', preco: 12.90, custo: 7.80, estoque: 22, min: 6, emoji: '👶' }
    ]
  },
  moda: {
    id: 'moda',
    rotulo: 'Loja de Roupas & Calçados',
    tag: 'Moda, Estilo & Acessórios',
    icon: '👗',
    produtos: [
      { cod: '301', nome: 'Camiseta Algodão Básica', cat: 'Masculino', preco: 39.90, custo: 18.00, estoque: 20, min: 4, emoji: '👕' },
      { cod: '302', nome: 'Blusa Canelada Feminina', cat: 'Feminino', preco: 44.90, custo: 21.00, estoque: 20, min: 4, emoji: '👚' },
      { cod: '303', nome: 'Calça Jeans Skinny', cat: 'Feminino', preco: 119.90, custo: 60.00, estoque: 15, min: 3, emoji: '👖' },
      { cod: '304', nome: 'Bermuda Sarja Masculina', cat: 'Masculino', preco: 69.90, custo: 32.00, estoque: 15, min: 3, emoji: '🩳' },
      { cod: '305', nome: 'Vestido Estampado', cat: 'Feminino', preco: 129.90, custo: 62.00, estoque: 12, min: 2, emoji: '👗' },
      { cod: '306', nome: 'Conjunto Infantil Verão', cat: 'Infantil', preco: 49.90, custo: 24.00, estoque: 18, min: 3, emoji: '🧒' },
      { cod: '307', nome: 'Biquíni Cintura Alta', cat: 'Feminino', preco: 79.90, custo: 38.00, estoque: 10, min: 2, emoji: '👙' },
      { cod: '308', nome: 'Kit Meias 3 Pares', cat: 'Acessórios', preco: 14.90, custo: 6.50, estoque: 40, min: 10, emoji: '🧦' },
      { cod: '309', nome: 'Boné Aba Curva', cat: 'Acessórios', preco: 39.90, custo: 17.00, estoque: 15, min: 3, emoji: '🧢' },
      { cod: '310', nome: 'Bolsa Tiracolo Casual', cat: 'Acessórios', preco: 89.90, custo: 42.00, estoque: 8, min: 2, emoji: '👜' },
      { cod: '311', nome: 'Rasteirinha Conforto', cat: 'Calçados', preco: 49.90, custo: 23.00, estoque: 12, min: 3, emoji: '👡' },
      { cod: '312', nome: 'Tênis Esportivo Casual', cat: 'Calçados', preco: 159.90, custo: 85.00, estoque: 10, min: 2, emoji: '👟' }
    ]
  },
  petshop: {
    id: 'petshop',
    rotulo: 'Pet Shop & Banho/Tosa',
    tag: 'Rações, Acessórios & Estética Pet',
    icon: '🐶',
    produtos: [
      { cod: '401', nome: 'Ração Cães Adultos 1kg', cat: 'Alimentos', preco: 19.90, custo: 13.00, estoque: 25, min: 6, emoji: '🦴' },
      { cod: '402', nome: 'Ração Gatos Castrados 1kg', cat: 'Alimentos', preco: 22.90, custo: 15.20, estoque: 25, min: 6, emoji: '🐱' },
      { cod: '403', nome: 'Sachê Gourmet Pet 85g', cat: 'Alimentos', preco: 4.50, custo: 2.80, estoque: 60, min: 15, emoji: '🍖' },
      { cod: '404', nome: 'Biscoito Petisco Canino 200g', cat: 'Alimentos', preco: 8.90, custo: 5.20, estoque: 40, min: 10, emoji: '🦴' },
      { cod: '405', nome: 'Areia Sanitária Gatos 4kg', cat: 'Higiene', preco: 16.90, custo: 10.40, estoque: 20, min: 5, emoji: '🧺' },
      { cod: '406', nome: 'Shampoo Neutro Pet 500ml', cat: 'Higiene', preco: 18.90, custo: 10.80, estoque: 20, min: 5, emoji: '🧴' },
      { cod: '407', nome: 'Bolinha de Tênis Mordedor', cat: 'Brinquedos', preco: 12.90, custo: 6.20, estoque: 25, min: 5, emoji: '🎾' },
      { cod: '408', nome: 'Arranhador Torre P/ Gatos', cat: 'Brinquedos', preco: 49.90, custo: 26.00, estoque: 10, min: 2, emoji: '🐈' },
      { cod: '409', nome: 'Guia Retrátil + Coleira', cat: 'Acessórios', preco: 34.90, custo: 17.00, estoque: 15, min: 3, emoji: '🦮' },
      { cod: '410', nome: 'Comedouro Inox Duplo', cat: 'Acessórios', preco: 24.90, custo: 12.00, estoque: 15, min: 3, emoji: '🥣' },
      { cod: '411', nome: 'Vermífugo Amplo Espectro', cat: 'Farmácia', preco: 26.90, custo: 15.50, estoque: 18, min: 4, emoji: '💊' },
      { cod: '412', nome: 'Banho Básico (Porte Pequeno)', cat: 'Serviços', preco: 45.00, custo: 12.00, estoque: 99, min: 0, emoji: '🛁' },
      { cod: '413', nome: 'Banho & Tosa Completa', cat: 'Serviços', preco: 70.00, custo: 20.00, estoque: 99, min: 0, emoji: '✂️' }
    ]
  },
  salao: {
    id: 'salao',
    rotulo: 'Salão de Beleza & Barbearia',
    tag: 'Cabelo, Barba, Estética & Unhas',
    icon: '💇',
    produtos: [
      { cod: '501', nome: 'Corte Feminino com Finalização', cat: 'Cabelo', preco: 50.00, custo: 10.00, estoque: 99, min: 0, emoji: '💇‍♀️' },
      { cod: '502', nome: 'Corte Masculino Degradê', cat: 'Cabelo', preco: 35.00, custo: 6.00, estoque: 99, min: 0, emoji: '💇‍♂️' },
      { cod: '503', nome: 'Escova & Lavagem', cat: 'Cabelo', preco: 40.00, custo: 8.00, estoque: 99, min: 0, emoji: '💨' },
      { cod: '504', nome: 'Coloração Completa', cat: 'Cabelo', preco: 130.00, custo: 55.00, estoque: 99, min: 0, emoji: '🎨' },
      { cod: '505', nome: 'Selagem / Progressiva', cat: 'Cabelo', preco: 190.00, custo: 80.00, estoque: 99, min: 0, emoji: '✨' },
      { cod: '506', nome: 'Hidratação Profunda', cat: 'Cabelo', preco: 65.00, custo: 22.00, estoque: 99, min: 0, emoji: '💆‍♀️' },
      { cod: '507', nome: 'Barba com Toalha Quente', cat: 'Barba', preco: 30.00, custo: 6.00, estoque: 99, min: 0, emoji: '🧔' },
      { cod: '508', nome: 'Manicure Completa', cat: 'Unhas', preco: 30.00, custo: 7.00, estoque: 99, min: 0, emoji: '💅' },
      { cod: '509', nome: 'Pedicure Completa', cat: 'Unhas', preco: 35.00, custo: 8.00, estoque: 99, min: 0, emoji: '🦶' },
      { cod: '510', nome: 'Design de Sobrancelhas', cat: 'Estética', preco: 25.00, custo: 5.00, estoque: 99, min: 0, emoji: '✏️' }
    ]
  },
  generico: {
    id: 'generico',
    rotulo: 'Começar em Zero (Em Branco)',
    tag: 'PDV Universal & Comércio Geral',
    icon: '✨',
    produtos: []
  }
};
