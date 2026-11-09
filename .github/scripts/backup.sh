#!/usr/bin/env bash
# Cópia de segurança do banco da loja e das fotos enviadas pelo painel, criptografada com senha.
# Precisa de dois segredos no GitHub (Settings > Secrets and variables > Actions):
#   SUPABASE_DB_URL  "Session pooler" do Supabase (Connect > Session pooler), com a senha do banco
#   BACKUP_SENHA     senha longa para criptografar o arquivo (guarde-a fora do GitHub)
set -euo pipefail
if [ -z "${SUPABASE_DB_URL:-}" ] || [ -z "${BACKUP_SENHA:-}" ]; then
  echo "::warning::Backup não configurado: crie os segredos SUPABASE_DB_URL e BACKUP_SENHA no GitHub."
  exit 0
fi
SAIDA="${1:-.}"
STAMP=$(date -u +%Y-%m-%d)
DIR=$(mktemp -d)
trap 'rm -rf "$DIR"' EXIT

pg_dump "$SUPABASE_DB_URL" --schema=public --schema=privado --no-owner --no-privileges --format=custom --file "$DIR/banco.dump"
pg_dump "$SUPABASE_DB_URL" --schema=public --schema=privado --no-owner --no-privileges --format=plain --file "$DIR/banco.sql"

psql "$SUPABASE_DB_URL" -At -c "select distinct f from public.produtos, jsonb_array_elements(cores) c, jsonb_array_elements_text(coalesce(c->'fotos', '[]'::jsonb)) f where f like 'https://%'" > "$DIR/fotos.txt"
mkdir -p "$DIR/fotos"
TOTAL=0; FALHAS=0
while IFS= read -r u; do
  [ -n "$u" ] || continue
  TOTAL=$((TOTAL + 1))
  NOME=$(printf '%s' "$u" | sed 's#.*/public/produtos/##; s#/#__#g')
  curl -fsS --retry 3 --max-time 60 -o "$DIR/fotos/$NOME" "$u" || { FALHAS=$((FALHAS + 1)); echo "$u" >> "$DIR/fotos-com-falha.txt"; }
done < "$DIR/fotos.txt"

tar -C "$DIR" -czf "$DIR.tar.gz" .
mkdir -p "$SAIDA"
gpg --batch --yes --pinentry-mode loopback --passphrase "$BACKUP_SENHA" --symmetric --cipher-algo AES256 \
  -o "$SAIDA/ppoutlets-backup-$STAMP.tar.gz.gpg" "$DIR.tar.gz"
rm -f "$DIR.tar.gz"
echo "Backup pronto: banco + $((TOTAL - FALHAS)) de $TOTAL fotos -> $SAIDA/ppoutlets-backup-$STAMP.tar.gz.gpg"
[ "$FALHAS" -eq 0 ] || echo "::warning::$FALHAS foto(s) não puderam ser baixadas (lista dentro do backup)."
