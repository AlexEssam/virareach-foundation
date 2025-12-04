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

    const { action, prompt, image, model, size, strength, style_id, count, mask, scale } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`AI Image action: ${action}, user: ${user.id}`);

    switch (action) {
      case 'generate_image': {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{ role: 'user', content: prompt }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
              status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          if (response.status === 402) {
            return new Response(JSON.stringify({ error: 'Credits exhausted. Please add more credits.' }), {
              status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        return new Response(JSON.stringify({ 
          image_url: imageUrl,
          meta: { model: 'gemini-2.5-flash-image-preview', prompt }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'image_to_image': {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: prompt || 'Transform this image creatively' },
                { type: 'image_url', image_url: { url: image } }
              ]
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);
        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        return new Response(JSON.stringify({ image_url: imageUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sketch_to_image': {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: `Convert this sketch into a detailed, realistic image: ${prompt || ''}` },
                { type: 'image_url', image_url: { url: image } }
              ]
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);
        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        return new Response(JSON.stringify({ image_url: imageUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'style_transfer': {
        const stylePrompts: Record<string, string> = {
          'oil_painting': 'Transform this image into an oil painting style with rich textures and brushstrokes',
          'watercolor': 'Convert this image to a beautiful watercolor painting style',
          'pencil_sketch': 'Transform this into a detailed pencil sketch drawing',
          'anime': 'Convert this image to anime/manga art style',
          'pop_art': 'Transform this into vibrant pop art style like Andy Warhol',
          'cyberpunk': 'Convert this to futuristic cyberpunk aesthetic',
          'vintage': 'Apply a vintage/retro film photography style',
          'minimalist': 'Transform into a clean minimalist illustration',
        };

        const stylePrompt = stylePrompts[style_id] || `Apply ${style_id} style to this image`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: stylePrompt },
                { type: 'image_url', image_url: { url: image } }
              ]
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);
        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        return new Response(JSON.stringify({ styled_image_url: imageUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'variations': {
        const variations = [];
        const numVariations = Math.min(count || 2, 4);
        
        for (let i = 0; i < numVariations; i++) {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [{
                role: 'user',
                content: [
                  { type: 'text', text: `Create a unique creative variation of this image. Variation ${i + 1} of ${numVariations}.` },
                  { type: 'image_url', image_url: { url: image } }
                ]
              }],
              modalities: ['image', 'text'],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (imageUrl) variations.push(imageUrl);
          }
        }
        
        return new Response(JSON.stringify({ images: variations }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'inpainting': {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: `Edit this image: ${prompt}. Fill in or modify the marked areas naturally.` },
                { type: 'image_url', image_url: { url: image } }
              ]
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);
        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        return new Response(JSON.stringify({ result_image_url: imageUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'upscale': {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: 'Enhance and upscale this image to higher quality with more detail and clarity. Make it sharper and cleaner.' },
                { type: 'image_url', image_url: { url: image } }
              ]
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);
        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        return new Response(JSON.stringify({ upscaled_image_url: imageUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'face_enhance': {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: 'Enhance the faces in this image. Improve facial details, skin quality, and overall appearance while keeping it natural looking.' },
                { type: 'image_url', image_url: { url: image } }
              ]
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);
        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        return new Response(JSON.stringify({ enhanced_face_image: imageUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'batch_generate': {
        const images = [];
        const numImages = Math.min(count || 4, 6);
        
        for (let i = 0; i < numImages; i++) {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [{ role: 'user', content: `${prompt} (variation ${i + 1})` }],
              modalities: ['image', 'text'],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (imageUrl) images.push(imageUrl);
          }
        }
        
        return new Response(JSON.stringify({ images }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    console.error('AI Image error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
