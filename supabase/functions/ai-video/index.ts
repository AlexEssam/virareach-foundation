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
    console.log('Auth header present:', !!authHeader);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader || '' } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    console.log('Auth result - user:', user?.id, 'error:', authError?.message);
    
    if (authError || !user) {
      console.error('Auth failed:', authError?.message || 'No user');
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, prompt, image, duration, motion_style, source_video, target_video, audio, video, new_face_image, resolution } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`AI Video action: ${action}, user: ${user.id}`);

    // Helper function to extract image from response
    const extractImage = (data: any): string | null => {
      // Check various response formats
      const message = data.choices?.[0]?.message;
      if (message?.images?.[0]?.image_url?.url) {
        return message.images[0].image_url.url;
      }
      if (message?.content && typeof message.content === 'string') {
        // Check if content contains base64 image
        const base64Match = message.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (base64Match) return base64Match[0];
      }
      // Check for inline_data format
      if (message?.content && Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === 'image' && part.image_url?.url) {
            return part.image_url.url;
          }
        }
      }
      return null;
    };

    switch (action) {
      case 'generate_video': {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{ 
              role: 'user', 
              content: `Create a detailed visual storyboard frame for this video concept: "${prompt}". Generate a single high-quality key frame image that represents this video scene. Ultra detailed, cinematic, professional quality.`
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
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
        console.log('Generate video response:', JSON.stringify(data).slice(0, 500));
        
        const imageUrl = extractImage(data);
        const textResponse = data.choices?.[0]?.message?.content;
        
        return new Response(JSON.stringify({ 
          video_url: imageUrl,
          storyboard: typeof textResponse === 'string' ? textResponse : null,
          meta: { model: 'gemini-2.5-flash-image', prompt, duration: duration || '5s' }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'image_to_video': {
        const motionPrompts: Record<string, string> = {
          'zoom_in': 'Create an animated version of this image with a smooth zoom-in effect, focusing on the center.',
          'zoom_out': 'Create an animated version showing a zoom-out effect, revealing more of the scene.',
          'pan_left': 'Create a smooth panning motion from right to left across this image.',
          'pan_right': 'Create a smooth panning motion from left to right across this image.',
          'rotate': 'Create a gentle rotation animation of this image.',
          'parallax': 'Create a parallax depth effect with subtle layer movements.',
          'morph': 'Create a morphing transformation of the key elements in this image.',
          'pulse': 'Create a subtle pulsing/breathing animation effect.',
        };

        const motionPrompt = motionPrompts[motion_style] || `Apply ${motion_style} motion effect to this image`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: `${motionPrompt}. Generate the next frame in the animation sequence. High quality, smooth transition.` },
                { type: 'image_url', image_url: { url: image } }
              ]
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          throw new Error(`AI gateway error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Image to video response:', JSON.stringify(data).slice(0, 500));
        
        const imageUrl = extractImage(data);
        
        return new Response(JSON.stringify({ 
          video_url: imageUrl,
          motion_style,
          frames: [image, imageUrl].filter(Boolean)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'motion_sync': {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze the motion pattern from this source and create a visualization that syncs with this motion style. Generate a high quality result.' },
                { type: 'image_url', image_url: { url: source_video } }
              ]
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          throw new Error(`AI gateway error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Motion sync response:', JSON.stringify(data).slice(0, 500));
        
        const imageUrl = extractImage(data);
        
        return new Response(JSON.stringify({ video_url: imageUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'lip_sync': {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: 'Create a variation of this face/portrait with the mouth slightly open as if speaking. Make it look natural and keep all other features identical. High quality output.' },
                { type: 'image_url', image_url: { url: image } }
              ]
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          throw new Error(`AI gateway error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Lip sync response:', JSON.stringify(data).slice(0, 500));
        
        const imageUrl = extractImage(data);
        
        return new Response(JSON.stringify({ 
          video_url: imageUrl,
          frames: [image, imageUrl].filter(Boolean)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'replace_character': {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: 'Replace the main character/face in this scene with the face from the reference image while keeping the same pose, lighting, and scene context. High quality, realistic result.' },
                { type: 'image_url', image_url: { url: video } },
                { type: 'image_url', image_url: { url: new_face_image } }
              ]
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          throw new Error(`AI gateway error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Replace character response:', JSON.stringify(data).slice(0, 500));
        
        const imageUrl = extractImage(data);
        
        return new Response(JSON.stringify({ video_url: imageUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'video_upscale': {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: `Enhance and upscale this image to ${resolution || '4K'} quality. Add more detail, improve sharpness, and enhance overall visual quality while preserving the original content. Ultra high resolution output.` },
                { type: 'image_url', image_url: { url: video } }
              ]
            }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          throw new Error(`AI gateway error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Video upscale response:', JSON.stringify(data).slice(0, 500));
        
        const imageUrl = extractImage(data);
        
        return new Response(JSON.stringify({ 
          video_url: imageUrl,
          resolution: resolution || '4K'
        }), {
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
    console.error('AI Video error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
