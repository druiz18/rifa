import { createClient } from '@supabase/supabase-js'
import type {Database} from './database.types' // <- Aquí conectamos los tipos que vamos a generar

// Creamos el cliente pasándole el tipo "Database"
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)