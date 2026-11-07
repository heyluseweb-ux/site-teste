-- PP Outlets — banco de dados do estoque (Supabase / Postgres)
-- Como usar: no painel do Supabase, abra SQL Editor, cole este arquivo inteiro e clique em Run.
-- Depois rode seed.sql para carregar o catálogo inicial (opcional).
-- Pode rodar de novo sem perder dados: tudo usa "if not exists" / "or replace".

create extension if not exists pgcrypto;

-- Quem pode editar a loja: só os e-mails desta lista (o dono da PP Outlets e quem ele autorizar).
create table if not exists public.gestores (
  email text primary key,
  nome text,
  criado_em timestamptz not null default now()
);

-- A checagem roda num esquema interno (não exposto pela API); public.eh_gestor() só repassa a pergunta.
create schema if not exists privado;
grant usage on schema privado to anon, authenticated;
create or replace function privado.eh_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.gestores where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function privado.eh_gestor() from public;
grant execute on function privado.eh_gestor() to anon, authenticated;
create or replace function public.eh_gestor() returns boolean
language sql stable security invoker set search_path = public as $$
  select privado.eh_gestor();
$$;

-- Produtos do catálogo
create table if not exists public.produtos (
  id text primary key default gen_random_uuid()::text,
  sku text unique,
  slug text unique not null,
  nome text not null check (length(trim(nome)) > 1),
  categoria text not null,
  linha text not null default 'adulto' check (linha in ('adulto', 'plus-size')),
  origem text not null default 'Nacional' check (origem in ('Nacional', 'Importado')),
  preco numeric(10, 2) not null check (preco >= 0),
  preco_de numeric(10, 2) check (preco_de is null or preco_de >= 0),   -- preço antigo fixo (opcional)
  descricao text not null default '',
  composicao text not null default '',
  cores jsonb not null default '[]'::jsonb,                            -- [{"nome":"Preto","hex":"#151515","fotos":["https://..."]}]
  tamanhos text[] not null default '{}',
  estoque jsonb not null default '{}'::jsonb,                          -- {"P": 3, "M": 0, "G": 5}; 0 = esgotado
  novo boolean not null default false,
  mais_vendido boolean not null default false,
  ativo boolean not null default true,                                 -- false = escondido da loja
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists produtos_categoria_idx on public.produtos (categoria);

-- Promoções: desconto em % sobre o preço do produto, com início e fim.
-- Enquanto estiver no prazo, a loja mostra o preço com desconto; "anunciar" liga o pop-up e o slide do banner.
create table if not exists public.promocoes (
  id uuid primary key default gen_random_uuid(),
  produto_id text not null references public.produtos (id) on delete cascade,
  desconto numeric(5, 2) not null check (desconto > 0 and desconto < 100),
  inicio timestamptz not null default now(),
  fim timestamptz,
  anunciar boolean not null default true,
  titulo text,                                                         -- texto do aviso (opcional)
  ativa boolean not null default true,                                 -- false = encerrada manualmente
  criado_em timestamptz not null default now(),
  constraint promocoes_prazo check (fim is null or fim > inicio)
);
create index if not exists promocoes_produto_idx on public.promocoes (produto_id);

-- atualizado_em automático
create or replace function public.tocar_atualizado_em() returns trigger
language plpgsql set search_path = public as $$ begin new.atualizado_em = now(); return new; end $$;
drop trigger if exists produtos_atualizado on public.produtos;
create trigger produtos_atualizado before update on public.produtos
  for each row execute function public.tocar_atualizado_em();

-- Segurança (RLS): a loja só lê; só gestores gravam.
alter table public.gestores enable row level security;
alter table public.produtos enable row level security;
alter table public.promocoes enable row level security;

drop policy if exists "gestor ve a lista" on public.gestores;
create policy "gestor ve a lista" on public.gestores for select to authenticated using (public.eh_gestor());

drop policy if exists "loja le produtos ativos" on public.produtos;
create policy "loja le produtos ativos" on public.produtos for select to anon, authenticated using (ativo or public.eh_gestor());
drop policy if exists "gestor cria produtos" on public.produtos;
create policy "gestor cria produtos" on public.produtos for insert to authenticated with check (public.eh_gestor());
drop policy if exists "gestor altera produtos" on public.produtos;
create policy "gestor altera produtos" on public.produtos for update to authenticated using (public.eh_gestor()) with check (public.eh_gestor());
drop policy if exists "gestor apaga produtos" on public.produtos;
create policy "gestor apaga produtos" on public.produtos for delete to authenticated using (public.eh_gestor());

drop policy if exists "loja le promocoes ativas" on public.promocoes;
create policy "loja le promocoes ativas" on public.promocoes for select to anon, authenticated using (ativa or public.eh_gestor());
drop policy if exists "gestor cria promocoes" on public.promocoes;
create policy "gestor cria promocoes" on public.promocoes for insert to authenticated with check (public.eh_gestor());
drop policy if exists "gestor altera promocoes" on public.promocoes;
create policy "gestor altera promocoes" on public.promocoes for update to authenticated using (public.eh_gestor()) with check (public.eh_gestor());
drop policy if exists "gestor apaga promocoes" on public.promocoes;
create policy "gestor apaga promocoes" on public.promocoes for delete to authenticated using (public.eh_gestor());

grant select on public.produtos, public.promocoes to anon;
grant select, insert, update, delete on public.produtos, public.promocoes to authenticated;
grant select on public.gestores to authenticated;

-- Fotos: bucket público "produtos" (qualquer um vê; só gestores enviam e apagam).
insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true)
  on conflict (id) do update set public = true;
drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas" on storage.objects for select to public using (bucket_id = 'produtos');
drop policy if exists "gestor envia fotos" on storage.objects;
create policy "gestor envia fotos" on storage.objects for insert to authenticated with check (bucket_id = 'produtos' and public.eh_gestor());
drop policy if exists "gestor altera fotos" on storage.objects;
create policy "gestor altera fotos" on storage.objects for update to authenticated using (bucket_id = 'produtos' and public.eh_gestor());
drop policy if exists "gestor apaga fotos" on storage.objects;
create policy "gestor apaga fotos" on storage.objects for delete to authenticated using (bucket_id = 'produtos' and public.eh_gestor());

-- Último passo: troque pelo e-mail do dono da loja (o mesmo usado para criar o usuário em Authentication > Users).
-- insert into public.gestores (email, nome) values ('dono@ppoutlets.com.br', 'Dono da PP Outlets');
