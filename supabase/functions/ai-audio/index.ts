import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, text, voice_id, audio_data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Processing ${action} request`);

    switch (action) {
      case "tts": {
        // Use Lovable AI to generate a script/description for the TTS
        // Note: For actual TTS, ElevenLabs integration would be recommended
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
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        const preparedText = data.choices?.[0]?.message?.content || text;

        return new Response(
          JSON.stringify({ 
            success: true, 
            result: preparedText,
            message: "Text prepared for TTS. For actual audio generation, please configure ElevenLabs API key."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "voice_clone": {
        // Voice cloning requires specialized services like ElevenLabs
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Voice cloning requires ElevenLabs API integration. Please configure your ElevenLabs API key in settings.",
            instructions: "To enable voice cloning: 1) Get an API key from elevenlabs.io 2) Add it to your project secrets 3) Upload a voice sample (at least 30 seconds)"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "audio_clean": {
        // Audio cleaning/enhancement guidance
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
          throw new Error(`AI gateway error: ${response.status}`);
        }

        const data = await response.json();
        const tips = data.choices?.[0]?.message?.content || "";

        return new Response(
          JSON.stringify({ 
            success: true, 
            result: tips,
            message: "Audio cleaning recommendations generated. For automatic audio cleaning, additional audio processing services would be needed."
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
