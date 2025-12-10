import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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

    if (req.method === 'POST') {
      const { action, topic, tone, length, platform, product_name, audience, duration } = await req.json();
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "AI service not configured" }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!action) {
        return new Response(JSON.stringify({ error: "Action is required" }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`AI Text action: ${action}, user: ${user.id}`);

      let systemPrompt = "";
      let userPrompt = "";

      switch (action) {
        case "ai_writer":
          const topicValidation = validateString(topic, 'topic', 2000);
          if (!topicValidation.isValid) {
            return new Response(JSON.stringify({ error: `Invalid topic: ${topicValidation.errors.join(', ')}` }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          systemPrompt = "You are a professional content writer. Generate high-quality, engaging content based on the given topic, tone, and length requirements.";
          userPrompt = `Write content about: ${sanitizeString(topic)}\nTone: ${tone || 'professional'}\nLength: ${length || 'medium'} (short=100 words, medium=300 words, long=500+ words)`;
          break;

        case "post_writer":
          const postTopicValidation = validateString(topic, 'topic', 1000);
          if (!postTopicValidation.isValid) {
            return new Response(JSON.stringify({ error: `Invalid topic: ${postTopicValidation.errors.join(', ')}` }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          systemPrompt = `You are a social media expert specializing in ${platform || 'general'} content. Create engaging posts that drive engagement and fit the platform's style.`;
          userPrompt = `Create a ${platform || 'social media'} post about: ${sanitizeString(topic)}\n\nInclude relevant hashtags and emojis where appropriate.`;
          break;

        case "ad_copy":
          const productValidation = validateString(product_name, 'product_name', 100);
          const audienceValidation = validateString(audience, 'audience', 200);
          if (!productValidation.isValid || !audienceValidation.isValid) {
            const errors = [...productValidation.errors, ...audienceValidation.errors];
            return new Response(JSON.stringify({ error: `Invalid input: ${errors.join(', ')}` }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          systemPrompt = "You are an expert advertising copywriter. Create compelling ad copy that converts. Return the response in a structured format with headline, primary text, and call-to-action.";
          userPrompt = `Create ad copy for:\nProduct: ${sanitizeString(product_name)}\nTarget Audience: ${sanitizeString(audience || 'general')}\n\nProvide:\n1. Headline (max 40 chars)\n2. Primary Text (max 125 chars)\n3. Call-to-Action`;
          break;

        case "script_writer":
          const scriptValidation = validateString(topic, 'topic', 2000);
          if (!scriptValidation.isValid) {
            return new Response(JSON.stringify({ error: `Invalid topic: ${scriptValidation.errors.join(', ')}` }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          systemPrompt = "You are a professional video script writer. Create engaging scripts that capture attention and deliver the message effectively.";
          userPrompt = `Write a video script about: ${sanitizeString(topic)}\nDuration: ${duration || '60'} seconds\n\nInclude scene directions, dialogue, and timing notes.`;
          break;

        default:
          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error("AI gateway error:", response.status);
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      console.log(`${action} completed successfully`);

      return new Response(
        JSON.stringify({ success: true, result: text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error("Error in ai-text function:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});