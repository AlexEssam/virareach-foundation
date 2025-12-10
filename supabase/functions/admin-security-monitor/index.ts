import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateRequest, createAuthResponse, createErrorResponse } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This function requires admin authentication
    const { user, error: authError } = await authenticateRequest(req)
    if (authError) {
      return createErrorResponse(authError, 401)
    }

    // Check if user is admin (you might want to add an admin role to users table)
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return createErrorResponse('Admin access required', 403)
    }

    if (req.method === 'GET') {
      const { type = 'security_events' } = new URL(req.url).searchParams

      if (type === 'security_events') {
        // Get recent security events
        const { data, error } = await supabaseAdmin
          .from('security_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) {
          return createErrorResponse('Failed to fetch security events', 500)
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (type === 'suspicious_activity') {
        // Get suspicious activity patterns
        const { data, error } = await supabaseAdmin
          .from('activity_logs')
          .select('*')
          .eq('is_suspicious', true)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          return createErrorResponse('Failed to fetch suspicious activity', 500)
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return createErrorResponse('Method not allowed', 405)
  } catch (error) {
    console.error('Security monitor error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})