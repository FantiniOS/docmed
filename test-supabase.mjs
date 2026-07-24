import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente ausentes.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔄 Testando conexão com Supabase...')
  
  // Testa a tabela familiares
  const { data, error } = await supabase.from('familiares').select('id').limit(1)
  
  if (error) {
    console.log('❌ Erro de conexão ou tabela ausente:')
    console.error(error.message)
  } else {
    console.log('✅ Conexão estabelecida e tabelas encontradas com sucesso!')
    console.log('Dados de teste:', data)
  }
}

testConnection()
