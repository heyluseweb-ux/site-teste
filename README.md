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

## Onde editar

| Arquivo | O que muda |
|---|---|
| `assets/js/config.js` | Desconto no Pix, parcelas, frete grátis, horário, Instagram, categorias e banners |
| `assets/js/products.js` | As 100 peças: nome, preço, preço antigo, cores, tamanhos, esgotados, fotos |
| `assets/css/styles.css` | Cores, fontes e layout |

**Fotos:** coloque os arquivos em `assets/img/produtos/` e adicione em cada peça `"fotos": ["assets/img/produtos/PP-001-1.webp", ...]` (até 4, formato 4:5, 1200x1500). Sem fotos, o site mostra o espaço reservado. Nos banners, preencha `imagem` em `config.js` (1920x720).

## Antes de vender de verdade

Este protótipo **não cobra**: o checkout grava o pedido só no navegador e mostra um aviso de demonstração. Para vender:

1. **Pagamentos:** conectar uma operadora (Mercado Pago, Pagar.me, PagSeguro ou Stripe) para Pix, cartão e boleto.
2. **Pedidos e estoque:** um back-end ou uma plataforma (Nuvemshop, Shopify, Tray) para guardar pedidos, baixar estoque e avisar o lojista.
3. **Frete real:** integrar Correios ou Melhor Envio. Hoje os valores de frete são simulados pela região do CEP.
4. **E-mails** de confirmação e envio, nota fiscal e domínio próprio com HTTPS.

## Itens para o cliente confirmar

- Desconto no Pix (5%), parcelamento (6x sem juros, parcela mínima R$ 30) e frete grátis acima de R$ 299.
- Horário de atendimento, política de trocas (30 dias, primeira troca grátis) e endereço da loja.
- Tabela de medidas (valores de referência).
- Logo em SVG: o site usa uma marca provisória "PP" em texto.
- Produtos, preços e fotos: as 100 peças do catálogo são exemplos.
