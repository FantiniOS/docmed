
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function testConnection() {
  const { data: d1, error: e1 } = await supabase.from("familiares").select("*")
  console.log("familiares:", d1?.length, e1?.message)

  const { data: d2, error: e2 } = await supabase.from("pacientes").select("*")
  console.log("pacientes:", d2?.length, e2?.message)
}
testConnection()

