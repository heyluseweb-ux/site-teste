#!/usr/bin/env bash
# Faz uma consulta simples ao banco para o Supabase (plano gratuito) não pausar o projeto por inatividade.
# Lê o endereço e a chave pública do próprio site (assets/js/supabase-config.js); não precisa de segredo.
set -euo pipefail
CFG="${1:-assets/js/supabase-config.js}"
URL=$(grep -oE "url: *'[^']+'" "$CFG" | cut -d"'" -f2)
KEY=$(grep -oE "anonKey: *'[^']+'" "$CFG" | cut -d"'" -f2)
if [ -z "$URL" ] || [ -z "$KEY" ]; then echo "::error::Supabase não configurado em $CFG"; exit 1; fi
for tentativa in 1 2 3; do
  CODE=$(curl -sS -o /tmp/resposta.json -w '%{http_code}' --max-time 30 \
    "$URL/rest/v1/produtos?select=id&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" || echo 000)
  if [ "$CODE" = "200" ]; then echo "Supabase ativo (HTTP 200)."; exit 0; fi
  echo "Tentativa $tentativa: HTTP $CODE"; sleep 20
done
echo "::error::O banco da loja não respondeu (HTTP $CODE). Confira o projeto no painel do Supabase: ele pode estar pausado."
exit 1
