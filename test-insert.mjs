
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  const payload = {
    nome: "Test User",
    data_nascimento: "2000-01-01"
  }
  const { data, error } = await supabase.from("familiares").insert([payload])
  console.log("Insert familiares:", data, error?.message)
}
testConnection()

