/**
 * Nexora - Centralized Products Data
 */
const PRODUCTS = [
  {
    id: 'fone-bluetooth-nexora',
    name: 'Fone Bluetooth Nexora ANC',
    price: 299.90,
    description: 'Fone de ouvido com cancelamento ativo de ruído, bateria de 30 horas e conexão multiponto de alta fidelidade.',
    category: 'Áudio',
    image: '../assets/products/fone-bluetooth.jpg',
    imageAlt: 'Fone de ouvido Bluetooth sobre fundo neutro',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`
  },
  {
    id: 'mouse-sem-fio-nexora',
    name: 'Mouse Sem Fio Ergonômico Flow',
    price: 149.50,
    description: 'Sensor óptico de alta precisão 4000 DPI, cliques silenciosos e bateria recarregável com autonomia de até 70 dias.',
    category: 'Periféricos',
    image: '../assets/products/mouse-sem-fio.jpg',
    imageAlt: 'Mouse sem fio ergonômico sobre superfície cinza',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="6"></rect><line x1="12" y1="7" x2="12" y2="11"></line></svg>`
  },
  {
    id: 'teclado-mecanico-nexora',
    name: 'Teclado Mecânico RGB Chroma Pro',
    price: 389.00,
    description: 'Switches táteis silenciosos, layout ABNT2 compacto 75%, estrutura em alumínio e iluminação customizável por tecla.',
    category: 'Periféricos',
    image: '../assets/products/teclado-mecanico.jpg',
    imageAlt: 'Teclado mecânico RGB sobre mesa escura',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8"></path></svg>`
  },
  {
    id: 'suporte-notebook-nexora',
    name: 'Suporte Articulado para Notebook Alumínio',
    price: 119.90,
    description: 'Construção robusta em liga de alumínio escovado, ajuste em 6 ângulos ergonômicos e design dobrável portátil.',
    category: 'Acessórios',
    image: '../assets/products/suporte-notebook.jpg',
    imageAlt: 'Suporte metálico para notebook em fundo branco',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`
  }
];

if (typeof window !== 'undefined') {
  window.NEXORA_PRODUCTS = PRODUCTS;
}
