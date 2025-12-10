import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateRequest, createAuthResponse, createErrorResponse } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { validateString, validateEmail, sanitizeString } from '../_shared/validation.ts'
import { checkRateLimit, getRateLimitHeaders } from '../_shared/rate-limit.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
)

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate user
    const { user, error: authError } = await authenticateRequest(req)
    if (authError) {
      return createErrorResponse(authError, 401)
    }

    // Rate limiting
    const rateLimitResult = checkRateLimit(user.id, 30, 60000) // 30 requests per minute per user
    if (!rateLimitResult.allowed) {
      return createErrorResponse('Rate limit exceeded', 429)
    }

    if (req.method === 'GET') {
      // Get user's Facebook accounts only
      const { data, error } = await supabase
        .from('facebook_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database error:', error)
        return createErrorResponse('Failed to fetch accounts', 500)
      }

      const headers = {
        ...corsHeaders,
        ...getRateLimitHeaders(rateLimitResult.resetTime!)
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { 
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (req.method === 'POST') {
      const { account_name, email, password, cookies } = await req.json()

      // Validate inputs
      const nameValidation = validateString(account_name, 'account_name', 100)
      const emailValidation = validateEmail(email)
      
      if (!nameValidation.isValid || !emailValidation.isValid) {
        const errors = [...nameValidation.errors, ...emailValidation.errors]
        return createErrorResponse(`Invalid input: ${errors.join(', ')}`, 400)
      }

      const sanitizedName = sanitizeString(account_name)

      // Insert account with user_id
      const { data, error } = await supabase
        .from('facebook_accounts')
        .insert({
          user_id: user.id,
          account_name: sanitizedName,
          email: email.toLowerCase(),
          password: password, // Note: Consider encrypting this
          cookies: cookies,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return createErrorResponse('Failed to create account', 500)
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'facebook_account_added',
        details: { account_name: sanitizedName },
        created_at: new Date().toISOString()
      })

      const headers = {
        ...corsHeaders,
        ...getRateLimitHeaders(rateLimitResult.resetTime!)
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { 
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 201 
        }
      )
    }

    return createErrorResponse('Method not allowed', 405)
  } catch (error) {
    console.error('Function error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})