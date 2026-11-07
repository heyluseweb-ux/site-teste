/* PP Outlets — camada de dados da loja e do painel do gestor.
   Com o Supabase configurado (assets/js/supabase-config.js) lê e grava no banco.
   Sem configuração, roda em modo demonstração: os dados ficam no navegador (localStorage),
   começando pelo catálogo de assets/js/products.js. */
(() => {
  'use strict';
  const CFG = window.SUPABASE || {};
  const ONLINE = !!(CFG.url && CFG.anonKey);
  const ROOT = new URL('../../', document.currentScript.src).href;   // raiz do site, venha de onde vier a página
  const DEMO_KEY = 'pp_demo_db';
  const round2 = n => Math.round(n * 100) / 100;
  const slugify = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  /* ---------- formatos: linha do banco <-> produto da loja ---------- */
  const fromRow = r => ({
    id: String(r.id), sku: r.sku || '', slug: r.slug, nome: r.nome, categoria: r.categoria, linha: r.linha || 'adulto', origem: r.origem || 'Nacional',
    preco: +r.preco, precoDe: r.preco_de == null ? null : +r.preco_de, descricao: r.descricao || '', composicao: r.composicao || '',
    cores: Array.isArray(r.cores) ? r.cores : [], tamanhos: r.tamanhos || [], estoque: r.estoque || {},
    novo: !!r.novo, maisVendido: !!r.mais_vendido, ativo: r.ativo !== false, ordem: r.ordem || 0, atualizadoEm: r.atualizado_em || null,
  });
  const toRow = p => ({
    sku: p.sku || null, slug: p.slug, nome: p.nome, categoria: p.categoria, linha: p.linha, origem: p.origem,
    preco: p.preco, preco_de: p.precoDe ?? null, descricao: p.descricao || '', composicao: p.composicao || '',
    cores: p.cores, tamanhos: p.tamanhos, estoque: p.estoque || {}, novo: !!p.novo, mais_vendido: !!p.maisVendido,
    ativo: p.ativo !== false, ordem: p.ordem || 0,
  });
  const promoFromRow = r => ({ id: String(r.id), produtoId: String(r.produto_id), desconto: +r.desconto, inicio: r.inicio, fim: r.fim || null, anunciar: r.anunciar !== false, titulo: r.titulo || '', ativa: r.ativa !== false });
  const promoToRow = pr => ({ produto_id: pr.produtoId, desconto: pr.desconto, inicio: pr.inicio, fim: pr.fim || null, anunciar: !!pr.anunciar, titulo: pr.titulo || null, ativa: pr.ativa !== false });

  /* tamanhos sem estoque; um tamanho sem número cadastrado conta como disponível */
  const esgotados = p => p.tamanhos.filter(t => p.estoque && t in p.estoque && +p.estoque[t] <= 0);
  const withEsgotados = p => ({ ...p, esgotados: esgotados(p) });
  const foto = u => (!u ? '' : /^(https?:|data:|blob:|\/)/.test(u) ? u : ROOT + u);

  /* ---------- promoções ---------- */
  // conta em centavos para arredondar como o caixa: 849,90 com 25% off = 637,43
  const precoComDesconto = (preco, desconto) => Math.round(Math.round(preco * 100) * (100 - desconto) / 100) / 100;
  const promoAtiva = (pr, now = new Date()) => pr.ativa && new Date(pr.inicio) <= now && (!pr.fim || new Date(pr.fim) > now);
  const promoStatus = (pr, now = new Date()) => !pr.ativa ? 'encerrada' : new Date(pr.inicio) > now ? 'agendada' : (pr.fim && new Date(pr.fim) <= now) ? 'encerrada' : 'ativa';
  function applyPromos(produtos, promos, now = new Date()) {
    const act = promos.filter(pr => promoAtiva(pr, now));
    return produtos.map(p => {
      const pr = act.filter(x => x.produtoId === p.id).sort((a, b) => b.desconto - a.desconto)[0];
      if (!pr) return p;
      return { ...p, preco: precoComDesconto(p.preco, pr.desconto), precoDe: Math.max(p.precoDe || 0, p.preco), promo: pr };
    });
  }
  function announcements(produtos, now = new Date()) {
    return produtos.filter(p => p.promo && p.promo.anunciar && promoAtiva(p.promo, now))
      .sort((a, b) => new Date(b.promo.inicio) - new Date(a.promo.inicio));
  }

  /* ---------- modo demonstração (localStorage) ---------- */
  function demoSeed() {
    const produtos = (window.PRODUTOS || []).map((p, i) => ({
      ...p, estoque: Object.fromEntries(p.tamanhos.map(t => [t, (p.esgotados || []).includes(t) ? 0 : 5])), ativo: true, ordem: i + 1,
    }));
    produtos.forEach(p => delete p.esgotados);
    return { produtos, promocoes: [] };
  }
  function demoDB() {
    try { const raw = localStorage.getItem(DEMO_KEY); if (raw) return JSON.parse(raw); } catch { /* sem armazenamento */ }
    return demoSeed();
  }
  function demoSave(db) {
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); }
    catch (e) { throw new Error('O navegador ficou sem espaço para guardar as fotos da demonstração. Remova algumas fotos ou conecte o Supabase.'); }
  }
  const demoId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

  /* ---------- Supabase ---------- */
  let sb = null;
  function client() {
    if (!ONLINE) return null;
    if (!sb) {
      if (!window.supabase) throw new Error('Biblioteca do Supabase não carregada.');
      sb = window.supabase.createClient(CFG.url, CFG.anonKey, { auth: { persistSession: true, storageKey: 'pp_gestor_sessao' } });
    }
    return sb;
  }
  const check = ({ data, error }) => { if (error) throw new Error(traduzErro(error.message)); return data; };
  function traduzErro(m) {
    if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/row-level security|permission denied/i.test(m)) return 'Seu usuário não tem permissão para alterar a loja. Peça para incluir seu e-mail na lista de gestores.';
    if (/duplicate key.*slug/i.test(m)) return 'Já existe um produto com esse endereço. Mude um pouco o nome.';
    if (/duplicate key.*sku/i.test(m)) return 'Já existe um produto com essa referência (SKU).';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Sem conexão com o banco. Confira a internet e tente de novo.';
    return m;
  }
  async function restGet(path) {
    const r = await fetch(`${CFG.url}/rest/v1/${path}`, { headers: { apikey: CFG.anonKey, Authorization: `Bearer ${CFG.anonKey}` } });
    if (!r.ok) throw new Error(`Supabase respondeu ${r.status}`);
    return r.json();
  }

  /* ---------- API usada pela loja ---------- */
  async function loadCatalog() {
    let produtos, promos;
    if (ONLINE) {
      try {
        const [rows, prows] = await Promise.all([
          restGet('produtos?select=*&ativo=eq.true&order=ordem.asc,criado_em.asc'),
          restGet('promocoes?select=*&ativa=eq.true'),
        ]);
        produtos = rows.map(fromRow); promos = prows.map(promoFromRow);
      } catch (e) {
        console.warn('PP Outlets: catálogo do banco indisponível, usando o catálogo local.', e);
        const db = demoSeed(); produtos = db.produtos; promos = [];
      }
    } else {
      const db = demoDB(); produtos = db.produtos.filter(p => p.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)); promos = db.promocoes;
    }
    const aplicados = applyPromos(produtos.map(withEsgotados), promos);
    return { produtos: aplicados, anuncios: announcements(aplicados) };
  }

  /* ---------- API usada pelo painel do gestor ---------- */
  const admin = {
    async session() {
      if (!ONLINE) { try { return JSON.parse(sessionStorage.getItem('pp_demo_sessao')); } catch { return null; } }
      const { data } = await client().auth.getSession();
      return data.session ? { email: data.session.user.email } : null;
    },
    async signIn(email, senha) {
      if (!ONLINE) { const s = { email }; try { sessionStorage.setItem('pp_demo_sessao', JSON.stringify(s)); } catch { /* ok */ } return s; }
      const data = check(await client().auth.signInWithPassword({ email, password: senha }));
      const gest = check(await client().from('gestores').select('email').limit(1));
      if (!gest.length) { await client().auth.signOut(); throw new Error('Este e-mail entrou, mas não está na lista de gestores da loja.'); }
      return { email: data.user.email };
    },
    async signOut() {
      if (!ONLINE) { try { sessionStorage.removeItem('pp_demo_sessao'); } catch { /* ok */ } return; }
      await client().auth.signOut();
    },
    async listProdutos() {
      if (!ONLINE) return demoDB().produtos.slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      return check(await client().from('produtos').select('*').order('ordem').order('criado_em')).map(fromRow);
    },
    async saveProduto(p) {
      const novo = !p.id;
      if (!p.slug || novo) p.slug = `${slugify(p.nome)}-${Math.random().toString(36).slice(2, 6)}`;
      if (!ONLINE) {
        const db = demoDB();
        if (novo) { p.id = demoId(); p.ordem = Math.max(0, ...db.produtos.map(x => x.ordem || 0)) + 1; db.produtos.push(p); }
        else db.produtos = db.produtos.map(x => (x.id === p.id ? p : x));
        demoSave(db); return p;
      }
      const row = toRow(p);
      const q = novo ? client().from('produtos').insert(row) : client().from('produtos').update(row).eq('id', p.id);
      return fromRow(check(await q.select().single()));
    },
    async deleteProduto(id) {
      if (!ONLINE) { const db = demoDB(); db.produtos = db.produtos.filter(p => p.id !== id); db.promocoes = db.promocoes.filter(pr => pr.produtoId !== id); demoSave(db); return; }
      check(await client().from('produtos').delete().eq('id', id));
    },
    async listPromocoes() {
      if (!ONLINE) return demoDB().promocoes.slice();
      return check(await client().from('promocoes').select('*').order('criado_em', { ascending: false })).map(promoFromRow);
    },
    async savePromocao(pr) {
      if (!ONLINE) {
        const db = demoDB();
        if (!pr.id) { pr.id = demoId(); pr.criadoEm = new Date().toISOString(); db.promocoes.unshift(pr); }
        else db.promocoes = db.promocoes.map(x => (x.id === pr.id ? pr : x));
        demoSave(db); return pr;
      }
      const row = promoToRow(pr);
      const q = pr.id ? client().from('promocoes').update(row).eq('id', pr.id) : client().from('promocoes').insert(row);
      return promoFromRow(check(await q.select().single()));
    },
    async deletePromocao(id) {
      if (!ONLINE) { const db = demoDB(); db.promocoes = db.promocoes.filter(p => p.id !== id); demoSave(db); return; }
      check(await client().from('promocoes').delete().eq('id', id));
    },
    /* recebe a foto já ajustada (Blob webp) e devolve o endereço para guardar no produto */
    async uploadFoto(blob, produtoRef) {
      if (!ONLINE) return await new Promise((ok, fail) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = fail; fr.readAsDataURL(blob); });
      const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${slugify(produtoRef || 'produto')}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      check(await client().storage.from('produtos').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false }));
      return client().storage.from('produtos').getPublicUrl(path).data.publicUrl;
    },
    resetDemo() { try { localStorage.removeItem(DEMO_KEY); } catch { /* ok */ } },
  };

  window.PPData = { online: ONLINE, mode: ONLINE ? 'supabase' : 'demo', foto, slugify, esgotados, promoAtiva, precoComDesconto, promoStatus, applyPromos, loadCatalog, admin };
})();
