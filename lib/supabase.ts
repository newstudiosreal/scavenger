import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getUser: async () => ({ data: { user: null }, error: { message: 'Missing Supabase Env Vars' } }),
        signInWithPassword: async () => ({ error: { message: 'Missing Supabase Env Vars' } }),
        signUp: async () => ({ error: { message: 'Missing Supabase Env Vars' } }),
      },
      from: () => ({
        select: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Missing Supabase Env Vars' } }) }) }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Missing Supabase Env Vars' } }) }) }),
        update: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Missing Supabase Env Vars' } }) }) }),
        delete: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Missing Supabase Env Vars' } }) }),
      }),
      rpc: async () => ({ error: { message: 'Missing Supabase Env Vars' } })
    } as any;
