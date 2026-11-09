/* PP Outlets — painel do gestor.
   Produtos (cadastrar, editar, esconder, excluir, fotos por cor, tamanhos e estoque) e promoções
   (desconto com prazo; "anunciar no site" faz a loja mostrar o pop-up e o slide no banner sozinha).
   Rotas: #/produtos  #/produto/novo  #/produto/<id>  #/promocoes  #/ajuda */
(() => {
  'use strict';
  const D = window.PPData;
  const A = D.admin;
  const L = window.LOJA;
  const app = document.getElementById('app');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const brl = n => (+n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const round2 = n => Math.round(n * 100) / 100;
  const catName = s => (L.categorias.find(c => c.slug === s) || {}).nome || s;
  const clone = o => JSON.parse(JSON.stringify(o));

  const I = {
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/></svg>',
    tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5v.01"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    photo: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/></svg>',
    mega: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h3l6 4V6L6 10zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg>',
    stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>',
    ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    shirt: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 8 14 12 6 22l7 6 5-4v32h28V24l5 4 7-6-8-10-8-4c-2 4-6 6-10 6s-8-2-10-6z"/></svg>',
  };

  let session = null;
  let produtos = [];
  let promocoes = [];

  /* ---------- utilidades ---------- */
  let toastT;
  function toast(msg, erro = false) {
    const t = $('.toast'); t.textContent = msg; t.classList.toggle('is-error', erro); t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), erro ? 6000 : 3000);
  }
  const fotoDe = p => { const c = (p.cores || []).find(c => c.fotos && c.fotos.length); return c ? c.fotos[0] : (p.fotos || [])[0]; };
  const thumb = p => { const f = fotoDe(p); return f ? `<span class="thumb" style="background-image:url('${esc(D.foto(f))}')"></span>` : `<span class="thumb">${I.shirt}</span>`; };
  const estoqueTotal = p => p.tamanhos.reduce((s, t) => s + (+((p.estoque || {})[t] ?? 0) || 0), 0);
  const promoDe = id => promocoes.filter(pr => pr.produtoId === id && D.promoAtiva(pr)).sort((a, b) => b.desconto - a.desconto)[0];
  const precoFinal = (p, pr) => (pr ? D.precoComDesconto(+p.preco, +pr.desconto) : p.preco);
  const toLocalInput = iso => { const d = new Date(iso); const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`; };
  const fmtData = iso => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  function fimTexto(fim) {
    if (!fim) return 'Por tempo limitado';
    const f = new Date(fim), d = Math.floor((f - new Date()) / 864e5);
    return `Até ${f.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}${d >= 1 ? ` · faltam ${d} ${d === 1 ? 'dia' : 'dias'}` : ''}`;
  }
  async function busy(btn, fn) {
    const label = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Salvando…'; }
    try { return await fn(); }
    catch (e) { toast(e.message || String(e), true); throw e; }
    finally { if (btn) { btn.disabled = false; btn.innerHTML = label; } }
  }
  async function reload() { [produtos, promocoes] = await Promise.all([A.listProdutos(), A.listPromocoes()]); }

  /* ---------- confirmação ---------- */
  function confirmar({ titulo, texto, ok = 'Confirmar', perigo = false }) {
    return new Promise(resolve => {
      const d = document.createElement('dialog');
      d.className = 'modal modal--sm';
      d.innerHTML = `<div class="modal__head"><h2>${esc(titulo)}</h2></div><div class="modal__body"><p>${texto}</p></div>
        <div class="modal__foot"><button class="btn btn--ghost" type="button" value="nao">Cancelar</button><button class="btn ${perigo ? 'btn--danger' : ''}" type="button" value="sim">${esc(ok)}</button></div>`;
      document.body.appendChild(d);
      d.addEventListener('click', e => { const b = e.target.closest('button[value]'); if (b) d.close(b.value); else if (e.target === d) d.close('nao'); });
      d.addEventListener('close', () => { resolve(d.returnValue === 'sim'); d.remove(); });
      d.showModal();
    });
  }

  /* ---------- foto: ajusta para 4:5 (1200x1500) e comprime ---------- */
  async function prepararFoto(file) {
    if (!/^image\//.test(file.type)) throw new Error(`"${file.name}" não é uma imagem.`);
    const img = await createImageBitmap(file);
    const W = 1200, H = 1500;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const r = img.width / img.height;
    if (r <= W / H) {             // mais alta: corta em cima e embaixo
      const h = img.width * H / W; ctx.drawImage(img, 0, (img.height - h) / 2, img.width, h, 0, 0, W, H);
    } else {                      // mais larga: zoom no centro, corta os lados
      const w = img.height * W / H; ctx.drawImage(img, (img.width - w) / 2, 0, w, img.height, 0, 0, W, H);
    }
    const blob = await new Promise(ok => c.toBlob(ok, 'image/webp', 0.82));
    if (blob && blob.type === 'image/webp') return blob;
    return await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.86));
  }

  /* ---------- login ---------- */
  function viewLogin(erro = '') {
    app.innerHTML = `<main class="login"><form class="login__card" data-login novalidate>
      <span class="brand"><span class="brand__mark">PP</span><span><span class="brand__name">Outlets</span><small>Painel do gestor</small></span></span>
      <h1>Entrar</h1>
      ${D.online ? '' : '<p class="mode-note"><b>Modo demonstração.</b> Qualquer e-mail e senha entram, e as alterações ficam só neste navegador. Conecte o Supabase para valer para todos.</p>'}
      <label class="field"><span>E-mail</span><input name="email" type="email" autocomplete="username" required></label>
      <label class="field"><span>Senha</span><input name="senha" type="password" autocomplete="current-password" required></label>
      ${erro ? `<p class="field__error" role="alert">${esc(erro)}</p>` : ''}
      <button class="btn btn--gold btn--block" type="submit">Entrar</button>
      <a class="muted" href="../" style="font-size:13px">Voltar para a loja</a>
    </form></main>`;
    $('[name=email]').focus();
  }

  /* ---------- estrutura ---------- */
  const NAV = [['produtos', 'Produtos', I.box], ['promocoes', 'Promoções', I.tag], ['ajuda', 'Como funciona', I.help]];
  function shell(rota, html) {
    const ativas = promocoes.filter(pr => D.promoAtiva(pr)).length;
    const counts = { produtos: produtos.length, promocoes: ativas || '' };
    const cur = rota === 'produto' ? 'produtos' : rota;
    const modo = D.online ? '<span class="badge-mode badge-mode--online">Banco conectado</span>' : '<span class="badge-mode badge-mode--demo">Modo demonstração</span>';
    app.innerHTML = `<div class="shell">
      <aside class="side">
        <a class="brand" href="#/produtos"><span class="brand__mark">PP</span><span><span class="brand__name">Outlets</span><small>Painel do gestor</small></span></a>
        <nav aria-label="Painel">${NAV.map(([r, t, ic]) => `<a href="#/${r}" ${cur === r ? 'aria-current="page"' : ''}>${ic}${t}${counts[r] ? `<span class="count">${counts[r]}</span>` : ''}</a>`).join('')}</nav>
        <div class="side__foot">${modo}<span>${esc(session.email)}</span><a href="../" target="_blank" rel="noopener">Ver a loja ↗</a><button type="button" data-sair>Sair</button></div>
      </aside>
      <div>
        <header class="topbar-m"><a class="brand" href="#/produtos"><span class="brand__mark">PP</span><span class="brand__name">Painel</span></a>${modo}<button class="btn btn--ghost btn--sm" type="button" data-sair>Sair</button></header>
        <nav class="tabs-m" aria-label="Painel">${NAV.map(([r, t]) => `<a href="#/${r}" ${cur === r ? 'aria-current="page"' : ''}>${t}</a>`).join('')}<a href="../" target="_blank" rel="noopener">Ver a loja ↗</a></nav>
        <main class="main" id="conteudo">${html}</main>
      </div>
    </div>`;
  }

  /* ---------- produtos: lista ---------- */
  const LF = { q: '', cat: '', status: 'todos', limite: 40 };
  function viewProdutos() {
    shell('produtos', `
      <div class="page-head"><div><h1>Produtos</h1><p>${produtos.length} peças cadastradas. Clique numa peça para editar preço, fotos, tamanhos e estoque.</p></div>
        <a class="btn btn--gold" href="#/produto/novo">${I.plus}Novo produto</a></div>
      <div class="toolbar">
        <label class="sr-only" for="f-q">Buscar</label><input class="input" id="f-q" type="search" placeholder="Buscar por nome ou referência" value="${esc(LF.q)}" data-lf="q">
        <label class="sr-only" for="f-cat">Categoria</label><select class="input" id="f-cat" data-lf="cat"><option value="">Todas as categorias</option>${L.categorias.map(c => `<option value="${esc(c.slug)}" ${LF.cat === c.slug ? 'selected' : ''}>${c.nome}</option>`).join('')}</select>
      </div>
      <div class="chips" data-chips></div>
      <div class="panel" data-lista></div>`);
    renderLista();
  }
  function renderLista() {
    const q = LF.q.trim().toLowerCase();
    const st = {
      todos: () => true, ativos: p => p.ativo !== false, escondidos: p => p.ativo === false,
      esgotados: p => estoqueTotal(p) === 0, promocao: p => !!promoDe(p.id),
    };
    const base = produtos.filter(p => (!q || `${p.nome} ${esc(p.sku)}`.toLowerCase().includes(q)) && (!LF.cat || p.categoria === LF.cat));
    const nomes = { todos: 'Todos', ativos: 'Na loja', escondidos: 'Escondidos', esgotados: 'Esgotados', promocao: 'Em promoção' };
    $('[data-chips]').innerHTML = Object.keys(st).map(k => `<button class="chip" type="button" data-status="${k}" aria-pressed="${LF.status === k}">${nomes[k]}<span>${base.filter(st[k]).length}</span></button>`).join('');
    const lista = base.filter(st[LF.status]);
    if (!lista.length) { $('[data-lista]').innerHTML = `<div class="empty"><h2>Nenhum produto</h2><p>Nada combina com essa busca ou filtro.</p></div>`; return; }
    const shown = lista.slice(0, LF.limite);
    $('[data-lista]').innerHTML = `<table class="table">
      <thead><tr><th>Produto</th><th>Categoria</th><th class="num">Preço</th><th class="num">Estoque</th><th>Situação</th><th><span class="sr-only">Ações</span></th></tr></thead>
      <tbody>${shown.map(p => {
        const pr = promoDe(p.id), tot = estoqueTotal(p), esg = D.esgotados(p).length;
        return `<tr>
          <td data-col="prod"><div class="prod-cell">${thumb(p)}<div><a href="#/produto/${encodeURIComponent(p.id)}">${esc(p.nome)}</a><small>${esc(p.sku || 'Sem referência')} · ${p.cores.map(c => esc(c.nome)).join(', ')}</small></div></div></td>
          <td data-col="cat">${esc(catName(p.categoria))}</td>
          <td class="num price-cell">${pr ? `<s>${brl(p.preco)}</s><b class="is-sale">${brl(precoFinal(p, pr))}</b>` : `<b>${brl(p.preco)}</b>`}</td>
          <td class="num" data-col="stock">${tot === 0 ? '<span class="stock-zero">Esgotado</span>' : `${tot} un.${esg ? `<br><small class="muted">${esg} tam. esgotado${esg > 1 ? 's' : ''}</small>` : ''}`}</td>
          <td>${p.ativo === false ? '<span class="pill pill--off">Escondido</span>' : '<span class="pill pill--ok">Na loja</span>'} ${pr ? `<span class="pill pill--sale">-${Math.round(pr.desconto)}%</span>` : ''}</td>
          <td><div class="row-actions">
            <a class="icon-btn" href="#/produto/${encodeURIComponent(p.id)}" title="Editar" aria-label="Editar ${esc(p.nome)}">${I.edit}</a>
            <button class="icon-btn" type="button" data-promo-for="${esc(p.id)}" title="Criar promoção" aria-label="Criar promoção para ${esc(p.nome)}">${I.tag}</button>
            <button class="icon-btn" type="button" data-toggle-ativo="${esc(p.id)}" title="${p.ativo === false ? 'Mostrar na loja' : 'Esconder da loja'}" aria-label="${p.ativo === false ? 'Mostrar' : 'Esconder'} ${esc(p.nome)}">${p.ativo === false ? I.eye : I.eyeOff}</button>
            <button class="icon-btn" type="button" data-excluir="${esc(p.id)}" title="Excluir" aria-label="Excluir ${esc(p.nome)}">${I.trash}</button>
          </div></td></tr>`;
      }).join('')}</tbody></table>
      ${lista.length > shown.length ? `<div class="pager"><span>Mostrando ${shown.length} de ${lista.length}</span><button class="btn btn--ghost btn--sm" type="button" data-mais>Mostrar mais</button></div>` : `<div class="pager"><span>${lista.length} ${lista.length === 1 ? 'produto' : 'produtos'}</span></div>`}`;
  }

  /* ---------- produto: editor ---------- */
  const PRESETS = [['Adulto', ['P', 'M', 'G', 'GG']], ['Plus size', ['G1', 'G2', 'G3', 'G4']], ['Calças', ['38', '40', '42', '44', '46']], ['Calças plus', ['48', '50', '52', '54']], ['Tênis', ['38', '39', '40', '41', '42', '43', '44']], ['Único', ['Único']]];
  let ED = null; // rascunho do produto em edição
  function viewProduto(id) {
    if (id === 'novo') {
      ED = { id: null, nome: '', sku: proximoSku(), categoria: L.categorias[0].slug, linha: 'adulto', origem: 'Nacional', preco: '', precoDe: null, descricao: '', composicao: '',
        cores: [{ nome: 'Preto', hex: '#151515', fotos: [] }], tamanhos: ['P', 'M', 'G', 'GG'], estoque: { P: 0, M: 0, G: 0, GG: 0 }, novo: true, maisVendido: false, ativo: true };
    } else {
      const p = produtos.find(x => x.id === id);
      if (!p) { shell('produtos', '<div class="empty"><h2>Produto não encontrado</h2><p>Ele pode ter sido excluído.</p><a class="btn" href="#/produtos">Voltar para produtos</a></div>'); return; }
      ED = clone(p);
      if (p.fotos && p.fotos.length && !ED.cores.some(c => c.fotos && c.fotos.length)) ED.cores.forEach(c => { c.fotos = [...p.fotos]; });
      ED.cores.forEach(c => { c.fotos = c.fotos || []; });
      ED.estoque = ED.estoque || {};
    }
    const pr = ED.id && promoDe(ED.id);
    shell('produto', `
      <div class="page-head"><div><p><a href="#/produtos" class="muted">← Produtos</a></p><h1>${ED.id ? esc(ED.nome) : 'Novo produto'}</h1></div>
        ${ED.id ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn--ghost" href="../#/produto/${esc(ED.slug)}" target="_blank" rel="noopener">${I.ext}Ver na loja</a><button class="btn btn--ghost" type="button" data-duplicar>${I.copy}Duplicar</button><button class="btn btn--ghost" type="button" data-promo-for="${esc(ED.id)}">${I.tag}Criar promoção</button></div>` : ''}</div>
      ${pr ? `<p class="callout" style="margin-bottom:16px">${I.tag}<span>Este produto está em promoção: <b>${Math.round(pr.desconto)}% off</b>, ${esc(fimTexto(pr.fim).toLowerCase())}. A loja mostra ${brl(precoFinal(ED, pr))} no lugar de ${brl(ED.preco)}.</span></p>` : ''}
      <form class="editor" data-editor novalidate>
        <div style="display:grid;gap:20px;min-width:0">
          <section class="card"><h2>Informações</h2>
            <label class="field" data-err="nome"><span>Nome do produto</span><input data-f="nome" value="${esc(ED.nome)}" placeholder="Ex.: Camiseta Oversized Essential" maxlength="90"></label>
            <div class="grid3">
              <label class="field"><span>Categoria</span><select data-f="categoria">${L.categorias.map(c => `<option value="${esc(c.slug)}" ${ED.categoria === c.slug ? 'selected' : ''}>${c.nome}</option>`).join('')}</select></label>
              <label class="field"><span>Linha</span><select data-f="linha"><option value="adulto" ${ED.linha === 'adulto' ? 'selected' : ''}>Adulto</option><option value="plus-size" ${ED.linha === 'plus-size' ? 'selected' : ''}>Plus size</option></select></label>
              <label class="field"><span>Origem</span><select data-f="origem"><option ${ED.origem === 'Nacional' ? 'selected' : ''}>Nacional</option><option ${ED.origem === 'Importado' ? 'selected' : ''}>Importado</option></select></label>
            </div>
            <label class="field"><span>Descrição</span><textarea data-f="descricao" maxlength="600" placeholder="Duas ou três frases sobre o caimento, o tecido e o uso.">${esc(ED.descricao)}</textarea></label>
            <div class="grid2">
              <label class="field"><span>Composição</span><input data-f="composicao" value="${esc(ED.composicao)}" placeholder="Ex.: 100% algodão"></label>
              <label class="field"><span>Referência (SKU)</span><input data-f="sku" value="${esc(ED.sku)}"></label>
            </div>
          </section>
          <section class="card"><h2>Preço</h2>
            <div class="grid2">
              <label class="field" data-err="preco"><span>Preço de venda</span><span class="with-prefix"><b>R$</b><input data-f="preco" type="number" inputmode="decimal" min="0" step="0.01" value="${ED.preco === '' ? '' : ED.preco}"></span></label>
              <label class="field" data-err="precoDe"><span>Preço antigo, riscado <small>(opcional)</small></span><span class="with-prefix"><b>R$</b><input data-f="precoDe" type="number" inputmode="decimal" min="0" step="0.01" value="${ED.precoDe ?? ''}"></span></label>
            </div>
            <p class="callout callout--info">${I.help}<span>Para um desconto com data para começar e terminar, use <b>Criar promoção</b>. O preço volta ao normal sozinho no fim do prazo e a loja pode anunciar a oferta.</span></p>
          </section>
          <section class="card"><div class="card__head"><h2>Tamanhos e estoque</h2></div>
            <p class="card__hint">Escolha a grade e informe quantas peças há de cada tamanho. Com 0, o tamanho aparece como esgotado na loja.</p>
            <div class="presets">${PRESETS.map(([n], i) => `<button class="chip" type="button" data-preset="${i}">${n}</button>`).join('')}</div>
            <div data-sizes></div>
            <div class="add-size"><label class="sr-only" for="novo-tam">Novo tamanho</label><input id="novo-tam" placeholder="Outro tamanho" maxlength="8"><button class="btn btn--ghost btn--sm" type="button" data-add-size>${I.plus}Adicionar</button></div>
            <p class="field__error" data-err-msg="tamanhos" hidden></p>
          </section>
          <section class="card"><div class="card__head"><h2>Cores e fotos</h2><button class="btn btn--ghost btn--sm" type="button" data-add-cor>${I.plus}Adicionar cor</button></div>
            <p class="card__hint">Cada cor tem as próprias fotos, e a loja troca a foto quando o cliente escolhe a cor. A primeira foto é a da vitrine. As fotos são ajustadas sozinhas para o formato vertical (4:5).</p>
            <div data-cores style="display:grid;gap:12px"></div>
            <p class="field__error" data-err-msg="cores" hidden></p>
          </section>
        </div>
        <aside style="display:grid;gap:20px;position:sticky;top:20px">
          <section class="card"><h2>Na loja</h2>
            <label class="switch"><input type="checkbox" data-f="ativo" ${ED.ativo !== false ? 'checked' : ''}><span><b>Mostrar na loja</b><small>Desligado, a peça some da loja mas continua aqui.</small></span></label>
            <label class="switch"><input type="checkbox" data-f="novo" ${ED.novo ? 'checked' : ''}><span><b>Lançamento</b><small>Aparece na vitrine "Lançamentos" e com a etiqueta "Novo".</small></span></label>
            <label class="switch"><input type="checkbox" data-f="maisVendido" ${ED.maisVendido ? 'checked' : ''}><span><b>Mais vendido</b><small>Aparece na vitrine "Mais vendidos".</small></span></label>
          </section>
          <section class="card"><h2>Prévia</h2><div class="preview-card" data-preview></div></section>
        </aside>
        <div class="save-bar" style="grid-column:1/-1">
          <span class="muted" data-dirty>${ED.id ? 'Alterações ainda não salvas aparecem só aqui.' : 'Preencha e salve para publicar.'}</span>
          ${ED.id ? `<button class="btn btn--danger" type="button" data-excluir="${esc(ED.id)}">${I.trash}Excluir</button>` : ''}
          <a class="btn btn--ghost" href="#/produtos">Cancelar</a>
          <button class="btn btn--gold" type="submit">Salvar produto</button>
        </div>
      </form>`);
    renderSizes(); renderCores(); renderPreview();
  }
  function proximoSku() {
    const n = Math.max(0, ...produtos.map(p => +(String(p.sku || '').match(/(\d+)$/) || [0, 0])[1]));
    return `PP-${String(n + 1).padStart(3, '0')}`;
  }
  function renderSizes() {
    $('[data-sizes]').innerHTML = ED.tamanhos.length ? `<div class="size-rows">${ED.tamanhos.map((t, i) => {
      const q = +(ED.estoque[t] ?? 0);
      return `<div class="size-row ${q <= 0 ? 'is-zero' : ''}"><b>${esc(t)}</b><label class="sr-only" for="q-${i}">Estoque ${esc(t)}</label><input id="q-${i}" type="number" min="0" step="1" inputmode="numeric" value="${q}" data-qtd="${esc(t)}"><button class="icon-btn" type="button" data-rm-size="${esc(t)}" aria-label="Remover tamanho ${esc(t)}">${I.close}</button></div>`;
    }).join('')}</div>` : '<p class="muted">Nenhum tamanho. Escolha uma grade acima.</p>';
  }
  function renderCores() {
    $('[data-cores]').innerHTML = ED.cores.map((c, ci) => `
      <div class="color-block">
        <div class="color-block__head">
          <label class="field"><span class="sr-only">Cor na amostra</span><input type="color" value="${esc(c.hex)}" data-cor-hex="${ci}" aria-label="Cor da amostra"></label>
          <label class="field"><span>Nome da cor</span><input value="${esc(c.nome)}" data-cor-nome="${ci}" placeholder="Ex.: Preto"></label>
          ${ED.cores.length > 1 ? `<button class="icon-btn" type="button" data-rm-cor="${ci}" aria-label="Remover a cor ${esc(c.nome)}" title="Remover cor">${I.trash}</button>` : '<span></span>'}
        </div>
        <div class="photos">
          ${c.fotos.map((f, fi) => `<div class="photo">${fi === 0 ? '<span class="photo__first">Vitrine</span>' : ''}<img src="${esc(D.foto(f))}" alt="Foto ${fi + 1} da cor ${esc(c.nome)}">
            <div class="photo__tools"><button type="button" data-mv="${ci},${fi},-1" ${fi === 0 ? 'disabled' : ''} aria-label="Mover para a esquerda">${I.left}</button><button type="button" data-rm-foto="${ci},${fi}" aria-label="Remover foto">${I.trash}</button><button type="button" data-mv="${ci},${fi},1" ${fi === c.fotos.length - 1 ? 'disabled' : ''} aria-label="Mover para a direita">${I.right}</button></div></div>`).join('')}
          ${c.fotos.length < 4 ? `<label class="photo-add" data-drop="${ci}">${I.photo}<span>Adicionar foto</span><small>ou arraste aqui</small><input type="file" accept="image/*" multiple data-upload="${ci}"></label>` : ''}
        </div>
        ${ci > 0 && !c.fotos.length && ED.cores[0].fotos.length ? `<button class="btn btn--ghost btn--sm" type="button" data-copiar-fotos="${ci}" style="justify-self:start">${I.copy}Usar as fotos de ${esc(ED.cores[0].nome)}</button>` : ''}
      </div>`).join('');
  }
  function renderPreview() {
    const p = { ...ED, preco: +ED.preco || 0 };
    const pr = ED.id && promoDe(ED.id);
    const final = precoFinal(p, pr);
    const de = pr ? p.preco : (+ED.precoDe > p.preco ? +ED.precoDe : null);
    $('[data-preview]').innerHTML = `${thumb(p)}<p class="p-name">${esc(p.nome || 'Nome do produto')} – ${esc((p.cores[0] || {}).nome || '')}</p>
      <p class="p-price">${de ? `<s>${brl(de)}</s>` : ''}<b class="${de ? 'is-sale' : ''}">${brl(final)}</b></p>
      <p class="muted" style="font-size:12.5px">${brl(round2(final * (1 - L.descontoPix)))} no Pix · ${ED.ativo === false ? 'escondido da loja' : 'visível na loja'}</p>`;
  }
  function validar() {
    const erros = {};
    if ((ED.nome || '').trim().length < 3) erros.nome = 'Digite o nome do produto.';
    if (!(+ED.preco > 0)) erros.preco = 'Digite um preço maior que zero.';
    if (ED.precoDe != null && ED.precoDe !== '' && +ED.precoDe <= +ED.preco) erros.precoDe = 'O preço antigo precisa ser maior que o de venda (ou deixe em branco).';
    if (!ED.tamanhos.length) erros.tamanhos = 'Escolha pelo menos um tamanho.';
    if (!ED.cores.length || ED.cores.some(c => !c.nome.trim())) erros.cores = 'Dê um nome a cada cor.';
    $$('[data-err]').forEach(f => { f.classList.remove('is-invalid'); f.querySelector('.field__error')?.remove(); });
    $$('[data-err-msg]').forEach(m => { m.hidden = true; });
    for (const [k, msg] of Object.entries(erros)) {
      const f = $(`[data-err="${k}"]`);
      if (f) { f.classList.add('is-invalid'); f.insertAdjacentHTML('beforeend', `<span class="field__error">${msg}</span>`); }
      const m = $(`[data-err-msg="${k}"]`); if (m) { m.textContent = msg; m.hidden = false; }
    }
    const first = $('.is-invalid input, [data-err-msg]:not([hidden])');
    if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus?.(); }
    return !Object.keys(erros).length;
  }
  async function salvarProduto(btn) {
    if (!validar()) { toast('Confira os campos marcados.', true); return; }
    const p = clone(ED);
    p.nome = p.nome.trim(); p.preco = round2(+p.preco); p.precoDe = p.precoDe === '' || p.precoDe == null ? null : round2(+p.precoDe);
    p.estoque = Object.fromEntries(p.tamanhos.map(t => [t, Math.max(0, parseInt(p.estoque[t] ?? 0, 10) || 0)]));
    p.cores = p.cores.map(c => ({ nome: c.nome.trim(), hex: c.hex, ...(c.fotos.length ? { fotos: c.fotos } : {}) }));
    delete p.fotos; delete p.esgotados; delete p.promo;
    const salvo = await busy(btn, () => A.saveProduto(p));
    await reload();
    toast(ED.id ? 'Produto salvo. A loja já mostra a versão nova.' : 'Produto cadastrado e publicado na loja.');
    location.hash = `#/produto/${encodeURIComponent(salvo.id)}`;
    if (ED.id) viewProduto(salvo.id);
  }
  async function enviarFotos(ci, files) {
    const area = $(`[data-drop="${ci}"]`);
    const livres = 4 - ED.cores[ci].fotos.length;
    const lista = [...files].filter(f => /^image\//.test(f.type)).slice(0, livres);
    if (!lista.length) { toast('Escolha arquivos de imagem (JPG, PNG ou WebP).', true); return; }
    area?.classList.add('is-busy'); area && (area.querySelector('span').textContent = 'Enviando…');
    try {
      for (const f of lista) {
        const blob = await prepararFoto(f);
        const url = await A.uploadFoto(blob, ED.nome || ED.sku);
        ED.cores[ci].fotos.push(url);
      }
      toast(lista.length > 1 ? `${lista.length} fotos adicionadas. Salve o produto para publicar.` : 'Foto adicionada. Salve o produto para publicar.');
    } catch (e) { toast(e.message || 'Não foi possível enviar a foto.', true); }
    renderCores(); renderPreview();
  }

  /* ---------- promoções ---------- */
  const PF = { status: 'ativa' };
  function viewPromocoes() {
    const nomes = { ativa: 'No ar', agendada: 'Agendadas', encerrada: 'Encerradas', todas: 'Todas' };
    const cont = s => promocoes.filter(pr => s === 'todas' || D.promoStatus(pr) === s).length;
    shell('promocoes', `
      <div class="page-head"><div><h1>Promoções</h1><p>Desconto com prazo. Marque "anunciar no site" para a oferta aparecer no pop-up e no banner da loja.</p></div>
        <button class="btn btn--gold" type="button" data-nova-promo>${I.plus}Nova promoção</button></div>
      <div class="chips">${Object.keys(nomes).map(k => `<button class="chip" type="button" data-pstatus="${k}" aria-pressed="${PF.status === k}">${nomes[k]}<span>${cont(k)}</span></button>`).join('')}</div>
      <div class="panel" data-plista></div>`);
    renderPromoLista();
  }
  function renderPromoLista() {
    const lista = promocoes.filter(pr => PF.status === 'todas' || D.promoStatus(pr) === PF.status)
      .sort((a, b) => new Date(b.inicio) - new Date(a.inicio));
    if (!lista.length) {
      $('[data-plista]').innerHTML = `<div class="empty"><h2>${PF.status === 'ativa' ? 'Nenhuma promoção no ar' : 'Nada por aqui'}</h2><p>Crie uma promoção para dar desconto numa peça por um período. Ela pode aparecer em destaque quando o cliente abrir a loja.</p><button class="btn" type="button" data-nova-promo>${I.plus}Nova promoção</button></div>`;
      return;
    }
    const pill = { ativa: '<span class="pill pill--ok">No ar</span>', agendada: '<span class="pill pill--warn">Agendada</span>', encerrada: '<span class="pill pill--off">Encerrada</span>' };
    $('[data-plista]').innerHTML = `<table class="table">
      <thead><tr><th>Produto</th><th class="num">Desconto</th><th class="num">Preço</th><th>Período</th><th>Aviso na loja</th><th>Situação</th><th><span class="sr-only">Ações</span></th></tr></thead>
      <tbody>${lista.map(pr => {
        const p = produtos.find(x => x.id === pr.produtoId); const st = D.promoStatus(pr);
        if (!p) return '';
        return `<tr>
          <td data-col="prod"><div class="prod-cell">${thumb(p)}<div><a href="#/produto/${encodeURIComponent(p.id)}">${esc(p.nome)}</a>${pr.titulo ? `<small>“${esc(pr.titulo)}”</small>` : ''}</div></div></td>
          <td class="num"><b>-${Math.round(pr.desconto)}%</b></td>
          <td class="num price-cell"><s>${brl(p.preco)}</s><b class="is-sale">${brl(precoFinal(p, pr))}</b></td>
          <td class="promo-row-period">${fmtData(pr.inicio)}<br>${pr.fim ? `até ${fmtData(pr.fim)}` : 'sem data para terminar'}</td>
          <td>${pr.anunciar ? `<span class="announce">${I.mega}Pop-up e banner</span>` : '<span class="muted">Sem aviso</span>'}</td>
          <td>${pill[st]}</td>
          <td><div class="row-actions">
            <button class="icon-btn" type="button" data-edit-promo="${esc(pr.id)}" title="Editar" aria-label="Editar promoção">${I.edit}</button>
            ${st !== 'encerrada' ? `<button class="icon-btn" type="button" data-encerrar="${esc(pr.id)}" title="Encerrar agora" aria-label="Encerrar promoção agora">${I.stop}</button>` : ''}
            <button class="icon-btn" type="button" data-rm-promo="${esc(pr.id)}" title="Excluir" aria-label="Excluir promoção">${I.trash}</button>
          </div></td></tr>`;
      }).join('')}</tbody></table>`;
  }
  let PR = null; // rascunho da promoção
  function abrirPromo({ id = null, produtoId = null } = {}) {
    const ex = id && promocoes.find(x => x.id === id);
    const agora = new Date(); const semana = new Date(agora.getTime() + 7 * 864e5); semana.setHours(23, 59, 0, 0);
    PR = ex ? clone(ex) : { id: null, produtoId: produtoId || null, desconto: 20, inicio: agora.toISOString(), fim: semana.toISOString(), anunciar: true, titulo: '', ativa: true };
    PR.semFim = !PR.fim;
    const d = document.createElement('dialog');
    d.className = 'modal'; d.setAttribute('aria-labelledby', 'promo-h');
    d.innerHTML = `<form data-promo-form novalidate>
      <div class="modal__head"><h2 id="promo-h">${ex ? 'Editar promoção' : 'Nova promoção'}</h2><button class="icon-btn" type="button" data-fechar aria-label="Fechar">${I.close}</button></div>
      <div class="modal__body">
        <div style="display:grid;gap:16px;min-width:0">
          <div class="field prod-picker" data-err="produto"><span>Produto</span>
            <input class="input" type="search" placeholder="Buscar produto" data-pbusca aria-label="Buscar produto">
            <div class="prod-picker__list" data-plist role="listbox" aria-label="Produtos"></div></div>
          <div class="grid2">
            <label class="field" data-err="desconto"><span>Desconto</span><span class="with-suffix"><input type="number" min="1" max="90" step="1" inputmode="numeric" data-pf="desconto" value="${PR.desconto}"><b>%</b></span></label>
            <label class="field"><span>Preço na promoção</span><span class="with-prefix"><b>R$</b><input type="number" min="0" step="0.01" inputmode="decimal" data-pf="final"></span></label>
          </div>
          <div class="grid2">
            <label class="field"><span>Começa em</span><input type="datetime-local" data-pf="inicio" value="${toLocalInput(PR.inicio)}"></label>
            <label class="field" data-err="fim"><span>Termina em</span><input type="datetime-local" data-pf="fim" value="${PR.fim ? toLocalInput(PR.fim) : ''}" ${PR.semFim ? 'disabled' : ''}></label>
          </div>
          <label class="switch"><input type="checkbox" data-pf="semFim" ${PR.semFim ? 'checked' : ''}><span><b>Sem data para terminar</b><small>A promoção fica no ar até você encerrar.</small></span></label>
          <label class="switch"><input type="checkbox" data-pf="anunciar" ${PR.anunciar ? 'checked' : ''}><span><b>Anunciar no site</b><small>Mostra um pop-up quando o cliente abre a loja (uma vez por visita) e coloca a oferta como primeiro slide do banner.</small></span></label>
          <label class="field"><span>Texto do aviso <small>(opcional)</small></span><input data-pf="titulo" maxlength="70" value="${esc(PR.titulo)}" placeholder="Ex.: Air Max Plus com 20% off só nesta semana"></label>
          <p class="callout" data-aviso hidden></p>
        </div>
        <div><p class="preview-label">Como aparece na loja</p><div data-mock></div></div>
      </div>
      <div class="modal__foot"><button class="btn btn--ghost" type="button" data-fechar>Cancelar</button><button class="btn btn--gold" type="submit">${ex ? 'Salvar promoção' : 'Criar promoção'}</button></div>
    </form>`;
    document.body.appendChild(d);
    d.addEventListener('close', () => d.remove());
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-fechar]')) d.close(); });
    renderPicker(''); syncFinal(); renderMock();
    d.showModal();
    (PR.produtoId ? $('[data-pf="desconto"]', d) : $('[data-pbusca]', d)).focus();
  }
  function renderPicker(q) {
    const s = q.trim().toLowerCase();
    const lista = produtos.filter(p => !s || `${p.nome} ${esc(p.sku)}`.toLowerCase().includes(s)).sort((a, b) => (b.id === PR.produtoId) - (a.id === PR.produtoId)).slice(0, 60);
    $('[data-plist]').innerHTML = lista.map(p => `<button type="button" role="option" data-pick="${esc(p.id)}" aria-pressed="${p.id === PR.produtoId}" aria-selected="${p.id === PR.produtoId}">${thumb(p)}<span>${esc(p.nome)}<small>${esc(p.sku || '')} · ${brl(p.preco)}${p.ativo === false ? ' · escondido' : ''}</small></span></button>`).join('') || '<p class="muted" style="padding:10px">Nenhum produto com esse nome.</p>';
  }
  function syncFinal() {
    const p = produtos.find(x => x.id === PR.produtoId); const inp = $('[data-pf="final"]');
    if (inp) inp.value = p ? precoFinal(p, { desconto: +PR.desconto || 0 }).toFixed(2) : '';
  }
  function renderMock() {
    const p = produtos.find(x => x.id === PR.produtoId);
    const aviso = $('[data-aviso]');
    const outra = p && promocoes.find(x => x.id !== PR.id && x.produtoId === p.id && D.promoStatus(x) !== 'encerrada');
    aviso.hidden = !outra && !(p && p.ativo === false);
    aviso.innerHTML = outra ? `${I.tag}<span>Este produto já tem outra promoção ${D.promoStatus(outra) === 'ativa' ? 'no ar' : 'agendada'} (-${Math.round(outra.desconto)}%). Quando as duas estiverem no ar, vale o maior desconto.</span>` : `${I.eyeOff}<span>Este produto está escondido da loja, então a oferta não vai aparecer até você mostrar a peça.</span>`;
    if (!p) { $('[data-mock]').innerHTML = '<div class="mock-pop"><div class="mock-pop__body"><p class="muted">Escolha um produto para ver a prévia.</p></div></div>'; return; }
    const final = precoFinal(p, { desconto: +PR.desconto || 0 });
    const titulo = PR.titulo.trim() || `${p.nome} com ${Math.round(+PR.desconto || 0)}% off`;
    const f = fotoDe(p);
    $('[data-mock]').innerHTML = `<div class="mock-pop">
      <span class="thumb" ${f ? `style="background-image:url('${esc(D.foto(f))}')"` : ''}>${f ? '' : I.shirt}<span class="off">-${Math.round(+PR.desconto || 0)}%</span></span>
      <div class="mock-pop__body"><p class="mock-pop__eyebrow">Oferta por tempo limitado</p><h3>${esc(titulo)}</h3>
        <p class="mock-pop__price"><s>${brl(p.preco)}</s><b>${brl(final)}</b></p>
        <p class="mock-pop__time">${esc(PR.semFim ? 'Por tempo limitado' : fimTexto(PR.fim))}</p>
        <span class="btn btn--block">Ver oferta</span></div></div>
      <p class="muted" style="font-size:12.5px;margin-top:10px">${PR.anunciar ? 'Aparece ao abrir a loja e como primeiro slide do banner.' : 'Sem aviso: só o preço muda na loja.'}</p>`;
  }
  async function salvarPromo(form, btn) {
    const erros = [];
    $$('[data-err]', form).forEach(f => { f.classList.remove('is-invalid'); f.querySelector('.field__error')?.remove(); });
    const err = (k, m) => { const f = $(`[data-err="${k}"]`, form); f.classList.add('is-invalid'); f.insertAdjacentHTML('beforeend', `<span class="field__error">${m}</span>`); erros.push(k); };
    if (!PR.produtoId) err('produto', 'Escolha o produto da promoção.');
    if (!(+PR.desconto >= 1 && +PR.desconto <= 90)) err('desconto', 'Use um desconto entre 1% e 90%.');
    if (!PR.semFim && (!PR.fim || new Date(PR.fim) <= new Date(PR.inicio))) err('fim', 'O fim precisa ser depois do começo.');
    if (erros.length) return;
    const dados = { id: PR.id, produtoId: PR.produtoId, desconto: Math.round(+PR.desconto * 100) / 100, inicio: PR.inicio, fim: PR.semFim ? null : PR.fim, anunciar: !!PR.anunciar, titulo: PR.titulo.trim(), ativa: PR.ativa !== false };
    await busy(btn, () => A.savePromocao(dados));
    await reload();
    form.closest('dialog').close();
    const st = D.promoStatus(dados);
    toast(st === 'ativa' ? (dados.anunciar ? 'Promoção no ar. A loja já mostra o novo preço e o aviso.' : 'Promoção no ar. A loja já mostra o novo preço.') : 'Promoção agendada. Ela entra no ar sozinha na data de início.');
    if (ED) renderPreview(); else route();   // no editor de produto, mantém o que ainda não foi salvo
  }

  /* ---------- como funciona ---------- */
  function viewAjuda() {
    shell('ajuda', `
      <div class="page-head"><div><h1>Como funciona</h1><p>O caminho de uma peça do cadastro até a oferta em destaque na loja.</p></div></div>
      <ol class="flow">
        <li><div><h3>Cadastre ou atualize a peça</h3><p>Em <a href="#/produtos">Produtos</a>, use <b>Novo produto</b> ou clique numa peça. Preencha nome, categoria e preço, escolha a grade de tamanhos com a quantidade em estoque e adicione as fotos de cada cor.</p>
          <ul><li>Tamanho com estoque 0 aparece como esgotado na loja.</li><li>"Mostrar na loja" desligado esconde a peça sem apagar.</li><li>Ao salvar, a loja já mostra a versão nova.</li></ul></div></li>
        <li><div><h3>Crie a promoção</h3><p>Clique no ícone de etiqueta ao lado da peça, ou em <a href="#/promocoes">Promoções › Nova promoção</a>. Escolha o desconto em % (ou digite o preço final) e o período.</p>
          <ul><li>Com início no futuro, a promoção fica <b>agendada</b> e entra no ar sozinha.</li><li>No fim do prazo, o preço volta ao normal sem você mexer em nada.</li></ul></div></li>
        <li><div><h3>Marque "Anunciar no site"</h3><p>A loja monta o aviso sozinha, com a foto da peça, o preço antigo riscado, o preço novo e o prazo.</p>
          <ul><li><b>Pop-up</b> quando o cliente abre a loja, uma vez por visita.</li><li><b>Primeiro slide do banner</b> da página inicial.</li><li>Etiqueta de desconto e prazo na página do produto.</li></ul></div></li>
        <li><div><h3>Acompanhe e encerre</h3><p>Em Promoções você vê o que está no ar, agendado e encerrado. Use <b>Encerrar agora</b> para tirar a oferta antes do prazo. O aviso some da loja na hora.</p></div></li>
      </ol>
      ${D.online ? '' : '<p class="callout" style="max-width:860px">' + I.help + '<span><b>Modo demonstração:</b> as alterações ficam só neste navegador. Abra a loja neste mesmo navegador para ver o resultado. Depois de conectar o Supabase, tudo passa a valer para todos os clientes.</span></p><p style="margin-top:12px"><button class="btn btn--ghost btn--sm" type="button" data-reset-demo>Restaurar o catálogo original da demonstração</button></p>'}`);
  }

  /* ---------- rotas ---------- */
  function route() {
    if (!session) return;
    const [nome, arg] = location.hash.replace(/^#\/?/, '').split('/');
    if (nome === 'produto') viewProduto(decodeURIComponent(arg || 'novo'));
    else if (nome === 'promocoes') viewPromocoes();
    else if (nome === 'ajuda') viewAjuda();
    else viewProdutos();
    window.scrollTo(0, 0);
  }

  /* ---------- eventos ---------- */
  document.addEventListener('submit', async e => {
    const f = e.target; e.preventDefault();
    if (f.matches('[data-login]')) {
      const email = f.email.value.trim(), senha = f.senha.value;
      if (!/^\S+@\S+\.\S+$/.test(email) || !senha) { viewLogin('Digite o e-mail e a senha.'); return; }
      try { session = await A.signIn(email, senha); app.innerHTML = '<p class="loading">Carregando a loja…</p>'; await reload(); route(); }
      catch (err) { viewLogin(err.message); }
    }
    if (f.matches('[data-editor]')) { try { await salvarProduto(e.submitter || $('[type=submit]', f)); } catch { /* aviso já mostrado */ } }
    if (f.matches('[data-promo-form]')) { try { await salvarPromo(f, e.submitter || $('[type=submit]', f)); } catch { /* aviso já mostrado */ } }
  });

  document.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.lf) { LF[el.dataset.lf] = el.value; LF.limite = 40; renderLista(); return; }
    if (ED && el.dataset.f && el.type !== 'checkbox') { ED[el.dataset.f] = el.value; renderPreview(); return; }
    if (ED && el.dataset.qtd) { ED.estoque[el.dataset.qtd] = el.value; el.closest('.size-row').classList.toggle('is-zero', !(+el.value > 0)); return; }
    if (ED && el.dataset.corNome) { ED.cores[+el.dataset.corNome].nome = el.value; renderPreview(); return; }
    if (ED && el.dataset.corHex) { ED.cores[+el.dataset.corHex].hex = el.value; return; }
    if (PR && el.matches('[data-pbusca]')) { renderPicker(el.value); return; }
    if (PR && el.dataset.pf) {
      const k = el.dataset.pf;
      if (k === 'desconto') { PR.desconto = el.value; syncFinal(); }
      else if (k === 'final') { const p = produtos.find(x => x.id === PR.produtoId); if (p && +el.value > 0) { PR.desconto = Math.round((1 - el.value / p.preco) * 1000) / 10; $('[data-pf="desconto"]').value = PR.desconto; } }
      else if (k === 'inicio' || k === 'fim') { if (el.value) PR[k] = new Date(el.value).toISOString(); }
      else if (k === 'titulo') PR.titulo = el.value;
      renderMock();
    }
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (ED && el.dataset.f && el.type === 'checkbox') { ED[el.dataset.f] = el.checked; renderPreview(); }
    if (ED && el.dataset.f === 'categoria') renderPreview();
    if (ED && el.dataset.upload != null) { enviarFotos(+el.dataset.upload, el.files); el.value = ''; }
    if (PR && el.dataset.pf === 'semFim') { PR.semFim = el.checked; const fim = $('[data-pf="fim"]'); fim.disabled = el.checked; if (!el.checked && !PR.fim) { PR.fim = new Date(Date.now() + 7 * 864e5).toISOString(); fim.value = toLocalInput(PR.fim); } renderMock(); }
    if (PR && el.dataset.pf === 'anunciar') { PR.anunciar = el.checked; renderMock(); }
  });
  document.addEventListener('click', async e => {
    const t = e.target.closest('button, a'); if (!t) return;
    const d = t.dataset;
    if ('sair' in d) { await A.signOut(); session = null; viewLogin(); return; }
    if (d.status) { LF.status = d.status; LF.limite = 40; renderLista(); return; }
    if ('mais' in d) { LF.limite += 40; renderLista(); return; }
    if (d.toggleAtivo) {
      const p = clone(produtos.find(x => x.id === d.toggleAtivo)); p.ativo = p.ativo === false;
      try { await A.saveProduto(p); await reload(); toast(p.ativo ? `${p.nome} voltou para a loja.` : `${p.nome} foi escondido da loja.`); renderLista(); } catch (err) { toast(err.message, true); }
      return;
    }
    if (d.excluir) {
      const p = produtos.find(x => x.id === d.excluir);
      const ok = await confirmar({ titulo: 'Excluir produto', texto: `<b>${esc(p.nome)}</b> sai da loja e do painel, junto com as promoções dele. Para tirar da loja sem apagar, use "Esconder".`, ok: 'Excluir', perigo: true });
      if (!ok) return;
      try { await A.deleteProduto(p.id); await reload(); toast('Produto excluído.'); location.hash = '#/produtos'; route(); } catch (err) { toast(err.message, true); }
      return;
    }
    if ('duplicar' in d && ED) {
      const copia = clone(ED); copia.id = null; copia.slug = null; copia.nome = `${ED.nome} (cópia)`; copia.sku = proximoSku(); copia.ativo = false;
      try { const s = await A.saveProduto(copia); await reload(); toast('Cópia criada e escondida da loja. Ajuste e mostre quando estiver pronta.'); location.hash = `#/produto/${encodeURIComponent(s.id)}`; } catch (err) { toast(err.message, true); }
      return;
    }
    if (d.promoFor) { abrirPromo({ produtoId: d.promoFor }); return; }
    if ('novaPromo' in d) { abrirPromo(); return; }
    if (d.editPromo) { abrirPromo({ id: d.editPromo }); return; }
    if (d.pstatus) { PF.status = d.pstatus; viewPromocoes(); return; }
    if (d.encerrar) {
      const pr = clone(promocoes.find(x => x.id === d.encerrar)); pr.ativa = false;
      if (!await confirmar({ titulo: 'Encerrar promoção', texto: 'O preço volta ao normal e o aviso sai da loja agora.', ok: 'Encerrar' })) return;
      try { await A.savePromocao(pr); await reload(); toast('Promoção encerrada.'); viewPromocoes(); } catch (err) { toast(err.message, true); }
      return;
    }
    if (d.rmPromo) {
      if (!await confirmar({ titulo: 'Excluir promoção', texto: 'A promoção some da lista. Se estiver no ar, o preço volta ao normal agora.', ok: 'Excluir', perigo: true })) return;
      try { await A.deletePromocao(d.rmPromo); await reload(); toast('Promoção excluída.'); viewPromocoes(); } catch (err) { toast(err.message, true); }
      return;
    }
    if (d.pick && PR) { PR.produtoId = d.pick; $$('[data-pick]').forEach(b => { b.setAttribute('aria-pressed', b === t); b.setAttribute('aria-selected', b === t); }); syncFinal(); renderMock(); return; }
    if (d.preset && ED) { const [, ts] = PRESETS[+d.preset]; ED.tamanhos = [...ts]; ED.estoque = Object.fromEntries(ts.map(x => [x, +(ED.estoque[x] ?? 0)])); renderSizes(); return; }
    if ('addSize' in d && ED) { const inp = $('#novo-tam'); const v = inp.value.trim().toUpperCase(); if (v && !ED.tamanhos.includes(v)) { ED.tamanhos.push(v); ED.estoque[v] = 0; renderSizes(); } inp.value = ''; inp.focus(); return; }
    if (d.rmSize && ED) { ED.tamanhos = ED.tamanhos.filter(x => x !== d.rmSize); delete ED.estoque[d.rmSize]; renderSizes(); return; }
    if ('addCor' in d && ED) { ED.cores.push({ nome: '', hex: '#888888', fotos: [] }); renderCores(); $$('[data-cor-nome]').pop().focus(); return; }
    if (d.rmCor && ED) { ED.cores.splice(+d.rmCor, 1); renderCores(); renderPreview(); return; }
    if (d.rmFoto && ED) { const [ci, fi] = d.rmFoto.split(',').map(Number); ED.cores[ci].fotos.splice(fi, 1); renderCores(); renderPreview(); return; }
    if (d.mv && ED) { const [ci, fi, dir] = d.mv.split(',').map(Number); const fs = ED.cores[ci].fotos; [fs[fi], fs[fi + dir]] = [fs[fi + dir], fs[fi]]; renderCores(); renderPreview(); return; }
    if (d.copiarFotos && ED) { ED.cores[+d.copiarFotos].fotos = [...ED.cores[0].fotos]; renderCores(); return; }
    if ('resetDemo' in d) {
      if (!await confirmar({ titulo: 'Restaurar demonstração', texto: 'Volta ao catálogo original e apaga as promoções e alterações feitas neste navegador.', ok: 'Restaurar', perigo: true })) return;
      A.resetDemo(); await reload(); toast('Catálogo da demonstração restaurado.'); location.hash = '#/produtos'; route();
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'novo-tam') { e.preventDefault(); $('[data-add-size]').click(); } });
  ['dragover', 'dragleave', 'drop'].forEach(tipo => document.addEventListener(tipo, e => {
    const area = e.target.closest?.('[data-drop]'); if (!area) return;
    e.preventDefault();
    area.classList.toggle('is-drag', tipo === 'dragover');
    if (tipo === 'drop') enviarFotos(+area.dataset.drop, e.dataTransfer.files);
  }));
  window.addEventListener('hashchange', () => { ED = null; route(); });

  /* ---------- início ---------- */
  (async () => {
    try { session = await A.session(); } catch { session = null; }
    if (!session) { viewLogin(); return; }
    app.innerHTML = '<p class="loading">Carregando a loja…</p>';
    try { await reload(); route(); } catch (err) { toast(err.message, true); viewLogin(err.message); }
  })();
})();
