import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with explicit session persistence and better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Enable session persistence
    autoRefreshToken: true, // Automatically refresh tokens
    detectSessionInUrl: true, // Detect session from URL (for email verification)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined, // Use localStorage for session storage
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'flowva-hub@1.0.0',
    },
  },
})

// Helper function to retry database operations
export const retryQuery = async (queryFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await queryFn()
      if (result.error && result.error.code !== 'PGRST116') {
        throw result.error
      }
      return result
    } catch (error) {
      console.error(`Query attempt ${i + 1} failed:`, error)
      if (i === maxRetries - 1) {
        throw error
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
}

// Helper function to verify session before queries
export const verifySession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Session verification error:', error)
      return null
    }
    if (!session) {
      console.warn('No active session found')
      return null
    }
    return session
  } catch (error) {
    console.error('Error verifying session:', error)
    return null
  }
}







