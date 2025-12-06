import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!TELEGRAM_BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing required environment variables");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Send message back to user via Telegram API
  async function sendTelegramMessage(chatId: number, text: string) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
          }),
        }
      );
      const result = await response.json();
      console.log("Telegram API response:", result);
      return result;
    } catch (error) {
      console.error("Error sending Telegram message:", error);
    }
  }

  try {
    const update = await req.json();
    console.log("Received Telegram update:", JSON.stringify(update));

    // Handle only message updates with text
    if (!update.message?.text) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();

    // Handle /start command
    if (text === "/start") {
      await sendTelegramMessage(
        chatId,
        `🚀 <b>Welcome to ViraReach Bot!</b>\n\n` +
        `This bot helps you securely register your Telegram API credentials.\n\n` +
        `<b>How to use:</b>\n` +
        `1. Generate a verification code in ViraReach\n` +
        `2. Send: <code>/register CODE API_ID API_HASH</code>\n\n` +
        `<b>Example:</b>\n` +
        `<code>/register VR-A1B2C3 12345678 0123456789abcdef0123456789abcdef</code>\n\n` +
        `Your credentials will be saved securely and used for Telegram features.`
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle /register command
    if (text.startsWith("/register")) {
      const parts = text.split(/\s+/);
      
      // Check format: /register CODE API_ID API_HASH
      if (parts.length !== 4) {
        await sendTelegramMessage(
          chatId,
          `❌ <b>Invalid format</b>\n\n` +
          `<b>Usage:</b> <code>/register CODE API_ID API_HASH</code>\n\n` +
          `<b>Example:</b>\n` +
          `<code>/register VR-A1B2C3 12345678 0123456789abcdef0123456789abcdef</code>`
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const [, code, apiId, apiHash] = parts;

      // Validate API ID format (5-12 digits)
      if (!/^\d{5,12}$/.test(apiId)) {
        await sendTelegramMessage(
          chatId,
          `❌ <b>Invalid API ID</b>\n\n` +
          `API ID should be a 5-12 digit number from my.telegram.org`
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate API Hash format (32 hex characters)
      if (!/^[a-f0-9]{32}$/i.test(apiHash)) {
        await sendTelegramMessage(
          chatId,
          `❌ <b>Invalid API Hash</b>\n\n` +
          `API Hash should be a 32-character hexadecimal string from my.telegram.org`
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find the verification code
      const { data: codeRecord, error: codeError } = await supabase
        .from("telegram_verification_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("used", false)
        .single();

      if (codeError || !codeRecord) {
        console.log("Code lookup error:", codeError);
        await sendTelegramMessage(
          chatId,
          `❌ <b>Verification code not found or expired</b>\n\n` +
          `Please generate a new code in ViraReach and try again.`
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if code is expired
      if (new Date(codeRecord.expires_at) < new Date()) {
        await sendTelegramMessage(
          chatId,
          `⏰ <b>Verification code expired</b>\n\n` +
          `Please generate a new code in ViraReach and try again.`
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update user's profile with API credentials
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          telegram_api_id: apiId,
          telegram_api_hash: apiHash,
        })
        .eq("id", codeRecord.user_id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        await sendTelegramMessage(
          chatId,
          `❌ <b>Error saving credentials</b>\n\n` +
          `Please try again or contact support.`
        );
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark code as used
      await supabase
        .from("telegram_verification_codes")
        .update({ used: true })
        .eq("id", codeRecord.id);

      await sendTelegramMessage(
        chatId,
        `✅ <b>API credentials saved successfully!</b>\n\n` +
        `Your Telegram API credentials have been registered with ViraReach.\n\n` +
        `You can now use Telegram features like:\n` +
        `• Extract group members\n` +
        `• Send messages\n` +
        `• Join groups\n\n` +
        `Return to ViraReach to start using these features.`
      );

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle unknown commands
    await sendTelegramMessage(
      chatId,
      `ℹ️ <b>Unknown command</b>\n\n` +
      `Use <code>/start</code> to see available commands or <code>/register</code> to register your API credentials.`
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing Telegram webhook:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
