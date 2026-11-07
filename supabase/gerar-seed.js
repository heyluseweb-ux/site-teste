// Gera supabase/seed.sql a partir de assets/js/products.js (o catálogo atual).
// Uso: node supabase/gerar-seed.js
// O estoque inicial é 5 unidades por tamanho (0 nos tamanhos marcados como esgotados): ajuste no painel.
const fs = require('fs');
const path = require('path');
const window = {};
eval(fs.readFileSync(path.join(__dirname, '../assets/js/products.js'), 'utf8'));
const P = window.PRODUTOS;

const q = v => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const arr = a => `array[${a.map(q).join(', ')}]::text[]`;
const json = o => `${q(JSON.stringify(o))}::jsonb`;

const rows = P.map((p, i) => {
  const estoque = Object.fromEntries(p.tamanhos.map(t => [t, p.esgotados.includes(t) ? 0 : 5]));
  return `(${[q(p.id), q(p.sku), q(p.slug), q(p.nome), q(p.categoria), q(p.linha), q(p.origem), p.preco.toFixed(2), p.precoDe == null ? 'null' : p.precoDe.toFixed(2),
    q(p.descricao), q(p.composicao), json(p.cores), arr(p.tamanhos), json(estoque), p.novo, p.maisVendido, true, i + 1].join(', ')})`;
});

const sql = `-- Catálogo inicial da PP Outlets (${P.length} peças), gerado por supabase/gerar-seed.js.
-- Rode depois de schema.sql. Rodar de novo atualiza as peças com o mesmo id.
insert into public.produtos (id, sku, slug, nome, categoria, linha, origem, preco, preco_de, descricao, composicao, cores, tamanhos, estoque, novo, mais_vendido, ativo, ordem) values
${rows.join(',\n')}
on conflict (id) do update set sku = excluded.sku, slug = excluded.slug, nome = excluded.nome, categoria = excluded.categoria, linha = excluded.linha,
  origem = excluded.origem, preco = excluded.preco, preco_de = excluded.preco_de, descricao = excluded.descricao, composicao = excluded.composicao,
  cores = excluded.cores, tamanhos = excluded.tamanhos, estoque = excluded.estoque, novo = excluded.novo, mais_vendido = excluded.mais_vendido, ordem = excluded.ordem;
`;
fs.writeFileSync(path.join(__dirname, 'seed.sql'), sql);
console.log(`seed.sql: ${P.length} produtos`);
