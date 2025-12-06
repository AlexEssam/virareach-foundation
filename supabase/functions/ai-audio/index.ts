import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { action, ...params } = await req.json();
    console.log(`Processing ${action} request`);

    // Helper function to get user's ElevenLabs API key
    const getUserApiKey = async (): Promise<string | null> => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('elevenlabs_api_key')
        .eq('id', user.id)
        .single();
      return profile?.elevenlabs_api_key || null;
    };

    switch (action) {
      case "save_api_key": {
        const { api_key } = params;
        if (!api_key) {
          return new Response(
            JSON.stringify({ error: "API key is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate API key with ElevenLabs
        const validateResponse = await fetch("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": api_key }
        });

        if (!validateResponse.ok) {
          return new Response(
            JSON.stringify({ error: "Invalid ElevenLabs API key" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Save API key to user's profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ elevenlabs_api_key: api_key })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        return new Response(
          JSON.stringify({ success: true, message: "API key saved successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "check_api_key": {
        const apiKey = await getUserApiKey();
        return new Response(
          JSON.stringify({ has_api_key: !!apiKey }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "voice_clone": {
        const { voice_name, voice_description, audio_base64, file_name } = params;
        
        if (!voice_name || !audio_base64) {
          return new Response(
            JSON.stringify({ error: "Voice name and audio sample are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const apiKey = await getUserApiKey();
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "ElevenLabs API key not configured. Please add your API key in settings." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Decode base64 audio
        const audioBytes = Uint8Array.from(atob(audio_base64), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });

        // Create FormData for ElevenLabs API
        const formData = new FormData();
        formData.append("name", voice_name);
        if (voice_description) {
          formData.append("description", voice_description);
        }
        formData.append("files", audioBlob, file_name || "sample.mp3");

        // Call ElevenLabs voice cloning API
        const cloneResponse = await fetch("https://api.elevenlabs.io/v1/voices/add", {
          method: "POST",
          headers: { "xi-api-key": apiKey },
          body: formData
        });

        if (!cloneResponse.ok) {
          const errorText = await cloneResponse.text();
          console.error("ElevenLabs clone error:", errorText);
          return new Response(
            JSON.stringify({ error: `Voice cloning failed: ${cloneResponse.status}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const cloneData = await cloneResponse.json();
        const voiceId = cloneData.voice_id;

        // Save custom voice to database
        const { error: insertError } = await supabase
          .from('custom_voices')
          .insert({
            user_id: user.id,
            name: voice_name,
            description: voice_description,
            elevenlabs_voice_id: voiceId,
            sample_file_name: file_name
          });

        if (insertError) {
          console.error("Database insert error:", insertError);
          // Try to delete the voice from ElevenLabs if DB insert fails
          await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
            method: "DELETE",
            headers: { "xi-api-key": apiKey }
          });
          throw insertError;
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Voice cloned successfully!",
            voice_id: voiceId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list_custom_voices": {
        const { data: voices, error } = await supabase
          .from('custom_voices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ voices: voices || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete_custom_voice": {
        const { voice_id } = params;
        
        if (!voice_id) {
          return new Response(
            JSON.stringify({ error: "Voice ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get the voice record
        const { data: voice, error: fetchError } = await supabase
          .from('custom_voices')
          .select('*')
          .eq('id', voice_id)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !voice) {
          return new Response(
            JSON.stringify({ error: "Voice not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const apiKey = await getUserApiKey();
        if (apiKey && voice.elevenlabs_voice_id) {
          // Delete from ElevenLabs
          try {
            await fetch(`https://api.elevenlabs.io/v1/voices/${voice.elevenlabs_voice_id}`, {
              method: "DELETE",
              headers: { "xi-api-key": apiKey }
            });
          } catch (e) {
            console.error("Failed to delete from ElevenLabs:", e);
          }
        }

        // Delete from database
        const { error: deleteError } = await supabase
          .from('custom_voices')
          .delete()
          .eq('id', voice_id)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        return new Response(
          JSON.stringify({ success: true, message: "Voice deleted successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "tts_generate": {
        const { text, voice_id } = params;
        
        if (!text || !voice_id) {
          return new Response(
            JSON.stringify({ error: "Text and voice ID are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const apiKey = await getUserApiKey();
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "ElevenLabs API key not configured. Please add your API key in settings." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Call ElevenLabs TTS API
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          console.error("ElevenLabs TTS error:", errorText);
          return new Response(
            JSON.stringify({ error: `TTS generation failed: ${ttsResponse.status}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Return audio as base64
        const audioBuffer = await ttsResponse.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

        return new Response(
          JSON.stringify({ 
            success: true, 
            audio_base64: base64Audio,
            content_type: "audio/mpeg"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "tts": {
        // Legacy TTS action - now requires API key
        const { text, voice_id } = params;
        
        const apiKey = await getUserApiKey();
        if (!apiKey) {
          // Fall back to Lovable AI for text preparation
          const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
          if (!LOVABLE_API_KEY) {
            return new Response(
              JSON.stringify({ error: "No API key configured" }),
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
                { role: "system", content: "You are a text preparation assistant. Clean and format the text for optimal text-to-speech conversion. Remove any special characters that might cause issues, fix punctuation for natural pauses, and return the cleaned text." },
                { role: "user", content: `Prepare this text for TTS: ${text}` },
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
            throw new Error(`AI gateway error: ${response.status}`);
          }

          const data = await response.json();
          const preparedText = data.choices?.[0]?.message?.content || text;

          return new Response(
            JSON.stringify({ 
              success: true, 
              result: preparedText,
              message: "Text prepared for TTS. Add your ElevenLabs API key in settings for actual audio generation."
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Use ElevenLabs with user's API key
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          console.error("ElevenLabs TTS error:", errorText);
          return new Response(
            JSON.stringify({ error: `TTS generation failed: ${ttsResponse.status}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

        return new Response(
          JSON.stringify({ 
            success: true, 
            audio_base64: base64Audio,
            content_type: "audio/mpeg",
            message: "Audio generated successfully!"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "voice_preview": {
        const { voice_id } = params;
        
        if (!voice_id) {
          return new Response(
            JSON.stringify({ error: "Voice ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const apiKey = await getUserApiKey();
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "ElevenLabs API key not configured. Please add your API key in settings." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch voice details from ElevenLabs to get preview_url
        const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/voices/${voice_id}`, {
          headers: { "xi-api-key": apiKey }
        });

        if (!voiceResponse.ok) {
          console.error("ElevenLabs voice fetch error:", voiceResponse.status);
          return new Response(
            JSON.stringify({ error: `Failed to fetch voice: ${voiceResponse.status}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const voiceData = await voiceResponse.json();
        const previewUrl = voiceData.preview_url;

        if (!previewUrl) {
          return new Response(
            JSON.stringify({ error: "No preview available for this voice" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch the actual audio from preview_url
        const audioResponse = await fetch(previewUrl);
        if (!audioResponse.ok) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch audio preview" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const audioBuffer = await audioResponse.arrayBuffer();
        const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

        return new Response(
          JSON.stringify({ 
            success: true, 
            audio_base64: audioBase64,
            content_type: "audio/mpeg"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "audio_clean": {
        // Audio cleaning guidance using Lovable AI
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
          throw new Error("LOVABLE_API_KEY is not configured");
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
              { role: "system", content: "You are an audio engineering expert. Provide detailed guidance on cleaning and enhancing audio quality." },
              { role: "user", content: "Provide tips and recommendations for cleaning audio: removing background noise, enhancing clarity, and improving overall quality. Format as a structured guide." },
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
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        const tips = data.choices?.[0]?.message?.content || "";

        return new Response(
          JSON.stringify({ 
            success: true, 
            result: tips,
            message: "Audio cleaning recommendations generated."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (error: unknown) {
    console.error("Error in ai-audio function:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
