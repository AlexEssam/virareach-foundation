import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, createAuthResponse, createErrorResponse } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { validateString, validateEmail, sanitizeString } from "../_shared/validation.ts";
import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";

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

    // Rate limiting
    const rateLimitResult = checkRateLimit(user.id, 30, 60000); // 30 requests per minute per user
    if (!rateLimitResult.allowed) {
      return createErrorResponse('Rate limit exceeded', 429, corsHeaders);
    }

    // Create Supabase client with anon key (user-specific operations)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (req.method === 'GET') {
      // Get user's Facebook accounts only
      const { data, error } = await supabaseClient
        .from('facebook_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return createErrorResponse('Failed to fetch accounts', 500, corsHeaders);
      }

      const headers = {
        ...corsHeaders,
        ...getRateLimitHeaders(rateLimitResult.resetTime!)
      };

      return createAuthResponse({ success: true, accounts: data }, 200, headers);
    }

    if (req.method === 'POST') {
      const { action, account_name, account_email, proxy_host, proxy_port, proxy_username, proxy_password, cookies } = await req.json();

      if (!action) {
        return createErrorResponse('Action is required', 400, corsHeaders);
      }

      if (action === 'add') {
        // Validate inputs
        const nameValidation = validateString(account_name, 'account_name', 100);
        const emailValidation = validateEmail(account_email);
        
        if (!nameValidation.isValid || !emailValidation.isValid) {
          const errors = [...nameValidation.errors, ...emailValidation.errors];
          return createErrorResponse(`Invalid input: ${errors.join(', ')}`, 400, corsHeaders);
        }

        const sanitizedName = sanitizeString(account_name);

        // Insert account with user_id
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
          return createErrorResponse('Failed to create account', 500, corsHeaders);
        }

        const headers = {
          ...corsHeaders,
          ...getRateLimitHeaders(rateLimitResult.resetTime!)
        };

        return createAuthResponse({ success: true, account: data }, 201, headers);
      }

      if (action === 'remove') {
        const { account_id } = await req.json();
        
        if (!account_id) {
          return createErrorResponse('Account ID is required', 400, corsHeaders);
        }

        const { error } = await supabaseClient
          .from('facebook_accounts')
          .delete()
          .eq('id', account_id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Database error:', error);
          return createErrorResponse('Failed to remove account', 500, corsHeaders);
        }

        const headers = {
          ...corsHeaders,
          ...getRateLimitHeaders(rateLimitResult.resetTime!)
        };

        return createAuthResponse({ success: true }, 200, headers);
      }

      if (action === 'update') {
        const { account_id, ...updateData } = await req.json();
        
        if (!account_id) {
          return createErrorResponse('Account ID is required', 400, corsHeaders);
        }

        // Validate account_name if provided
        if (updateData.account_name) {
          const nameValidation = validateString(updateData.account_name, 'account_name', 100);
          if (!nameValidation.isValid) {
            return createErrorResponse(`Invalid account name: ${nameValidation.errors.join(', ')}`, 400, corsHeaders);
          }
          updateData.account_name = sanitizeString(updateData.account_name);
        }

        // Validate account_email if provided
        if (updateData.account_email) {
          const emailValidation = validateEmail(updateData.account_email);
          if (!emailValidation.isValid) {
            return createErrorResponse(`Invalid email: ${emailValidation.errors.join(', ')}`, 400, corsHeaders);
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
          return createErrorResponse('Failed to update account', 500, corsHeaders);
        }

        const headers = {
          ...corsHeaders,
          ...getRateLimitHeaders(rateLimitResult.resetTime!)
        };

        return createAuthResponse({ success: true, account: data }, 200, headers);
      }

      return createErrorResponse('Invalid action', 400, corsHeaders);
    }

    return createErrorResponse('Method not allowed', 405, corsHeaders);
  } catch (error) {
    console.error('Function error:', error);
    return createErrorResponse('Internal server error', 500, corsHeaders);
  }
});