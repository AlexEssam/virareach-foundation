import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS')?.split(',') || ['http://localhost:5173'],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

interface AuthenticatedUser {
  id: string
  email: string
  role: string
}

async function authenticateRequest(req: Request): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.substring(7)
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

function validateString(value: any, fieldName: string, maxLength: number = 1000): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`)
    return { isValid: false, errors }
  }
  
  if (value.length === 0) {
    errors.push(`${fieldName} cannot be empty`)
  }
  
  if (value.length > maxLength) {
    errors.push(`${fieldName} cannot exceed ${maxLength} characters`)
  }
  
  const xssPatterns = [/<script/i, /javascript:/i, /on\w+=/i]
  if (xssPatterns.some(pattern => pattern.test(value))) {
    errors.push(`${fieldName} contains potentially unsafe content`)
  }
  
  return { isValid: errors.length === 0, errors }
}

function validateEmail(email: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (typeof email !== 'string') {
    errors.push('Email must be a string')
    return { isValid: false, errors }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format')
  }
  
  return { isValid: errors.length === 0, errors }
}

function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user, error: authError } = await authenticateRequest(req);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: authError || 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (req.method === 'GET') {
      const { data, error } = await supabaseClient
        .from('facebook_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch accounts' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, accounts: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const { action, account_name, account_email, proxy_host, proxy_port, proxy_username, proxy_password, cookies } = await req.json();

      if (!action) {
        return new Response(JSON.stringify({ error: 'Action is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'add') {
        const nameValidation = validateString(account_name, 'account_name', 100);
        const emailValidation = validateEmail(account_email);
        
        if (!nameValidation.isValid || !emailValidation.isValid) {
          const errors = [...nameValidation.errors, ...emailValidation.errors];
          return new Response(JSON.stringify({ error: `Invalid input: ${errors.join(', ')}` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const sanitizedName = sanitizeString(account_name);

        const { data, error } = await supabaseClient
          .from('facebook_accounts')
          .insert({
            user_id: user.id,
            account_name: sanitizedName,
            account_email: account_email.toLowerCase(),
            proxy_host,
            proxy_port,
            proxy_username,
            proxy_password,
            cookies,
          })
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          return new Response(JSON.stringify({ error: 'Failed to create account' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, account: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'remove') {
        const { account_id } = await req.json();
        
        if (!account_id) {
          return new Response(JSON.stringify({ error: 'Account ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseClient
          .from('facebook_accounts')
          .delete()
          .eq('id', account_id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Database error:', error);
          return new Response(JSON.stringify({ error: 'Failed to remove account' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update') {
        const { account_id, ...updateData } = await req.json();
        
        if (!account_id) {
          return new Response(JSON.stringify({ error: 'Account ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (updateData.account_name) {
          const nameValidation = validateString(updateData.account_name, 'account_name', 100);
          if (!nameValidation.isValid) {
            return new Response(JSON.stringify({ error: `Invalid account name: ${nameValidation.errors.join(', ')}` }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          updateData.account_name = sanitizeString(updateData.account_name);
        }

        if (updateData.account_email) {
          const emailValidation = validateEmail(updateData.account_email);
          if (!emailValidation.isValid) {
            return new Response(JSON.stringify({ error: `Invalid email: ${emailValidation.errors.join(', ')}` }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          updateData.account_email = updateData.account_email.toLowerCase();
        }

        const { data, error } = await supabaseClient
          .from('facebook_accounts')
          .update(updateData)
          .eq('id', account_id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          return new Response(JSON.stringify({ error: 'Failed to update account' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, account: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});