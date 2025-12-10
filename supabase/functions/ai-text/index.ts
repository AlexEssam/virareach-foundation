import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateRequest, createAuthResponse, createErrorResponse } from '../_shared/auth.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { validateString, sanitizeString } from '../_shared/validation.ts'
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
    const rateLimitResult = checkRateLimit(user.id, 50, 60000) // 50 requests per minute per user
    if (!rateLimitResult.allowed) {
      return createErrorResponse('Rate limit exceeded', 429)
    }

    if (req.method === 'POST') {
      const { prompt, model = 'gpt-3.5-turbo', max_tokens = 1000 } = await req.json()

      // Validate input
      const promptValidation = validateString(prompt, 'prompt', 4000)
      if (!promptValidation.isValid) {
        return createErrorResponse(`Invalid input: ${promptValidation.errors.join(', ')}`, 400)
      }

      const sanitizedPrompt = sanitizeString(prompt)

      // Check user credits/points
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single()

      if (userError || !userData || userData.credits < 1) {
        return createErrorResponse('Insufficient credits', 403)
      }

      // Call AI API (securely)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: sanitizedPrompt }],
          max_tokens,
        }),
      })

      if (!response.ok) {
        console.error('AI API error:', await response.text())
        return createErrorResponse('AI service temporarily unavailable', 503)
      }

      const result = await response.json()

      // Deduct credits
      const { error: creditError } = await supabase
        .from('users')
        .update({ credits: userData.credits - 1 })
        .eq('id', user.id)

      if (creditError) {
        console.error('Credit deduction error:', creditError)
      }

      // Log usage
      await supabase.from('usage_logs').insert({
        user_id: user.id,
        service: 'ai-text',
        credits_used: 1,
        created_at: new Date().toISOString()
      })

      const headers = {
        ...corsHeaders,
        ...getRateLimitHeaders(rateLimitResult.resetTime!)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: result.choices[0].message.content 
        }),
        { 
          headers: { ...headers, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return createErrorResponse('Method not allowed', 405)
  } catch (error) {
    console.error('Function error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})