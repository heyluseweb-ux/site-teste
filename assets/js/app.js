/* PP Outlets — loja virtual (HTML, CSS e JavaScript puros, sem dependências).
   Rotas por hash: #/  #/loja/<categoria>  #/busca/<termo>  #/produto/<slug>  #/favoritos
   #/checkout  #/pedido/<numero>  #/pedidos  #/pagina/<nome> */
(() => {
  'use strict';
  const L = window.LOJA;
  const P = window.PRODUTOS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $('#conteudo');

  /* ---------- utilidades ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const brl = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const round2 = n => Math.round(n * 100) / 100;
  const pixPrice = n => round2(n * (1 - L.descontoPix));
  const installments = n => { const k = Math.min(L.parcelasSemJuros, Math.floor(n / L.parcelaMinima)); return k >= 2 ? { k, v: n / k } : null; };
  const off = p => (p.precoDe ? Math.round((1 - p.preco / p.precoDe) * 100) : 0);
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const catName = slug => (L.categorias.find(c => c.slug === slug) || {}).nome || slug;
  const bySlug = slug => P.find(p => p.slug === slug);
  const byId = id => P.find(p => p.id === id);
  const maxOff = Math.max(...P.map(off));
  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const CHEV_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  const CHEV_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  const TRASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/></svg>';
  const CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  const store = {
    get(k, d) { try { const v = localStorage.getItem('pp_' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('pp_' + k, JSON.stringify(v)); } catch { /* sem armazenamento: segue só na memória */ } },
  };

  /* ---------- desenhos dos espaços de foto (um por categoria) ---------- */
  const TEE = 'M22 8 14 12 6 22l7 6 5-4v32h28V24l5 4 7-6-8-10-8-4c-2 4-6 6-10 6s-8-2-10-6z';
  const GLYPH = {
    camisetas: `<path d="${TEE}"/>`,
    polos: `<path d="${TEE}"/><path d="M26 9l6 9 6-9M32 18v10"/>`,
    camisas: '<path d="M22 8 12 12 6 40l7 2 5-18v32h28V24l5 18 7-2-6-28-10-4-10 10z"/><path d="M32 18v38M22 8l10 10 10-10"/>',
    'camisas-de-time': `<path d="${TEE}"/><path d="M18 31h28M18 37h28"/>`,
    'moletons-e-jaquetas': '<path d="M24 10c0-6 16-6 16 0l10 4 8 30-7 2-5-18v30H18V28l-5 18-7-2 8-30z"/><path d="M26 12c2 6 10 6 12 0M24 42h16l2 8H22z"/>',
    'bermudas-e-shorts': '<path d="M16 12h32l4 34-16 2-4-20-4 20-16-2z"/><path d="M16 18h32"/>',
    calcas: '<path d="M20 6h24l4 52H36l-4-36-4 36H16z"/><path d="M20 12h24"/>',
    tenis: '<path d="M6 40c0-6 4-10 8-10h8l8-8 8 4 6 8 12 4c3 1 4 4 4 6v4H6z"/><path d="M6 44h54M28 27l4 3M32 24l4 3"/>',
    bones: '<path d="M12 40c0-16 10-24 22-24s18 10 18 24z"/><path d="M52 40l8 2c-2 4-10 4-16 2M33 16h2"/>',
    acessorios: '<path d="M14 22h36l4 34H10z"/><path d="M24 22v-6c0-6 16-6 16 0v6"/>',
  };
  const ph = (cat, { label = 'Foto', dark = false, cls = '' } = {}) =>
    `<span class="ph ${dark ? 'ph--dark' : ''} ${cls}" data-label="${esc(label)}"><svg viewBox="0 0 64 64" aria-hidden="true">${GLYPH[cat] || GLYPH.camisetas}</svg></span>`;
  /* fotos da cor (cores[i].fotos) ou da peça (fotos); sem fotos, o espaço reservado */
  const photosOf = (p, cor = 0) => (p.cores[cor] && p.cores[cor].fotos) || p.fotos || [];
  const hasPhoto = p => photosOf(p).length > 0;
  const photoFirst = (a, b) => hasPhoto(b) - hasPhoto(a);
  const corIdx = (p, nome) => Math.max(0, p.cores.findIndex(c => c.nome === nome));
  const media = (p, i = 0, opts = {}, cor = 0) => {
    const f = photosOf(p, cor)[i];
    return f ? `<span class="ph ${opts.cls || ''}"><img src="${esc(f)}" alt="${esc(p.nome)}${p.cores[cor] ? ' – ' + esc(p.cores[cor].nome) : ''}" loading="lazy"></span>` : ph(p.categoria, opts);
  };
  function galleryHTML(p, cor) {
    const has = photosOf(p, cor).length > 0;
    const n = photosOf(p, cor).length || 4;
    const thumbs = n > 1 ? `<div class="gallery__thumbs">${Array.from({ length: n }, (_, i) => `<button type="button" data-thumb="${i}" aria-label="Ver foto ${i + 1}" aria-current="${i === 0}">${media(p, i, { label: '' }, cor)}</button>`).join('')}</div>` : '';
    return `${thumbs}<div class="gallery__main" data-main>${media(p, 0, { label: has ? '' : `Foto 1 de ${n}` }, cor)}</div>`;
  }

  /* ---------- estado: carrinho e favoritos ---------- */
  let cart = store.get('carrinho', []).filter(i => byId(i.id));
  let favs = new Set(store.get('favoritos', []));
  const cartCount = () => cart.reduce((s, i) => s + i.qtd, 0);
  const subtotal = () => round2(cart.reduce((s, i) => s + byId(i.id).preco * i.qtd, 0));
  function saveCart() { store.set('carrinho', cart); renderCart(); }
  function addToCart(id, cor, tam, qtd = 1) {
    const key = `${id}|${cor}|${tam}`;
    const it = cart.find(i => i.key === key);
    if (it) it.qtd = Math.min(10, it.qtd + qtd); else cart.push({ key, id, cor, tam, qtd });
    saveCart();
    const b = $('[data-cart-count]'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  }
  function toggleFav(id) {
    favs.has(id) ? favs.delete(id) : favs.add(id);
    store.set('favoritos', [...favs]);
    $$(`.fav[data-id="${id}"]`).forEach(b => b.setAttribute('aria-pressed', favs.has(id)));
    updateBadges();
    toast(favs.has(id) ? 'Adicionado aos favoritos. <a href="#/favoritos">Ver favoritos</a>' : 'Removido dos favoritos.');
    if (route().name === 'favoritos') render();
  }
  function updateBadges() {
    const c = cartCount(), f = favs.size;
    const cb = $('[data-cart-count]'); cb.textContent = c; cb.hidden = !c;
    const fb = $('[data-fav-count]'); fb.textContent = f; fb.hidden = !f;
  }

  /* ---------- pedaços de interface ---------- */
  function priceBlock(p) {
    const inst = installments(p.preco);
    return `<div class="price ${p.precoDe ? 'price--sale' : ''}">${p.precoDe ? `<s>${brl(p.precoDe)}</s>` : ''}<strong>${brl(p.preco)}</strong></div>
      <p class="card__pix"><b>${brl(pixPrice(p.preco))}</b> no Pix</p>
      ${inst ? `<p class="card__inst">ou ${inst.k}x de ${brl(inst.v)} sem juros</p>` : ''}`;
  }
  function tags(p) {
    const t = [];
    if (p.precoDe) t.push(`<span class="tag tag--sale">-${off(p)}%</span>`);
    if (p.novo) t.push('<span class="tag tag--new">Novo</span>');
    if (p.linha === 'plus-size') t.push('<span class="tag tag--plus">Plus size</span>');
    return t.join('');
  }
  function card(p) {
    const link = `#/produto/${p.slug}`;
    const nome = `${p.nome} – ${p.cores[0].nome}`;
    const quick = p.tamanhos.length > 1
      ? `<div class="quick"><p>Compra rápida</p><div class="quick__sizes">${p.tamanhos.map(t => `<button type="button" data-quick="${p.id}" data-size="${esc(t)}" ${p.esgotados.includes(t) ? 'disabled aria-label="' + esc(t) + ' esgotado"' : ''}>${esc(t)}</button>`).join('')}</div></div>`
      : `<div class="quick"><button class="btn btn--sm btn--block" type="button" data-quick="${p.id}" data-size="${esc(p.tamanhos[0])}">Adicionar ao carrinho</button></div>`;
    return `<article class="card">
      <a class="card__media" href="${link}" aria-label="${esc(nome)}"><span class="card__tags">${tags(p)}</span>${media(p)}</a>
      <button class="fav" type="button" data-fav data-id="${p.id}" aria-pressed="${favs.has(p.id)}" aria-label="Favoritar ${esc(p.nome)}">${HEART}</button>
      ${quick}
      <div class="card__body">
        <a class="card__name" href="${link}">${esc(nome)}</a>
        ${priceBlock(p)}
        ${p.cores.length > 1 ? `<div class="swatches" aria-label="Cores: ${esc(p.cores.map(c => c.nome).join(', '))}">${p.cores.map(c => `<span class="swatch" style="background:${c.hex}" title="${esc(c.nome)}"></span>`).join('')}</div>` : ''}
      </div>
    </article>`;
  }
  function rail(title, list, more, sub = '') {
    if (!list.length) return '';
    return `<section class="section section--tight"><div class="container">
      <div class="section-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${more ? `<a class="link-arrow" href="${more}">Ver tudo ${ARROW}</a>` : ''}</div>
      <div class="rail"><button class="rail__btn rail__btn--prev" type="button" aria-label="Anteriores" data-rail="-1" disabled>${CHEV_L}</button>
        <div class="rail__track">${list.map(card).join('')}</div>
        <button class="rail__btn rail__btn--next" type="button" aria-label="Próximos" data-rail="1">${CHEV_R}</button></div>
    </div></section>`;
  }
  function crumbs(items) {
    return `<nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a>${items.map(([t, h]) => `<span aria-hidden="true">/</span>${h ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`}`).join('')}</nav>`;
  }

  /* ---------- página inicial ---------- */
  function viewHome() {
    const banners = L.banners.map(b => ({ ...b, destaque: b.destaque.replace('{maxDesconto}', maxOff) }));
    const novos = P.filter(p => p.novo).sort(photoFirst).slice(0, 12);
    const top = P.filter(p => p.maisVendido).sort(photoFirst).slice(0, 12);
    const sale = P.filter(p => p.precoDe).sort((a, b) => off(b) - off(a)).slice(0, 12);
    const mosaic = [['camisas-de-time', 'Camisas de time', 'Seleção e retrô'], ['moletons-e-jaquetas', 'Moletons e jaquetas', 'Para os dias frios', 'assets/img/categorias/jaquetas.webp'], ['bones', 'Bonés', 'Aba curva, reta e bucket', 'assets/img/categorias/bones.webp'], ['bermudas-e-shorts', 'Bermudas', 'Sarja, jeans e cargo']];
    return `
    <section class="hero" aria-roledescription="carrossel" aria-label="Destaques">
      <div class="hero__slides">${banners.map((b, i) => `
        <div class="hero__slide ${i === 0 ? 'is-active' : ''}" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${banners.length}" ${i ? 'aria-hidden="true"' : ''}>
          <div class="hero__copy">
            <p class="hero__eyebrow">${esc(b.titulo)}</p>
            <h2 class="hero__title">${esc(b.destaque)}</h2>
            <p class="hero__text">${esc(b.texto)}</p>
            <a class="btn btn--gold" href="${b.link}" ${i ? 'tabindex="-1"' : ''}>${esc(b.botao)} ${ARROW}</a>
          </div>
          <div class="hero__media">${b.imagem ? `<span class="ph"><img src="${esc(b.imagem)}" alt=""></span>` : ph(['camisetas', 'tenis', 'moletons-e-jaquetas'][i % 3], { dark: true, label: 'Imagem do banner' })}</div>
        </div>`).join('')}
      </div>
      <div class="hero__ctrl">
        <button class="hero__arrow" type="button" data-hero="-1" aria-label="Banner anterior">${CHEV_L}</button>
        <div class="hero__dots">${banners.map((_, i) => `<button type="button" data-hero-go="${i}" aria-label="Banner ${i + 1}" aria-current="${i === 0}"></button>`).join('')}</div>
        <button class="hero__arrow" type="button" data-hero="1" aria-label="Próximo banner">${CHEV_R}</button>
      </div>
    </section>

    <section class="hot"><div class="container">
      <div class="section-head"><div><h2>Em alta</h2><p>Os mais procurados da loja nesta semana.</p></div></div>
      <div class="hot__grid">
        ${[['camisetas', 'Camisetas', '#/loja/camisetas', 'assets/img/categorias/camisetas.webp'], ['tenis', 'Tênis', '#/loja/tenis', 'assets/img/produtos/tenis-air-max-plus-preto-azul.webp'], ['camisetas', 'Plus size', '#/loja/plus-size']].map(([g, t, h, img]) => `
          <a class="hot__card ${img ? 'hot__card--photo' : ''}" href="${h}">${img ? `<span class="ph"><img src="${img}" alt="" loading="lazy"></span>` : ph(g, { label: '' })}<span class="hot__label"><strong>${t}</strong><span>Comprar</span></span></a>`).join('')}
      </div>
    </div></section>

    ${rail('Lançamentos', novos, '#/loja/lancamentos', 'Acabou de chegar na PP Outlets.')}

    <section class="section section--tight"><div class="container">
      <div class="section-head"><div><h2>Compre por categoria</h2></div><a class="link-arrow" href="#/loja/todos">Todos os produtos ${ARROW}</a></div>
      <div class="mosaic">${mosaic.map(([s, t, sub, img]) => `<a href="#/loja/${s}" ${img ? 'class="mosaic__photo"' : ''}>${img ? `<span class="ph"><img src="${img}" alt="" loading="lazy"></span>` : ph(s, { label: '' })}<span class="mosaic__label"><strong>${t}</strong><span>${sub}</span></span></a>`).join('')}</div>
    </div></section>

    ${rail('Mais vendidos', top, '#/loja/todos')}

    <section class="brandband"><div class="container brandband__in">
      <div><h2>Importados e nacionais. <span>Do adulto ao plus size.</span></h2>
        <p>A PP Outlets reúne moda masculina, tênis, bonés e acessórios com preço de outlet. Compre pelo site e receba em casa, ou visite a loja física em ${esc(L.cidade)}.</p></div>
      <div class="brandband__facts">
        <div><strong>${P.length} peças</strong><span>no catálogo online</span></div>
        <div><strong>G1 ao G4</strong><span>na linha plus size</span></div>
        <div><strong>${L.parcelasSemJuros}x sem juros</strong><span>no cartão de crédito</span></div>
        <div><strong>${Math.round(L.descontoPix * 100)}% off</strong><span>pagando com Pix</span></div>
      </div>
    </div></section>

    ${rail('Outlet', sale, '#/loja/outlet', `Peças com até ${maxOff}% de desconto.`)}

    <section class="news"><div class="container news__in">
      <div><h2>Receba as novidades</h2><p>Lançamentos e ofertas do outlet direto no seu e-mail.</p></div>
      <form data-news novalidate><label class="sr-only" for="news-email">Seu e-mail</label><input id="news-email" type="email" placeholder="Seu melhor e-mail" required><button class="btn" type="submit">Cadastrar</button></form>
    </div></section>`;
  }

  /* ---------- catálogo ---------- */
  const SIZE_ORDER = ['P', 'M', 'G', 'GG', 'G1', 'G2', 'G3', 'G4', '38', '39', '40', '41', '42', '43', '44', '46', '48', '50', '52', '54', 'Único'];
  const COLLECTIONS = {
    todos: { t: 'Todos os produtos', d: 'O catálogo completo da PP Outlets.', f: () => true },
    lancamentos: { t: 'Lançamentos', d: 'Peças que acabaram de chegar.', f: p => p.novo },
    outlet: { t: 'Outlet', d: `Até ${maxOff}% de desconto em peças selecionadas.`, f: p => !!p.precoDe },
    'plus-size': { t: 'Plus size', d: 'Modelagens do G1 ao G4 e numeração até 54.', f: p => p.linha === 'plus-size' },
    importados: { t: 'Importados', d: 'Peças importadas selecionadas pela PP Outlets.', f: p => p.origem === 'Importado' },
    nacionais: { t: 'Nacionais', d: 'O melhor da moda masculina feita no Brasil.', f: p => p.origem === 'Nacional' },
    roupas: { t: 'Roupas', d: 'Camisetas, camisas, polos, moletons, bermudas e calças.', f: p => !['tenis', 'bones', 'acessorios'].includes(p.categoria) },
  };
  let F = null; // filtros da listagem atual

  function viewListing(slug, query) {
    let title, desc, base, trail;
    if (query != null) {
      const q = norm(query).trim();
      base = P.filter(p => norm(`${p.nome} ${catName(p.categoria)} ${p.cores.map(c => c.nome).join(' ')} ${p.linha} ${p.origem}`).includes(q));
      title = `Busca: “${query}”`; desc = `${base.length} ${base.length === 1 ? 'resultado' : 'resultados'}`; trail = [['Busca']];
    } else if (COLLECTIONS[slug]) {
      const c = COLLECTIONS[slug]; base = P.filter(c.f); title = c.t; desc = c.d; trail = [[c.t]];
    } else if (L.categorias.some(c => c.slug === slug)) {
      base = P.filter(p => p.categoria === slug); title = catName(slug); desc = `${base.length} peças em ${catName(slug).toLowerCase()}.`; trail = [['Roupas', '#/loja/roupas'], [title]];
      if (['tenis', 'bones', 'acessorios'].includes(slug)) trail = [[title]];
    } else return viewNotFound();

    F = { base, cats: new Set(), sizes: new Set(), colors: new Set(), linha: new Set(), origem: new Set(), promo: false, min: '', max: '', sort: 'relevancia', shown: L.produtosPorPagina };
    const count = (fn) => base.filter(fn).length;
    const cats = L.categorias.filter(c => base.some(p => p.categoria === c.slug));
    const sizes = SIZE_ORDER.filter(s => base.some(p => p.tamanhos.includes(s)));
    const colors = [...new Map(base.flatMap(p => p.cores).map(c => [c.nome, c])).values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const chipLinks = [['todos', 'Todos'], ['lancamentos', 'Lançamentos'], ...L.categorias.map(c => [c.slug, c.nome]), ['plus-size', 'Plus size'], ['outlet', 'Outlet']];

    return `<div class="container">
      ${crumbs(trail)}
      <div class="cat-head"><div><h1>${esc(title)}</h1><p>${esc(desc)}</p></div></div>
      <nav class="cat-chips" aria-label="Categorias">${chipLinks.map(([s, t]) => `<a class="chip" href="#/loja/${s}" ${s === slug ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
      <div class="shop">
        <aside class="filters" id="filtros" aria-label="Filtros">
          <div class="filters__head"><h2>Filtrar</h2><button class="icon-btn" type="button" data-filters-close aria-label="Fechar filtros">${CLOSE}</button></div>
          <form data-filters>
            ${cats.length > 1 ? `<details class="fgroup" open><summary>Categoria</summary><div class="fgroup__body">${cats.map(c => `<label class="check"><input type="checkbox" name="cats" value="${c.slug}"> ${c.nome}<small>${count(p => p.categoria === c.slug)}</small></label>`).join('')}</div></details>` : ''}
            <details class="fgroup" open><summary>Tamanho</summary><div class="fgroup__body"><div class="sizes-grid">${sizes.map(s => `<label class="size-opt"><input type="checkbox" name="sizes" value="${esc(s)}"><span>${esc(s)}</span></label>`).join('')}</div></div></details>
            <details class="fgroup" open><summary>Cor</summary><div class="fgroup__body"><div class="colors-grid">${colors.map(c => `<label class="color-opt" title="${esc(c.nome)}"><input type="checkbox" name="colors" value="${esc(c.nome)}" aria-label="${esc(c.nome)}"><span style="background:${c.hex}"></span></label>`).join('')}</div></div></details>
            <details class="fgroup" open><summary>Preço</summary><div class="fgroup__body"><div class="price-range"><label><span class="sr-only">Preço mínimo</span><input type="number" name="min" inputmode="numeric" min="0" placeholder="De R$"></label><label><span class="sr-only">Preço máximo</span><input type="number" name="max" inputmode="numeric" min="0" placeholder="Até R$"></label></div>
              <label class="check"><input type="checkbox" name="promo"> Só promoções<small>${count(p => p.precoDe)}</small></label></div></details>
            <details class="fgroup"><summary>Linha</summary><div class="fgroup__body"><label class="check"><input type="checkbox" name="linha" value="adulto"> Adulto<small>${count(p => p.linha === 'adulto')}</small></label><label class="check"><input type="checkbox" name="linha" value="plus-size"> Plus size<small>${count(p => p.linha === 'plus-size')}</small></label></div></details>
            <details class="fgroup"><summary>Origem</summary><div class="fgroup__body"><label class="check"><input type="checkbox" name="origem" value="Importado"> Importado<small>${count(p => p.origem === 'Importado')}</small></label><label class="check"><input type="checkbox" name="origem" value="Nacional"> Nacional<small>${count(p => p.origem === 'Nacional')}</small></label></div></details>
          </form>
          <div class="filters__apply"><button class="btn btn--block" type="button" data-filters-close>Ver <span data-result-count></span> produtos</button></div>
        </aside>
        <div>
          <div class="toolbar">
            <p class="toolbar__count" data-count></p>
            <div class="toolbar__right">
              <button class="btn btn--ghost btn--sm btn-filter" type="button" data-filters-open><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Filtrar</button>
              <label class="select"><span class="sr-only">Ordenar por</span><select data-sort>
                <option value="relevancia">Mais relevantes</option><option value="novos">Lançamentos</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="desconto">Maior desconto</option><option value="az">Nome de A a Z</option>
              </select></label>
            </div>
          </div>
          <div class="active-filters" data-active></div>
          <div data-results></div>
        </div>
      </div>
    </div>`;
  }
  function filtered() {
    let l = F.base.filter(p =>
      (!F.cats.size || F.cats.has(p.categoria)) &&
      (!F.sizes.size || p.tamanhos.some(t => F.sizes.has(t) && !p.esgotados.includes(t))) &&
      (!F.colors.size || p.cores.some(c => F.colors.has(c.nome))) &&
      (!F.linha.size || F.linha.has(p.linha)) &&
      (!F.origem.size || F.origem.has(p.origem)) &&
      (!F.promo || p.precoDe) &&
      (F.min === '' || p.preco >= +F.min) && (F.max === '' || p.preco <= +F.max));
    const s = { menor: (a, b) => a.preco - b.preco, maior: (a, b) => b.preco - a.preco, desconto: (a, b) => off(b) - off(a), az: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'), novos: (a, b) => b.novo - a.novo, relevancia: (a, b) => (b.maisVendido + b.novo + 3 * hasPhoto(b)) - (a.maisVendido + a.novo + 3 * hasPhoto(a)) }[F.sort];
    return [...l].sort(s);
  }
  function renderResults() {
    const list = filtered();
    const shown = list.slice(0, F.shown);
    $('[data-count]').textContent = `${list.length} ${list.length === 1 ? 'produto' : 'produtos'}`;
    const rc = $('[data-result-count]'); if (rc) rc.textContent = list.length;
    const chips = [
      ...[...F.cats].map(v => ['cats', v, catName(v)]), ...[...F.sizes].map(v => ['sizes', v, `Tam. ${v}`]),
      ...[...F.colors].map(v => ['colors', v, v]), ...[...F.linha].map(v => ['linha', v, v === 'plus-size' ? 'Plus size' : 'Adulto']),
      ...[...F.origem].map(v => ['origem', v, v]), ...(F.promo ? [['promo', '1', 'Só promoções']] : []),
      ...(F.min !== '' ? [['min', '', `A partir de ${brl(+F.min)}`]] : []), ...(F.max !== '' ? [['max', '', `Até ${brl(+F.max)}`]] : []),
    ];
    $('[data-active]').innerHTML = chips.length ? chips.map(([k, v, t]) => `<button class="chip is-on" type="button" data-unfilter="${k}" data-value="${esc(v)}">${esc(t)} ${CLOSE}</button>`).join('') + '<button class="chip" type="button" data-unfilter="all">Limpar filtros</button>' : '';
    $('[data-results]').innerHTML = list.length
      ? `<div class="grid">${shown.map(card).join('')}</div>${list.length > F.shown ? `<div class="load-more"><p class="toolbar__count">Mostrando ${shown.length} de ${list.length}</p><div class="load-more__bar"><i style="width:${(shown.length / list.length) * 100}%"></i></div><button class="btn btn--ghost" type="button" data-more>Carregar mais produtos</button></div>` : ''}`
      : `<div class="empty"><h2>Nada por aqui</h2><p>Nenhuma peça combina com esses filtros. Tire algum filtro para ver mais opções.</p><button class="btn" type="button" data-unfilter="all">Limpar filtros</button></div>`;
  }
  function readFilters(form) {
    const fd = new FormData(form);
    for (const k of ['cats', 'sizes', 'colors', 'linha', 'origem']) F[k] = new Set(fd.getAll(k));
    F.promo = fd.has('promo'); F.min = fd.get('min') || ''; F.max = fd.get('max') || '';
    F.shown = L.produtosPorPagina;
    renderResults();
  }

  /* ---------- produto ---------- */
  let PD = null;
  function viewProduct(slug) {
    const p = bySlug(slug);
    if (!p) return viewNotFound();
    const single = p.tamanhos.length === 1;
    PD = { p, cor: 0, tam: single ? p.tamanhos[0] : null, qtd: 1, foto: 0 };
    const inst = installments(p.preco);
    const related = P.filter(x => x.categoria === p.categoria && x.id !== p.id).slice(0, 10);
    const catLink = COLLECTIONS[p.categoria] ? null : `#/loja/${p.categoria}`;
    return `<div class="container">
      ${crumbs([[catName(p.categoria), catLink], [p.nome]])}
      <div class="pdp">
        <div class="gallery ${photosOf(p, 0).length === 1 ? 'gallery--single' : ''}" data-gallery>${galleryHTML(p, 0)}</div>
        <div class="pdp__info">
          <div><p class="pdp__ref">Ref. ${p.sku} · ${p.origem}</p></div>
          <h1 class="pdp__title">${esc(p.nome)}</h1>
          ${tags(p) ? `<div class="pdp__tags">${tags(p)}</div>` : ''}
          <div class="pdp__price">
            <div class="price ${p.precoDe ? 'price--sale' : ''}">${p.precoDe ? `<s>${brl(p.precoDe)}</s>` : ''}<strong>${brl(p.preco)}</strong></div>
            <p class="pdp__pix"><b>${brl(pixPrice(p.preco))}</b> no Pix (${Math.round(L.descontoPix * 100)}% de desconto)</p>
            ${inst ? `<p class="pdp__inst">ou ${inst.k}x de ${brl(inst.v)} sem juros no cartão</p>` : ''}
          </div>
          <div><p class="opt-label"><span>Cor: <b data-color-name>${esc(p.cores[0].nome)}</b></span></p>
            <div class="opt-colors">${p.cores.map((c, i) => `<button type="button" data-color="${i}" style="background:${c.hex}" aria-label="${esc(c.nome)}" aria-pressed="${i === 0}"></button>`).join('')}</div></div>
          <div><p class="opt-label"><span>Tamanho${single ? '' : ': <b data-size-name>escolha um</b>'}</span>${single ? '' : '<button class="link" type="button" data-open-medidas>Guia de medidas</button>'}</p>
            <div class="opt-sizes">${p.tamanhos.map(t => `<button type="button" data-size="${esc(t)}" aria-pressed="${single}" ${p.esgotados.includes(t) ? `disabled aria-label="${esc(t)} esgotado"` : ''}>${esc(t)}</button>`).join('')}</div>
            <p class="opt-error" data-size-error hidden>Escolha um tamanho para continuar.</p></div>
          <div class="buy-row">
            <div class="qty"><button type="button" data-qty="-1" aria-label="Diminuir quantidade">−</button><input type="number" value="1" min="1" max="10" aria-label="Quantidade" data-qty-input><button type="button" data-qty="1" aria-label="Aumentar quantidade">+</button></div>
            <button class="btn btn--block" type="button" data-add>Adicionar ao carrinho</button>
          </div>
          <button class="btn btn--gold btn--block" type="button" data-buy-now>Comprar agora ${ARROW}</button>
          <div class="ship-calc">
            <p class="opt-label"><b>Calcular frete e prazo</b><a class="link" href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener">Não sei meu CEP</a></p>
            <form data-ship-form><label class="sr-only" for="cep-pdp">CEP</label><input id="cep-pdp" inputmode="numeric" placeholder="00000-000" maxlength="9" data-mask="cep" autocomplete="postal-code"><button class="btn btn--sm" type="submit">Calcular</button></form>
            <ul class="ship-list" data-ship-result></ul>
          </div>
          <div class="accordion">
            <details open><summary>Descrição</summary><div class="acc__body"><p>${esc(p.descricao)}</p></div></details>
            <details><summary>Detalhes</summary><div class="acc__body"><dl class="specs"><dt>Composição</dt><dd>${esc(p.composicao)}</dd><dt>Origem</dt><dd>${p.origem}</dd><dt>Linha</dt><dd>${p.linha === 'plus-size' ? 'Plus size' : 'Adulto'}</dd><dt>Tamanhos</dt><dd>${p.tamanhos.join(', ')}</dd><dt>Referência</dt><dd>${p.sku}</dd></dl></div></details>
            <details><summary>Trocas e devoluções</summary><div class="acc__body"><p>Você tem 7 dias após o recebimento para desistir da compra e até 30 dias para trocar de tamanho. <a class="link" href="#/pagina/trocas">Ver a política completa</a></p></div></details>
          </div>
        </div>
      </div>
    </div>
    ${rail('Você também pode gostar', related, catLink)}
    <div class="sticky-buy" data-sticky-buy>${priceBlock(p).split('</div>')[0]}</div><button class="btn" type="button" data-add>Adicionar</button></div>`;
  }
  function pdAdd(goCheckout) {
    const { p } = PD;
    if (!PD.tam) { $('[data-size-error]').hidden = false; $('.opt-sizes').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    addToCart(p.id, p.cores[PD.cor].nome, PD.tam, PD.qtd);
    if (goCheckout) location.hash = '#/checkout'; else openDrawer('carrinho');
  }

  /* ---------- frete (simulação por região do CEP) ---------- */
  function shipping(cep, sub) {
    const d = cep.replace(/\D/g, '');
    if (d.length !== 8) return null;
    const r = +d[0];
    const t = r <= 1 ? [18.9, 29.9, '3 a 5', '1 a 2'] : r <= 3 ? [24.9, 39.9, '4 a 7', '2 a 3'] : r === 7 ? [29.9, 49.9, '6 a 9', '3 a 5'] : r >= 8 ? [27.9, 44.9, '5 a 8', '2 a 4'] : [34.9, 59.9, '7 a 12', '3 a 6'];
    const free = sub >= L.freteGratisAcima;
    const opts = [
      { id: 'pac', nome: 'Econômica (PAC)', prazo: `${t[2]} dias úteis`, valor: free ? 0 : t[0] },
      { id: 'sedex', nome: 'Expressa (SEDEX)', prazo: `${t[3]} dias úteis`, valor: t[1] },
    ];
    if (d.startsWith('122')) opts.unshift({ id: 'retirada', nome: 'Retirar na loja', prazo: `Pronto em 1 dia útil · ${L.cidade}`, valor: 0 });
    return opts;
  }

  /* ---------- carrinho (gaveta) ---------- */
  function renderCart() {
    updateBadges();
    const body = $('[data-cart-body]'), foot = $('[data-cart-foot]');
    $('[data-cart-items]').textContent = cart.length ? `(${cartCount()})` : '';
    if (!cart.length) {
      body.innerHTML = `<div class="empty"><h2>Carrinho vazio</h2><p>Escolha camisetas, tênis e bonés para montar seu pedido.</p><a class="btn" href="#/loja/todos" data-close>Ver produtos</a></div>`;
      foot.innerHTML = ''; return;
    }
    const sub = subtotal();
    const falta = L.freteGratisAcima - sub;
    body.innerHTML = cart.map(i => { const p = byId(i.id); return `
      <div class="line-item">
        <a href="#/produto/${p.slug}" data-close>${media(p, 0, { label: '' }, corIdx(p, i.cor))}</a>
        <div>
          <div class="line-item__top"><div><a class="line-item__name" href="#/produto/${p.slug}" data-close>${esc(p.nome)}</a><p class="line-item__meta">${esc(i.cor)} · Tam. ${esc(i.tam)}</p></div>
            <button class="line-item__remove" type="button" data-remove="${esc(i.key)}" aria-label="Remover ${esc(p.nome)}">${TRASH}</button></div>
          <div class="line-item__bottom"><div class="qty qty--sm"><button type="button" data-line-qty="-1" data-key="${esc(i.key)}" aria-label="Diminuir">−</button><input value="${i.qtd}" readonly aria-label="Quantidade"><button type="button" data-line-qty="1" data-key="${esc(i.key)}" aria-label="Aumentar">+</button></div>
            <span class="line-item__price">${brl(p.preco * i.qtd)}</span></div>
        </div>
      </div>`; }).join('');
    foot.innerHTML = `
      <div class="freebar"><span>${falta > 0 ? `Faltam <b>${brl(falta)}</b> para o frete grátis` : '<b>Você ganhou frete grátis</b> na entrega econômica'}</span><div class="freebar__track"><i style="width:${Math.min(100, (sub / L.freteGratisAcima) * 100)}%"></i></div></div>
      <div class="totals"><div><span>Subtotal</span><span>${brl(sub)}</span></div><div class="totals__pix"><span>No Pix</span><b>${brl(pixPrice(sub))}</b></div></div>
      <a class="btn btn--block" href="#/checkout" data-close>Finalizar compra ${ARROW}</a>
      <button class="btn btn--ghost btn--block" type="button" data-close>Continuar comprando</button>`;
  }

  /* ---------- checkout ---------- */
  let CO = null;
  function viewCheckout() {
    if (!cart.length) return `<div class="container"><div class="empty"><h1>Seu carrinho está vazio</h1><p>Adicione produtos para finalizar a compra.</p><a class="btn" href="#/loja/todos">Ver produtos</a></div></div>`;
    CO = { frete: null, pagamento: 'pix', opts: null };
    const inst = Array.from({ length: L.parcelasSemJuros }, (_, i) => i + 1);
    return `<div class="co-header"><div class="container"><a class="logo" href="#/"><span class="logo__mark" aria-hidden="true">PP</span><span class="logo__name">Outlets</span></a><span class="co-secure"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Compra 100% segura</span></div></div>
    <div class="container">
      <p class="demo-note"><b>Versão de demonstração.</b> O pagamento ainda não está conectado a uma operadora: nenhum valor é cobrado e nenhum dado é enviado.</p>
      <form class="checkout" data-checkout novalidate>
        <div class="co-steps">
          <section class="co-step"><div class="co-step__head"><span class="co-step__num">1</span><h2>Seus dados</h2></div>
            <div class="fields">
              <div class="field"><label for="f-email">E-mail</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
              <div class="field"><label for="f-nome">Nome completo</label><input id="f-nome" name="nome" autocomplete="name" required minlength="5"></div>
              <div class="field field--3"><label for="f-cpf">CPF</label><input id="f-cpf" name="cpf" inputmode="numeric" data-mask="cpf" maxlength="14" required></div>
              <div class="field field--3"><label for="f-tel">Celular</label><input id="f-tel" name="tel" type="tel" inputmode="tel" data-mask="tel" maxlength="15" autocomplete="tel-national" required></div>
            </div></section>
          <section class="co-step"><div class="co-step__head"><span class="co-step__num">2</span><h2>Entrega</h2></div>
            <div class="fields">
              <div class="field field--2"><label for="f-cep">CEP</label><input id="f-cep" name="cep" inputmode="numeric" data-mask="cep" maxlength="9" autocomplete="postal-code" required><span class="field__hint" data-cep-hint></span></div>
              <div class="field field--4"><label for="f-rua">Endereço</label><input id="f-rua" name="rua" autocomplete="address-line1" required></div>
              <div class="field field--2 field--half-m"><label for="f-num">Número</label><input id="f-num" name="numero" required></div>
              <div class="field field--4 field--half-m"><label for="f-comp">Complemento <span class="field__hint">(opcional)</span></label><input id="f-comp" name="complemento" autocomplete="address-line2"></div>
              <div class="field field--2"><label for="f-bairro">Bairro</label><input id="f-bairro" name="bairro" required></div>
              <div class="field field--3 field--half-m"><label for="f-cidade">Cidade</label><input id="f-cidade" name="cidade" autocomplete="address-level2" required></div>
              <div class="field field--1 field--half-m"><label for="f-uf">UF</label><input id="f-uf" name="uf" maxlength="2" autocomplete="address-level1" required></div>
            </div>
            <div class="options" data-ship-options style="margin-top:20px"><p class="field__hint">Digite o CEP para ver as opções de entrega.</p></div>
          </section>
          <section class="co-step"><div class="co-step__head"><span class="co-step__num">3</span><h2>Pagamento</h2></div>
            <div class="options">
              <label class="option"><input type="radio" name="pagamento" value="pix" checked><span><strong>Pix</strong><small>Aprovação na hora · ${Math.round(L.descontoPix * 100)}% de desconto</small></span><span class="option__price is-free" data-pix-total></span></label>
              <label class="option"><input type="radio" name="pagamento" value="cartao"><span><strong>Cartão de crédito</strong><small>Em até ${L.parcelasSemJuros}x sem juros</small></span><span class="option__price">Visa · Master · Elo</span></label>
              <label class="option"><input type="radio" name="pagamento" value="boleto"><span><strong>Boleto bancário</strong><small>Vence em 3 dias úteis · aprovação em até 2 dias úteis</small></span><span class="option__price"></span></label>
            </div>
            <div class="pay-panel" data-card-panel hidden><div class="fields">
              <div class="field"><label for="f-cc">Número do cartão</label><input id="f-cc" name="cc" inputmode="numeric" data-mask="cc" maxlength="19" autocomplete="cc-number"></div>
              <div class="field"><label for="f-ccname">Nome impresso no cartão</label><input id="f-ccname" name="ccnome" autocomplete="cc-name"></div>
              <div class="field field--3 field--half-m"><label for="f-ccexp">Validade</label><input id="f-ccexp" name="ccval" inputmode="numeric" placeholder="MM/AA" data-mask="exp" maxlength="5" autocomplete="cc-exp"></div>
              <div class="field field--3 field--half-m"><label for="f-cvv">CVV</label><input id="f-cvv" name="cvv" inputmode="numeric" maxlength="4" autocomplete="cc-csc"></div>
              <div class="field"><label for="f-parc">Parcelas</label><select id="f-parc" name="parcelas" data-parcelas>${inst.map(k => `<option value="${k}">${k}x</option>`).join('')}</select></div>
            </div></div>
          </section>
        </div>
        <aside class="summary" aria-label="Resumo do pedido">
          <h2>Resumo do pedido</h2>
          <div class="summary__items">${cart.map(i => { const p = byId(i.id); return `<div class="summary__item">${media(p, 0, { label: '' }, corIdx(p, i.cor))}<span>${esc(p.nome)}<small>${esc(i.cor)} · Tam. ${esc(i.tam)} · ${i.qtd} un.</small></span><b>${brl(p.preco * i.qtd)}</b></div>`; }).join('')}</div>
          <div class="totals" data-co-totals></div>
          <button class="btn btn--gold btn--block" type="submit">Finalizar pedido ${ARROW}</button>
          <p class="field__hint">Ao finalizar, você concorda com a <a class="link" href="#/pagina/privacidade">política de privacidade</a> e as <a class="link" href="#/pagina/trocas">regras de troca</a>.</p>
        </aside>
      </form>
    </div>`;
  }
  function coTotals() {
    const sub = subtotal();
    const frete = CO.frete ? CO.frete.valor : 0;
    const desc = CO.pagamento === 'pix' ? round2(sub * L.descontoPix) : 0;
    const total = round2(sub + frete - desc);
    const el = $('[data-co-totals]');
    if (el) el.innerHTML = `<div><span>Subtotal</span><span>${brl(sub)}</span></div>
      <div><span>Frete</span><span>${CO.frete ? (frete ? brl(frete) : 'Grátis') : 'Informe o CEP'}</span></div>
      ${desc ? `<div class="totals__pix"><span>Desconto Pix</span><span>− ${brl(desc)}</span></div>` : ''}
      <div class="totals__grand"><span>Total</span><b>${brl(total)}</b></div>`;
    const pt = $('[data-pix-total]'); if (pt) pt.textContent = brl(round2(sub * (1 - L.descontoPix) + frete));
    const sel = $('[data-parcelas]');
    if (sel) { const v = sel.value; sel.innerHTML = Array.from({ length: L.parcelasSemJuros }, (_, i) => i + 1).filter(k => k === 1 || total / k >= L.parcelaMinima).map(k => `<option value="${k}">${k}x de ${brl(total / k)} sem juros</option>`).join(''); if ([...sel.options].some(o => o.value === v)) sel.value = v; }
    return { sub, frete, desc, total };
  }
  function renderShipOptions(cep) {
    const box = $('[data-ship-options]');
    const opts = shipping(cep, subtotal());
    CO.opts = opts;
    if (!opts) { CO.frete = null; box.innerHTML = '<p class="field__hint">Digite o CEP para ver as opções de entrega.</p>'; coTotals(); return; }
    CO.frete = opts[0];
    box.innerHTML = opts.map((o, i) => `<label class="option"><input type="radio" name="frete" value="${o.id}" ${i === 0 ? 'checked' : ''}><span><strong>${o.nome}</strong><small>${o.prazo}</small></span><span class="option__price ${o.valor ? '' : 'is-free'}">${o.valor ? brl(o.valor) : 'Grátis'}</span></label>`).join('');
    coTotals();
  }
  async function lookupCep(cep) {
    const d = cep.replace(/\D/g, ''); const hint = $('[data-cep-hint]');
    if (d.length !== 8) return;
    renderShipOptions(cep);
    hint.textContent = 'Buscando endereço…';
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      if (j.erro) { hint.textContent = 'CEP não encontrado. Preencha o endereço.'; return; }
      const set = (n, v) => { const i = $(`[name="${n}"]`); if (i && v && !i.value) i.value = v; };
      set('rua', j.logradouro); set('bairro', j.bairro); set('cidade', j.localidade); set('uf', j.uf);
      hint.textContent = ''; $('[name="numero"]').focus();
    } catch { hint.textContent = 'Preencha o endereço abaixo.'; }
  }
  const validCPF = v => { const c = v.replace(/\D/g, ''); if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false; for (const t of [9, 10]) { let s = 0; for (let i = 0; i < t; i++) s += +c[i] * (t + 1 - i); if (((s * 10) % 11) % 10 !== +c[t]) return false; } return true; };
  const luhn = v => { const d = v.replace(/\D/g, ''); if (d.length < 13) return false; let s = 0; for (let i = 0; i < d.length; i++) { let n = +d[d.length - 1 - i]; if (i % 2) { n *= 2; if (n > 9) n -= 9; } s += n; } return s % 10 === 0; };
  function submitCheckout(form) {
    $$('.field', form).forEach(f => { f.classList.remove('is-invalid'); f.querySelector('.field__error')?.remove(); });
    const err = (name, msg) => { const i = form.elements[name]; const f = i.closest('.field'); f.classList.add('is-invalid'); f.insertAdjacentHTML('beforeend', `<span class="field__error">${msg}</span>`); return i; };
    const v = n => (form.elements[n]?.value || '').trim();
    const bad = [];
    if (!/^\S+@\S+\.\S+$/.test(v('email'))) bad.push(err('email', 'Digite um e-mail válido, como nome@email.com.'));
    if (v('nome').split(/\s+/).length < 2) bad.push(err('nome', 'Digite nome e sobrenome.'));
    if (!validCPF(v('cpf'))) bad.push(err('cpf', 'CPF inválido. Confira os 11 números.'));
    if (v('tel').replace(/\D/g, '').length < 10) bad.push(err('tel', 'Digite o celular com DDD.'));
    if (v('cep').replace(/\D/g, '').length !== 8) bad.push(err('cep', 'Digite os 8 números do CEP.'));
    for (const [n, m] of [['rua', 'Digite o endereço.'], ['numero', 'Digite o número (ou S/N).'], ['bairro', 'Digite o bairro.'], ['cidade', 'Digite a cidade.']]) if (!v(n)) bad.push(err(n, m));
    if (!/^[A-Za-z]{2}$/.test(v('uf'))) bad.push(err('uf', 'UF com 2 letras.'));
    if (CO.pagamento === 'cartao') {
      if (!luhn(v('cc'))) bad.push(err('cc', 'Número de cartão inválido.'));
      if (v('ccnome').length < 4) bad.push(err('ccnome', 'Digite o nome como está no cartão.'));
      const m = v('ccval').match(/^(\d{2})\/(\d{2})$/); const now = new Date();
      if (!m || +m[1] < 1 || +m[1] > 12 || new Date(2000 + +m[2], +m[1]) <= now) bad.push(err('ccval', 'Validade inválida (MM/AA).'));
      if (!/^\d{3,4}$/.test(v('cvv'))) bad.push(err('cvv', 'CVV com 3 ou 4 números.'));
    }
    if (bad.length) { bad[0].focus(); bad[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const t = coTotals();
    const pedidos = store.get('pedidos', []);
    const numero = String(10230 + pedidos.length + Math.floor(Math.random() * 9));
    const pedido = {
      numero, data: new Date().toISOString(), pagamento: CO.pagamento, parcelas: CO.pagamento === 'cartao' ? +v('parcelas') : 1,
      frete: CO.frete, cliente: { nome: v('nome'), email: v('email') },
      endereco: `${v('rua')}, ${v('numero')}${v('complemento') ? ' – ' + v('complemento') : ''} · ${v('bairro')} · ${v('cidade')}/${v('uf').toUpperCase()} · CEP ${v('cep')}`,
      itens: cart.map(i => ({ ...i, nome: byId(i.id).nome, preco: byId(i.id).preco })), sub: t.sub, desc: t.desc, total: t.total,
    };
    pedidos.unshift(pedido); store.set('pedidos', pedidos);
    cart = []; saveCart();
    location.hash = `#/pedido/${numero}`;
  }
  function viewOrder(num) {
    const o = store.get('pedidos', []).find(x => x.numero === num);
    if (!o) return viewNotFound();
    const pix = `00020126580014BR.GOV.BCB.PIX0136ppoutlets-demo-${o.numero}5204000053039865802BR5910PP OUTLETS6015SAO JOSE CAMPOS62070503***6304DEMO`;
    const pay = {
      pix: `<h2>Pague com Pix</h2><div class="pix-box">${ph('acessorios', { label: 'QR Code' })}<div><p>Abra o app do seu banco, escolha <b>Pix › Ler QR Code</b> ou use o código abaixo. O pedido é confirmado assim que o pagamento cair.</p><div class="pix-code"><input value="${pix}" readonly aria-label="Código Pix copia e cola"><button class="btn btn--sm" type="button" data-copy>Copiar</button></div></div></div>`,
      cartao: `<h2>Pagamento aprovado</h2><p>Cartão de crédito em ${o.parcelas}x de ${brl(o.total / o.parcelas)} sem juros. Você vai receber a confirmação por e-mail.</p>`,
      boleto: `<h2>Boleto gerado</h2><p>O boleto vence em 3 dias úteis. O pedido é enviado depois da compensação, em até 2 dias úteis.</p><div class="pix-code"><input value="34191.79001 01043.510047 91020.150008 1 ${o.numero}0000" readonly aria-label="Linha digitável"><button class="btn btn--sm" type="button" data-copy>Copiar</button></div>`,
    }[o.pagamento];
    return `<div class="container">
      <div class="done"><span class="done__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg></span>
        <h1>Pedido nº ${o.numero} recebido</h1><p>Obrigado pela compra, ${esc(o.cliente.nome.split(' ')[0])}. Enviamos os detalhes para ${esc(o.cliente.email)}.</p>
        <p class="demo-note" style="margin:0">Demonstração: os códigos de pagamento abaixo são de exemplo e não podem ser pagos.</p></div>
      <div class="order-box">
        <div>${pay}</div>
        <div><h2>Resumo</h2>
          ${o.itens.map(i => `<div class="summary__item" style="grid-template-columns:1fr auto"><span>${esc(i.nome)}<small>${esc(i.cor)} · Tam. ${esc(i.tam)} · ${i.qtd} un.</small></span><b>${brl(i.preco * i.qtd)}</b></div>`).join('')}
          <div class="totals"><div><span>Subtotal</span><span>${brl(o.sub)}</span></div><div><span>Frete (${esc(o.frete?.nome || '')})</span><span>${o.frete?.valor ? brl(o.frete.valor) : 'Grátis'}</span></div>${o.desc ? `<div class="totals__pix"><span>Desconto Pix</span><span>− ${brl(o.desc)}</span></div>` : ''}<div class="totals__grand"><span>Total</span><b>${brl(o.total)}</b></div></div>
          <p class="field__hint"><b>Entrega:</b> ${esc(o.endereco)}<br>${esc(o.frete?.prazo || '')}</p>
          <a class="btn btn--ghost" href="#/loja/todos">Continuar comprando</a></div>
      </div></div>`;
  }
  function viewOrders() {
    const os = store.get('pedidos', []);
    return `<div class="container page" style="max-width:900px">${crumbs([['Meus pedidos']])}<h1>Meus pedidos</h1>
      ${os.length ? os.map(o => `<a class="option" style="grid-template-columns:1fr auto;margin-bottom:10px" href="#/pedido/${o.numero}"><span><strong>Pedido nº ${o.numero}</strong><small>${new Date(o.data).toLocaleDateString('pt-BR')} · ${o.itens.reduce((s, i) => s + i.qtd, 0)} itens · ${{ pix: 'Pix', cartao: 'Cartão', boleto: 'Boleto' }[o.pagamento]}</small></span><span class="option__price">${brl(o.total)}</span></a>`).join('')
        : '<p>Você ainda não fez nenhum pedido neste navegador.</p><p><a class="btn" href="#/loja/todos">Ver produtos</a></p>'}</div>`;
  }

  /* ---------- favoritos, páginas, 404 ---------- */
  function viewFavs() {
    const l = P.filter(p => favs.has(p.id));
    return `<div class="container">${crumbs([['Favoritos']])}<div class="cat-head"><div><h1>Favoritos</h1><p>${l.length} ${l.length === 1 ? 'peça salva' : 'peças salvas'}</p></div></div>
      ${l.length ? `<div class="grid" style="padding-block:28px 72px">${l.map(card).join('')}</div>` : `<div class="empty"><h2>Nenhum favorito ainda</h2><p>Toque no coração das peças que você gostou para salvar aqui.</p><a class="btn" href="#/loja/todos">Ver produtos</a></div>`}</div>`;
  }
  function measuresHTML() {
    const t = (cap, head, rows) => `<div class="table-wrap"><table class="measures"><caption>${cap}</caption><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return t('Camisetas, camisas e polos', ['Tamanho', 'Tórax (cm)', 'Comprimento (cm)'], [['P', '96 a 100', '70'], ['M', '100 a 106', '72'], ['G', '106 a 112', '74'], ['GG', '112 a 118', '76']])
      + t('Plus size', ['Tamanho', 'Tórax (cm)', 'Comprimento (cm)'], [['G1', '118 a 124', '78'], ['G2', '124 a 130', '80'], ['G3', '130 a 136', '82'], ['G4', '136 a 142', '84']])
      + t('Calças e bermudas', ['Número', 'Cintura (cm)', 'Quadril (cm)'], [['38', '76 a 80', '94'], ['40', '80 a 84', '98'], ['42', '84 a 88', '102'], ['44', '88 a 92', '106'], ['46', '92 a 96', '110'], ['48', '96 a 100', '114'], ['50', '100 a 104', '118'], ['52', '104 a 108', '122'], ['54', '108 a 112', '126']])
      + t('Tênis', ['Número', 'Comprimento do pé (cm)'], [['38', '24,5'], ['39', '25,2'], ['40', '26,0'], ['41', '26,7'], ['42', '27,3'], ['43', '28,0'], ['44', '28,7']])
      + '<p class="field__hint">Medidas aproximadas. Em caso de dúvida entre dois tamanhos, escolha o maior.</p>';
  }
  const PAGES = {
    sobre: ['Sobre a PP Outlets', `<p>A PP Outlets é uma loja de moda masculina adulto e plus size com peças importadas e nacionais: camisetas, camisas, polos, camisas de time, moletons, bermudas, calças, tênis, bonés e acessórios.</p><p>Temos loja física em ${esc(L.cidade)} e enviamos para todo o Brasil. Atendimento: ${esc(L.horario)}, também pelo direct do Instagram ${esc(L.instagramUsuario)}.</p>`],
    trocas: ['Trocas e devoluções', '<h2>Desistência da compra</h2><p>Pelo Código de Defesa do Consumidor, você pode desistir da compra em até 7 dias corridos após o recebimento. O valor é devolvido na mesma forma de pagamento.</p><h2>Troca de tamanho ou cor</h2><p>Você pode trocar em até 30 dias após o recebimento. A peça deve estar sem uso, com etiqueta e na embalagem original. A primeira troca não tem custo.</p><h2>Como pedir</h2><ul><li>Envie o número do pedido pelo direct do Instagram.</li><li>Você recebe o código de postagem para enviar a peça pelos Correios.</li><li>Ou traga a peça direto na loja física.</li></ul>'],
    entrega: ['Prazos e entrega', `<p>Enviamos para todo o Brasil pelos Correios. O prazo começa a contar após a confirmação do pagamento e aparece no carrinho assim que você informa o CEP.</p><ul><li>Pix e cartão: pedido separado em até 1 dia útil.</li><li>Boleto: pedido separado após a compensação, em até 2 dias úteis.</li><li>Frete grátis na entrega econômica para compras acima de ${brl(L.freteGratisAcima)}.</li><li>Moradores de ${esc(L.cidade)} podem retirar o pedido na loja sem custo.</li></ul>`],
    privacidade: ['Privacidade', '<p>Usamos seus dados apenas para processar o pedido, emitir a nota fiscal, fazer a entrega e falar com você sobre a compra, conforme a Lei Geral de Proteção de Dados (LGPD).</p><p>Os dados do cartão são processados diretamente pela operadora de pagamento e não ficam guardados na loja. Para pedir a exclusão dos seus dados, fale com a gente pelo direct do Instagram.</p>'],
    medidas: ['Guia de medidas', ''],
  };
  function viewPage(name) {
    const pg = PAGES[name]; if (!pg) return viewNotFound();
    return `<div class="container page">${crumbs([[pg[0]]])}<h1>${pg[0]}</h1>${name === 'medidas' ? `<div style="display:grid;gap:24px">${measuresHTML()}</div>` : pg[1]}</div>`;
  }
  function viewNotFound() {
    return `<div class="container"><div class="empty"><h1>Página não encontrada</h1><p>O endereço pode ter mudado. Veja os produtos ou volte para a página inicial.</p><a class="btn" href="#/loja/todos">Ver produtos</a></div></div>`;
  }

  /* ---------- roteador ---------- */
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const [name, ...rest] = h.split('/');
    return { name: name || 'home', arg: rest.join('/') };
  }
  let heroTimer = null;
  function render() {
    const { name, arg } = route();
    clearInterval(heroTimer);
    document.body.classList.toggle('is-checkout', name === 'checkout');
    const views = { home: viewHome, loja: () => viewListing(arg || 'todos'), busca: () => viewListing(null, arg), produto: () => viewProduct(arg), favoritos: viewFavs, checkout: viewCheckout, pedido: () => viewOrder(arg), pedidos: viewOrders, pagina: () => viewPage(arg) };
    main.innerHTML = (views[name] || viewNotFound)();
    const titles = { home: 'Moda masculina, plus size e tênis', loja: $('.cat-head h1')?.textContent, busca: 'Busca', produto: PD?.p?.nome, favoritos: 'Favoritos', checkout: 'Finalizar compra', pedido: 'Pedido recebido', pedidos: 'Meus pedidos', pagina: $('.page h1')?.textContent };
    document.title = `${titles[name] || 'Página não encontrada'} | PP Outlets`;
    $$('.nav__list > li > a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === location.hash ? 'page' : 'false'));
    if (name === 'loja' || name === 'busca') { if ($('[data-results]')) renderResults(); }
    if (name === 'home') startHero();
    if (name === 'checkout' && cart.length) coTotals();
    initRails();
    window.scrollTo(0, 0);
    if (name === 'produto') observeSticky();
  }

  /* ---------- banner ---------- */
  function heroGo(i) {
    const slides = $$('.hero__slide'); if (!slides.length) return;
    const n = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle('is-active', k === n); s.setAttribute('aria-hidden', k !== n); s.querySelectorAll('a').forEach(a => a.tabIndex = k === n ? 0 : -1); });
    $$('[data-hero-go]').forEach((d, k) => d.setAttribute('aria-current', k === n));
  }
  const heroIndex = () => $$('.hero__slide').findIndex(s => s.classList.contains('is-active'));
  function startHero() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    clearInterval(heroTimer); heroTimer = setInterval(() => heroGo(heroIndex() + 1), 6000);
    const h = $('.hero'); h.addEventListener('mouseenter', () => clearInterval(heroTimer)); h.addEventListener('mouseleave', startHero); h.addEventListener('focusin', () => clearInterval(heroTimer));
  }

  /* ---------- vitrines ---------- */
  function initRails() {
    $$('.rail').forEach(r => {
      const t = $('.rail__track', r), prev = $('.rail__btn--prev', r), next = $('.rail__btn--next', r);
      const upd = () => { prev.disabled = t.scrollLeft < 8; next.disabled = t.scrollLeft + t.clientWidth > t.scrollWidth - 8; };
      t.addEventListener('scroll', upd, { passive: true }); upd();
    });
  }
  function observeSticky() {
    const bar = $('[data-sticky-buy]'), btn = $('.pdp [data-add]');
    if (!bar || !btn || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([e]) => bar.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(btn);
  }

  /* ---------- gavetas e toast ---------- */
  let lastFocus = null;
  function openDrawer(id) {
    const d = document.getElementById(id); if (!d) return;
    lastFocus = document.activeElement;
    $$('.drawer.is-open').forEach(x => closeDrawer(x, false));
    d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false');
    $('[data-overlay]').hidden = false; document.body.style.overflow = 'hidden';
    $$(`[data-open="${id}"]`).forEach(b => b.setAttribute('aria-expanded', 'true'));
    setTimeout(() => d.querySelector('button, a')?.focus(), 50);
  }
  function closeDrawer(d = $('.drawer.is-open'), restore = true) {
    if (!d) return;
    d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true');
    $$(`[data-open="${d.id}"]`).forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (!$('.drawer.is-open') && !$('.filters.is-open')) { $('[data-overlay]').hidden = true; document.body.style.overflow = ''; }
    if (restore) lastFocus?.focus?.();
  }
  let toastTimer;
  function toast(html) { const t = $('.toast'); t.innerHTML = html; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 3200); }

  /* ---------- máscaras ---------- */
  const MASK = {
    cep: v => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'),
    cpf: v => v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
    tel: v => v.replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})$/, '$1-$2'),
    cc: v => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '),
    exp: v => v.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2'),
  };

  /* ---------- busca com sugestões ---------- */
  const searchForm = $('.search'), searchInput = $('#busca'), suggest = $('.search__suggest');
  function showSuggest() {
    const q = norm(searchInput.value).trim();
    if (q.length < 2) { suggest.hidden = true; return; }
    const hits = P.filter(p => norm(`${p.nome} ${catName(p.categoria)}`).includes(q));
    suggest.innerHTML = hits.length ? hits.slice(0, 5).map(p => `<a href="#/produto/${p.slug}">${media(p, 0, { label: '' })}<span>${esc(p.nome)}<small>${brl(p.preco)}</small></span></a>`).join('') + `<a class="search__all" href="#/busca/${encodeURIComponent(searchInput.value.trim())}">Ver os ${hits.length} resultados</a>`
      : `<p style="padding:14px">Nenhum produto para “${esc(searchInput.value)}”.</p>`;
    suggest.hidden = false;
  }
  searchInput.addEventListener('input', showSuggest);
  searchInput.addEventListener('focus', showSuggest);
  searchForm.addEventListener('submit', e => { e.preventDefault(); const q = searchInput.value.trim(); if (q) { location.hash = `#/busca/${encodeURIComponent(q)}`; suggest.hidden = true; searchInput.blur(); searchForm.classList.remove('is-open'); } });
  document.addEventListener('click', e => { if (!searchForm.contains(e.target) && !e.target.closest('[data-toggle-search]')) suggest.hidden = true; });

  /* ---------- eventos ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('button, a'); if (!t) return;
    const d = t.dataset;
    if ('fav' in d) { e.preventDefault(); toggleFav(d.id); return; }
    if (d.quick) { const p = byId(d.quick); addToCart(p.id, p.cores[0].nome, d.size); openDrawer('carrinho'); return; }
    if (d.open) { openDrawer(d.open); return; }
    if ('close' in d) { closeDrawer($('.drawer.is-open'), t.tagName === 'BUTTON'); return; }
    if ('toggleSearch' in d) { searchForm.classList.toggle('is-open'); if (searchForm.classList.contains('is-open')) searchInput.focus(); return; }
    if (d.rail) { const tr = t.parentElement.querySelector('.rail__track'); tr.scrollBy({ left: +d.rail * tr.clientWidth * 0.9, behavior: 'smooth' }); return; }
    if (d.hero) { heroGo(heroIndex() + +d.hero); clearInterval(heroTimer); return; }
    if (d.heroGo) { heroGo(+d.heroGo); clearInterval(heroTimer); return; }
    if (d.remove) { cart = cart.filter(i => i.key !== d.remove); saveCart(); return; }
    if (d.lineQty) { const it = cart.find(i => i.key === d.key); it.qtd = Math.max(1, Math.min(10, it.qtd + +d.lineQty)); saveCart(); return; }
    if ('more' in d) { F.shown += L.produtosPorPagina; renderResults(); return; }
    if (d.unfilter) {
      const form = $('[data-filters]');
      if (d.unfilter === 'all') form.reset(); else if (['min', 'max'].includes(d.unfilter)) form.elements[d.unfilter].value = ''; else if (d.unfilter === 'promo') form.elements.promo.checked = false;
      else $$(`input[name="${d.unfilter}"]`, form).forEach(i => { if (i.value === d.value) i.checked = false; });
      readFilters(form); return;
    }
    if ('filtersOpen' in d) { $('.filters').classList.add('is-open'); $('[data-overlay]').hidden = false; document.body.style.overflow = 'hidden'; return; }
    if ('filtersClose' in d) { $('.filters').classList.remove('is-open'); if (!$('.drawer.is-open')) { $('[data-overlay]').hidden = true; document.body.style.overflow = ''; } return; }
    if (d.thumb && PD) { PD.foto = +d.thumb; const n = photosOf(PD.p, PD.cor).length; $('[data-main]').innerHTML = media(PD.p, PD.foto, { label: n ? '' : `Foto ${PD.foto + 1} de 4` }, PD.cor); $$('[data-thumb]').forEach(b => b.setAttribute('aria-current', b === t)); return; }
    if (d.color && PD) {
      const changed = photosOf(PD.p, +d.color) !== photosOf(PD.p, PD.cor);
      PD.cor = +d.color; PD.foto = 0;
      $$('[data-color]').forEach(b => b.setAttribute('aria-pressed', b === t)); $('[data-color-name]').textContent = PD.p.cores[PD.cor].nome;
      if (changed) { const g = $('[data-gallery]'); g.innerHTML = galleryHTML(PD.p, PD.cor); g.classList.toggle('gallery--single', photosOf(PD.p, PD.cor).length === 1); }
      return;
    }
    if (d.size && PD && t.closest('.opt-sizes')) { PD.tam = d.size; $$('.opt-sizes [data-size]').forEach(b => b.setAttribute('aria-pressed', b === t)); const n = $('[data-size-name]'); if (n) n.textContent = d.size; $('[data-size-error]').hidden = true; return; }
    if (d.qty && PD) { const i = $('[data-qty-input]'); PD.qtd = Math.max(1, Math.min(10, PD.qtd + +d.qty)); i.value = PD.qtd; return; }
    if ('add' in d && PD) { pdAdd(false); return; }
    if ('buyNow' in d && PD) { pdAdd(true); return; }
    if ('openMedidas' in d) { $('[data-medidas]').innerHTML = measuresHTML(); $('#medidas').showModal(); return; }
    if ('closeDialog' in d) { t.closest('dialog').close(); return; }
    if ('copy' in d) { const inp = t.previousElementSibling; navigator.clipboard?.writeText(inp.value).then(() => toast('Código copiado.'), () => { inp.select(); }); return; }
  });
  $('[data-overlay]').addEventListener('click', () => { closeDrawer(); $('.filters')?.classList.remove('is-open'); $('[data-overlay]').hidden = true; document.body.style.overflow = ''; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); suggest.hidden = true; } });
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.mask) el.value = MASK[el.dataset.mask](el.value);
    const fld = el.closest('.field.is-invalid'); if (fld) { fld.classList.remove('is-invalid'); fld.querySelector('.field__error')?.remove(); }
    if (el.closest('[data-filters]') && el.type === 'number') { clearTimeout(el._t); el._t = setTimeout(() => readFilters(el.form), 400); }
    if (el.matches('[data-qty-input]') && PD) PD.qtd = Math.max(1, Math.min(10, +el.value || 1));
    if (el.name === 'cep' && el.closest('[data-checkout]') && el.value.replace(/\D/g, '').length === 8) lookupCep(el.value);
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.closest('[data-filters]') && el.type !== 'number') readFilters(el.form);
    if (el.matches('[data-sort]')) { F.sort = el.value; F.shown = L.produtosPorPagina; renderResults(); }
    if (el.name === 'frete' && CO) { CO.frete = CO.opts.find(o => o.id === el.value); coTotals(); }
    if (el.name === 'pagamento' && CO) { CO.pagamento = el.value; $('[data-card-panel]').hidden = el.value !== 'cartao'; coTotals(); }
  });
  document.addEventListener('submit', e => {
    const f = e.target;
    if (f.matches('[data-checkout]')) { e.preventDefault(); submitCheckout(f); }
    if (f.matches('[data-ship-form]')) {
      e.preventDefault();
      const opts = shipping(f.querySelector('input').value, PD ? PD.p.preco * PD.qtd : 0);
      $('[data-ship-result]').innerHTML = opts ? opts.map(o => `<li><span><b>${o.nome}</b> · ${o.prazo}</span><span>${o.valor ? brl(o.valor) : 'Grátis'}</span></li>`).join('') + `<li><small>Frete grátis na entrega econômica acima de ${brl(L.freteGratisAcima)}.</small></li>` : '<li>Digite um CEP com 8 números.</li>';
    }
    if (f.matches('[data-news]')) { e.preventDefault(); const i = f.querySelector('input'); if (!/^\S+@\S+\.\S+$/.test(i.value)) { toast('Digite um e-mail válido, como nome@email.com.'); i.focus(); return; } store.set('newsletter', i.value); f.reset(); toast('Pronto! Você vai receber as novidades da PP Outlets.'); }
  });
  $('#medidas').addEventListener('click', e => { if (e.target.id === 'medidas') e.target.close(); });

  /* ---------- textos vindos da configuração ---------- */
  const CFG = { pix: `${Math.round(L.descontoPix * 100)}%`, frete: brl(L.freteGratisAcima), parcelas: `${L.parcelasSemJuros}x`, cidade: L.cidade, horario: L.horario, instagramUsuario: L.instagramUsuario };
  $$('[data-cfg]').forEach(el => { el.textContent = CFG[el.dataset.cfg] ?? ''; });
  $$('.mega__card-text').forEach(el => { el.textContent = `Peças com até ${maxOff}% off`; });
  $$('.mega__card .ph, [data-glyph]').forEach(el => { if (el.dataset.glyph) el.outerHTML = ph(el.dataset.glyph, { label: 'Foto', cls: 'ph--wide' }); });

  window.addEventListener('hashchange', () => { closeDrawer(undefined, false); render(); });
  renderCart();
  render();
})();
