import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, createAuthResponse, createErrorResponse } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(req);
    if (authError || !user) {
      return createErrorResponse(authError || 'Unauthorized', 401, corsHeaders);
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user is admin (you might want to add an admin role to users table)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return createErrorResponse('Admin access required', 403, corsHeaders);
    }

    if (req.method === 'GET') {
      const { type = 'security_events' } = new URL(req.url).searchParams;

      if (type === 'security_events') {
        // Get recent security events from audit_logs
        const { data, error } = await supabaseAdmin
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Failed to fetch security events', 500, corsHeaders);
        }

        return createAuthResponse({ success: true, data }, 200, corsHeaders);
      }

      if (type === 'user_activity') {
        // Get user activity summary
        const { data, error } = await supabaseAdmin
          .from('audit_logs')
          .select('user_id, action, created_at')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Failed to fetch user activity', 500, corsHeaders);
        }

        return createAuthResponse({ success: true, data }, 200, corsHeaders);
      }

      if (type === 'system_status') {
        // Get system status information
        const status = {
          timestamp: new Date().toISOString(),
          functions: 'operational',
          database: 'operational',
          authentication: 'operational',
          rate_limiting: 'active'
        };

        return createAuthResponse({ success: true, status }, 200, corsHeaders);
      }
    }

    return createErrorResponse('Method not allowed', 405, corsHeaders);
  } catch (error) {
    console.error('Security monitor error:', error);
    return createErrorResponse('Internal server error', 500, corsHeaders);
  }
});