# PP Outlets — loja virtual (protótipo)

Loja online da **PP Outlets** (moda masculina adulto e plus size, São José dos Campos – SP), feita para apresentar ao cliente. A estrutura segue o modelo das lojas de streetwear como a Steezy: vitrine, catálogo com filtros, página de produto, carrinho e checkout dentro do próprio site, sem mandar o cliente para WhatsApp ou Shopee.

Feito em HTML, CSS e JavaScript puros: não precisa de instalação nem de build.

## Como abrir

```bash
python3 -m http.server 8000
# depois abra http://localhost:8000
```

Para publicar, sirva a pasta como site estático (GitHub Pages, Netlify, Vercel ou a hospedagem do cliente).

## O que tem

- **Página inicial:** barra de avisos, banner rotativo, "Em alta", lançamentos, mosaico de categorias, mais vendidos, faixa da marca, outlet e newsletter.
- **Catálogo com 100 peças:** filtros por categoria, tamanho, cor, preço, promoção, linha (adulto ou plus size) e origem (importado ou nacional), ordenação e "carregar mais".
- **Produto:** galeria com 4 espaços de foto, cores, tamanhos com esgotados, guia de medidas, quantidade, cálculo de frete por CEP, "Adicionar ao carrinho" e "Comprar agora".
- **Carrinho** lateral com barra de frete grátis e preço no Pix.
- **Checkout próprio** com dados, endereço (preenchido pelo CEP via ViaCEP), opções de entrega (retirada na loja em SJC, PAC e SEDEX) e pagamento por Pix, cartão em até 6x ou boleto. Valida CPF, cartão e campos obrigatórios.
- **Confirmação do pedido**, "Meus pedidos", favoritos, busca com sugestões e páginas institucionais.
- **Painel do gestor** em `/admin`: produtos, fotos, tamanhos, estoque, preços e promoções (veja abaixo).
- **Oferta automática:** uma promoção marcada como "anunciar no site" vira um pop-up ao abrir a loja, uma vez por visita, e o primeiro slide do banner. Tudo sai sozinho no fim do prazo.

## Painel do gestor (`/admin`)

O dono da loja entra em `https://<endereço-da-loja>/admin/` com e-mail e senha. Lá ele faz:

- **Produtos:** cadastrar, editar, duplicar, esconder da loja ou excluir. Para cada peça: nome, categoria, linha, origem, descrição, preço, preço antigo, grade de tamanhos com a quantidade em estoque (0 = esgotado) e fotos por cor. As fotos enviadas são ajustadas sozinhas para 4:5 e comprimidas.
- **Promoções:** desconto em % (ou preço final) com data de início e fim. Promoção com início no futuro fica agendada e entra no ar sozinha. No fim do prazo, o preço volta ao normal.
- **Como funciona:** o passo a passo abaixo, dentro do próprio painel.

### Fluxo do gestor

1. **Atualiza a peça** em Produtos: preço, estoque, fotos. Ao salvar, a loja já mostra a versão nova.
2. **Cria a promoção**: ícone de etiqueta na peça, ou Promoções › Nova promoção. Escolhe o desconto e o período.
3. **Marca "Anunciar no site"**. A loja monta o aviso sozinha, com foto, preço antigo riscado, preço novo e prazo:
   - pop-up ao abrir o site, uma vez por visita;
   - primeiro slide do banner da página inicial;
   - etiqueta de oferta com o prazo na página do produto.
4. **Acompanha** em Promoções (no ar, agendadas, encerradas). "Encerrar agora" tira a oferta da loja na hora.

### Modo demonstração

Enquanto o Supabase não estiver configurado, o painel aceita qualquer e-mail e senha e grava **só no navegador** de quem está usando. Abra a loja no mesmo navegador para ver o resultado. Serve para mostrar o fluxo ao cliente, mas não vale para os visitantes.

## Conectar o banco de dados (Supabase)

