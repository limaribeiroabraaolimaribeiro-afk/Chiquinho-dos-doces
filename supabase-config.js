// =========================================================
// Chiquinho dos Doces — Configuração do Supabase
// =========================================================
// 1. Crie um projeto em https://supabase.com
// 2. Rode o arquivo sql/supabase_schema.sql no SQL Editor do projeto
// 3. Copie a "Project URL" e a "anon public key" em
//    Project Settings → API e cole abaixo
// 4. Crie o usuário administrador em
//    Authentication → Users → Add user
// =========================================================

const SUPABASE_URL = 'COLE_AQUI_A_URL_DO_SEU_PROJETO_SUPABASE';
const SUPABASE_ANON_KEY = 'COLE_AQUI_A_CHAVE_ANON_PUBLICA';

const isSupabaseConfigured =
  typeof window.supabase !== 'undefined' &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('COLE_AQUI') &&
  !SUPABASE_ANON_KEY.includes('COLE_AQUI');

window.supabaseClient = isSupabaseConfigured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!window.supabaseClient) {
  console.warn(
    'Supabase não configurado ainda — edite supabase-config.js com a URL e a chave anônima do seu projeto. ' +
    'Até lá, o catálogo usa os produtos padrão e os pedidos só são enviados pelo WhatsApp.'
  );
}
