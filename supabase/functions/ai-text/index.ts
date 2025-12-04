import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, topic, tone, length, platform, product_name, audience, duration } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`AI Text action: ${action}, user: ${user.id}`);

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "ai_writer":
        systemPrompt = "You are a professional content writer. Generate high-quality, engaging content based on the given topic, tone, and length requirements.";
        userPrompt = `Write content about: ${topic}\nTone: ${tone || 'professional'}\nLength: ${length || 'medium'} (short=100 words, medium=300 words, long=500+ words)`;
        break;

      case "post_writer":
        systemPrompt = `You are a social media expert specializing in ${platform || 'general'} content. Create engaging posts that drive engagement and fit the platform's style.`;
        userPrompt = `Create a ${platform || 'social media'} post about: ${topic}\n\nInclude relevant hashtags and emojis where appropriate.`;
        break;

      case "ad_copy":
        systemPrompt = "You are an expert advertising copywriter. Create compelling ad copy that converts. Return the response in a structured format with headline, primary text, and call-to-action.";
        userPrompt = `Create ad copy for:\nProduct: ${product_name}\nTarget Audience: ${audience || 'general'}\n\nProvide:\n1. Headline (max 40 chars)\n2. Primary Text (max 125 chars)\n3. Call-to-Action`;
        break;

      case "script_writer":
        systemPrompt = "You are a professional video script writer. Create engaging scripts that capture attention and deliver the message effectively.";
        userPrompt = `Write a video script about: ${topic}\nDuration: ${duration || '60'} seconds\n\nInclude scene directions, dialogue, and timing notes.`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    console.log(`${action} completed successfully`);

    return new Response(
      JSON.stringify({ success: true, result: text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in ai-text function:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
