import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AuthenticatedUser {
  id: string
  email: string
  role: string
}

export async function authenticateRequest(req: Request): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.substring(7)

    // Create Supabase client with service role key for token verification
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the JWT token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' }
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        role: user.role || 'authenticated'
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

export function createAuthResponse(data: any, status: number = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    headers: { ...headers, 'Content-Type': 'application/json' },
    status
  })
}

export function createErrorResponse(message: string, status: number = 400, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: message }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
    status
  })
}