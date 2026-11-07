/* Conexão com o Supabase (banco de dados do estoque).
   - url: "Project URL" (supabase.com > Project Settings > API)
   - anonKey: a chave "anon public". Ela é pública por natureza: quem protege os dados são as regras
     do banco em supabase/schema.sql (visitantes só leem; só e-mails da tabela "gestores" alteram).
   Nunca coloque aqui a chave "service_role".
   Deixe os dois em branco para voltar ao modo demonstração, em que o painel grava só no navegador. */
window.SUPABASE = {
  url: 'https://hapywgozqrubjiaoaxuy.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcHl3Z296cXJ1YmppYW9heHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNDI1NjYsImV4cCI6MjEwOTYxODU2Nn0.x-XlIaQafC39N5HgwbTKU7NDctOqfeGOHnvoi3y2AVg',
};
