/* Configurações da loja. Tudo o que o cliente precisa confirmar está aqui.
   Valores marcados com "confirmar" são sugestões para a demonstração. */
window.LOJA = {
  nome: 'PP Outlets',
  cidade: 'São José dos Campos – SP',
  instagram: 'https://www.instagram.com/ppoutlets_/',
  instagramUsuario: '@ppoutlets_',
  horario: 'Segunda a sábado, das 9h às 19h',          // confirmar
  descontoPix: 0.05,                                     // 5% no Pix (confirmar)
  parcelasSemJuros: 6,                                   // até 6x sem juros (confirmar)
  parcelaMinima: 30,                                     // parcela mínima em R$ (confirmar)
  freteGratisAcima: 299,                                 // frete grátis acima de R$ 299 (confirmar)
  cepLoja: '12200-000',                                  // CEP de referência para o cálculo do frete (confirmar)
  produtosPorPagina: 24,
  /* Checkout de demonstração (Pix e boleto de exemplo, nada é cobrado).
     'auto': funciona só no endereço de prévia (*.netlify.app) e no computador de quem desenvolve;
     no domínio oficial ele se desliga sozinho, para nenhum cliente achar que pagou um pedido que não existe.
     Quando o pagamento real for ligado, este ajuste deixa de ser usado. */
  checkoutDemo: 'auto',

  categorias: [
    { slug: 'camisetas', nome: 'Camisetas' },
    { slug: 'camisas', nome: 'Camisas' },
    { slug: 'polos', nome: 'Polos' },
    { slug: 'camisas-de-time', nome: 'Camisas de time' },
    { slug: 'moletons-e-jaquetas', nome: 'Moletons e jaquetas' },
    { slug: 'bermudas-e-shorts', nome: 'Bermudas e shorts' },
    { slug: 'calcas', nome: 'Calças' },
    { slug: 'tenis', nome: 'Tênis' },
    { slug: 'bones', nome: 'Bonés' },
    { slug: 'acessorios', nome: 'Acessórios' },
  ],

  /* Banners da página inicial. "imagem": arquivo 2400x1200 (2:1) com o assunto no centro; as laterais são cortadas conforme a tela. */
  banners: [
    { titulo: 'Nova coleção', destaque: 'Importados e nacionais', texto: 'Camisetas, tênis e bonés que acabaram de chegar.', botao: 'Ver lançamentos', link: '#/loja/lancamentos', imagem: 'assets/img/banners/banner-novidades.webp' },
    { titulo: 'Outlet', destaque: 'Até {maxDesconto}% off', texto: 'Peças selecionadas com preço de outlet o ano todo.', botao: 'Ver ofertas', link: '#/loja/outlet', imagem: 'assets/img/banners/banner-outlet.webp' },
    { titulo: 'Grifes importadas', destaque: 'Marcas internacionais', texto: 'Camisetas de grife importadas, com nota fiscal.', botao: 'Ver importados', link: '#/loja/importados', imagem: 'assets/img/banners/banner-grifes.webp' },
    /* Banner de plus size: volte a ativar quando houver foto (imagem: 'assets/img/banners/banner-plus-size.webp').
    { titulo: 'Plus size', destaque: 'Do G1 ao G4', texto: 'Modelagens pensadas para quem veste plus size.', botao: 'Ver plus size', link: '#/loja/plus-size', imagem: null }, */
  ],
};