1. Crie uma conta em **supabase.com** e um projeto novo (região **South America (São Paulo)**).
2. Em **SQL Editor**, cole e rode `supabase/schema.sql`. Depois rode `supabase/seed.sql` para carregar as 100 peças atuais (o estoque inicial é 5 por tamanho; ajuste no painel).
3. Em **Authentication › Users › Add user**, crie o usuário do dono da loja (e-mail e senha, marcando "Auto Confirm User").
4. Em **Authentication › Sign In / Providers**, desligue **"Allow new users to sign up"**.
5. No **SQL Editor**, autorize esse e-mail como gestor:
   ```sql
   insert into public.gestores (email, nome) values ('dono@ppoutlets.com.br', 'Dono da PP Outlets');
   ```
6. Em **Project Settings › API**, copie a **Project URL** e a chave **anon public** para `assets/js/supabase-config.js` e publique (o Netlify atualiza sozinho).

Pronto: o painel passa a gravar no banco e a loja lê de lá. A chave "anon" é pública por natureza, e quem protege os dados são as regras do banco (`schema.sql`): visitantes só leem; só os e-mails da tabela `gestores` alteram produtos, promoções e fotos. **Nunca** coloque a chave `service_role` no site.

Se o banco ficar fora do ar, a loja usa o catálogo de `assets/js/products.js` para não ficar vazia. Para gerar o `seed.sql` de novo a partir desse arquivo: `node supabase/gerar-seed.js`.

## Onde editar

| Arquivo | O que muda |
|---|---|
| `assets/js/config.js` | Desconto no Pix, parcelas, frete grátis, horário, Instagram, categorias e banners |
| `assets/js/products.js` | Catálogo inicial e reserva (com o Supabase ligado, os produtos são editados pelo painel) |
| `assets/js/supabase-config.js` | Endereço e chave pública do Supabase |
| `supabase/schema.sql` | Tabelas, regras de acesso e o bucket de fotos |
| `assets/css/styles.css` | Cores, fontes e layout |

**Fotos:** coloque os arquivos em `assets/img/produtos/` (formato 4:5, 1200x1500). Uma foto por cor: `"cores": [{"nome": "Branco", "hex": "#F7F7F5", "fotos": ["assets/img/produtos/x-branco.webp"]}]`, e a foto troca quando o cliente escolhe a cor. Fotos da peça inteira, iguais para todas as cores: `"fotos": [...]` no produto. Até 4 fotos por cor aparecem na galeria. Sem fotos, o site mostra o espaço reservado. Nos banners, preencha `imagem` em `config.js` (2400x1200, assunto no centro).

**Peças com foto real hoje:** Camiseta Oversized Essential (branco e café), Polo Nike Piquet, Tênis Nike Air Max Plus (3 cores), Calça Chino Zara, Boné Louis Vuitton Monogram Jeans e Jaqueta Nike Corta-Vento. Os preços dessas peças são sugestões a confirmar.

## Antes de vender de verdade

Este protótipo **não cobra**: o checkout grava o pedido só no navegador e mostra um aviso de demonstração. Para vender:

1. **Pagamentos:** conectar uma operadora (Mercado Pago, Pagar.me, PagSeguro ou Stripe) para Pix, cartão e boleto.
2. **Pedidos:** gravar os pedidos no Supabase e baixar o estoque a cada venda confirmada (as tabelas de produtos e promoções já estão prontas).
3. **Frete real:** integrar Correios ou Melhor Envio. Hoje os valores de frete são simulados pela região do CEP.
4. **E-mails** de confirmação e envio, nota fiscal e domínio próprio com HTTPS.

## Itens para o cliente confirmar

- Desconto no Pix (5%), parcelamento (6x sem juros, parcela mínima R$ 30) e frete grátis acima de R$ 299.
- Horário de atendimento, política de trocas (30 dias, primeira troca grátis) e endereço da loja.
- Tabela de medidas (valores de referência).
- Logo em SVG: o site usa uma marca provisória "PP" em texto.
- Produtos, preços e fotos: as 100 peças do catálogo são exemplos.
- Quantidades em estoque: o catálogo inicial usa 5 unidades por tamanho.
