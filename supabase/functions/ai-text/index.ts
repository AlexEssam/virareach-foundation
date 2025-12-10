import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { authenticateRequest, createAuthResponse, createErrorResponse } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { validateString, sanitizeString } from "../_shared/validation.ts";
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
    const rateLimitResult = checkRateLimit(user.id, 50, 60000); // 50 requests per minute per user
    if (!rateLimitResult.allowed) {
      return createErrorResponse('Rate limit exceeded', 429, corsHeaders);
    }

    if (req.method === 'POST') {
      const { action, topic, tone, length, platform, product_name, audience, duration } = await req.json();
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

      if (!LOVABLE_API_KEY) {
        return createErrorResponse("AI service not configured", 500, corsHeaders);
      }

      // Validate inputs
      if (!action) {
        return createErrorResponse("Action is required", 400, corsHeaders);
      }

      console.log(`AI Text action: ${action}, user: ${user.id}`);

      let systemPrompt = "";
      let userPrompt = "";

      switch (action) {
        case "ai_writer":
          const topicValidation = validateString(topic, 'topic', 2000);
          if (!topicValidation.isValid) {
            return createErrorResponse(`Invalid topic: ${topicValidation.errors.join(', ')}`, 400, corsHeaders);
          }
          systemPrompt = "You are a professional content writer. Generate high-quality, engaging content based on the given topic, tone, and length requirements.";
          userPrompt = `Write content about: ${sanitizeString(topic)}\nTone: ${tone || 'professional'}\nLength: ${length || 'medium'} (short=100 words, medium=300 words, long=500+ words)`;
          break;

        case "post_writer":
          const postTopicValidation = validateString(topic, 'topic', 1000);
          if (!postTopicValidation.isValid) {
            return createErrorResponse(`Invalid topic: ${postTopicValidation.errors.join(', ')}`, 400, corsHeaders);
          }
          systemPrompt = `You are a social media expert specializing in ${platform || 'general'} content. Create engaging posts that drive engagement and fit the platform's style.`;
          userPrompt = `Create a ${platform || 'social media'} post about: ${sanitizeString(topic)}\n\nInclude relevant hashtags and emojis where appropriate.`;
          break;

        case "ad_copy":
          const productValidation = validateString(product_name, 'product_name', 100);
          const audienceValidation = validateString(audience, 'audience', 200);
          if (!productValidation.isValid || !audienceValidation.isValid) {
            const errors = [...productValidation.errors, ...audienceValidation.errors];
            return createErrorResponse(`Invalid input: ${errors.join(', ')}`, 400, corsHeaders);
          }
          systemPrompt = "You are an expert advertising copywriter. Create compelling ad copy that converts. Return the response in a structured format with headline, primary text, and call-to-action.";
          userPrompt = `Create ad copy for:\nProduct: ${sanitizeString(product_name)}\nTarget Audience: ${sanitizeString(audience || 'general')}\n\nProvide:\n1. Headline (max 40 chars)\n2. Primary Text (max 125 chars)\n3. Call-to-Action`;
          break;

        case "script_writer":
          const scriptValidation = validateString(topic, 'topic', 2000);
          if (!scriptValidation.isValid) {
            return createErrorResponse(`Invalid topic: ${scriptValidation.errors.join(', ')}`, 400, corsHeaders);
          }
          systemPrompt = "You are a professional video script writer. Create engaging scripts that capture attention and deliver the message effectively.";
          userPrompt = `Write a video script about: ${sanitizeString(topic)}\nDuration: ${duration || '60'} seconds\n\nInclude scene directions, dialogue, and timing notes.`;
          break;

        default:
          return createErrorResponse("Invalid action", 400, corsHeaders);
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
          return createErrorResponse("Rate limit exceeded. Please try again later.", 429, corsHeaders);
        }
        if (response.status === 402) {
          return createErrorResponse("AI credits exhausted. Please add more credits.", 402, corsHeaders);
        }
        console.error("AI gateway error:", response.status);
        return createErrorResponse("AI service temporarily unavailable", 503, corsHeaders);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      console.log(`${action} completed successfully`);

      const headers = {
        ...corsHeaders,
        ...getRateLimitHeaders(rateLimitResult.resetTime!)
      };

      return createAuthResponse({ success: true, result: text }, 200, headers);
    }

    return createErrorResponse("Method not allowed", 405, corsHeaders);
  } catch (error: unknown) {
    console.error("Error in ai-text function:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return createErrorResponse(errorMessage, 500, corsHeaders);
  }
});