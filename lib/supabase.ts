import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getUser: async () => ({ data: { user: null }, error: { message: 'Missing Env Vars' } }),
        signInWithPassword: async () => ({ error: { message: 'Missing Env Vars' } }),
        signUp: async () => ({ error: { message: 'Missing Env Vars' } }),
      },
      from: () => ({
        select: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Missing Env Vars' } }) }) }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Missing Env Vars' } }) }) }),
        update: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Missing Env Vars' } }) }) }),
        delete: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Missing Env Vars' } }) }),
      }),
      rpc: async () => ({ error: { message: 'Missing Env Vars' } }),
    } as any
}
