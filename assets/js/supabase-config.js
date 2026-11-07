/* Conexão com o Supabase (banco de dados do estoque).
   Preencha com os dados do projeto em supabase.com > Project Settings > API:
   - url: "Project URL"
   - anonKey: a chave "anon public" (é pública por natureza: quem protege os dados são as regras do banco em supabase/schema.sql)
   Deixe em branco para usar o modo demonstração, em que o painel grava só no navegador. */
window.SUPABASE = {
  url: '',
  anonKey: '',
};
