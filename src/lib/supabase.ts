import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Country = {
  code: string
  name_en: string
  name_ar: string
  currency: string
  flag_emoji: string
  active: boolean
}

export type Search = {
  id: string
  user_id: string
  product_query: string
  country_code: string
  compare_country_code: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
}

export type SearchResult = {
  id: string
  search_id: string
  site_name: string
  product_name: string
  price: number
  currency: string
  product_url: string
  country_code: string
  created_at: string
}

export type Profile = {
  id: string
  full_name: string
  preferred_country: string
  preferred_language: string
  created_at: string
}
