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

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...params } = await req.json();
    const proxyUrl = Deno.env.get("WHATSAPP_WEB_PROXY_URL");

    console.log(`[whatsapp-accounts] Action: ${action}, User: ${user.id}`);

    if (!proxyUrl) {
      return new Response(
        JSON.stringify({ 
          error: "WhatsApp proxy not configured. Please add WHATSAPP_WEB_PROXY_URL secret." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "generate_qr": {
        // Call proxy to generate QR code
        console.log(`[whatsapp-accounts] Generating QR code via proxy: ${proxyUrl}`);
        
        const response = await fetch(`${proxyUrl}/generateQR`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();
        
        if (!response.ok || !data.success) {
          console.error(`[whatsapp-accounts] Proxy error:`, data);
          return new Response(
            JSON.stringify({ error: data.error || "Failed to generate QR code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[whatsapp-accounts] QR generated, sessionId: ${data.sessionId}`);
        
        return new Response(
          JSON.stringify({
            success: true,
            sessionId: data.sessionId,
            qrCode: data.qrCode,
            state: data.state
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "check_status": {
        const { sessionId } = params;
        
        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: "Session ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const response = await fetch(`${proxyUrl}/status/${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: data.error || "Failed to check status" }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            sessionId: data.sessionId,
            state: data.state,
            phoneNumber: data.phoneNumber,
            pushName: data.pushName,
            qrCode: data.qrCode,
            error: data.error
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "save_session": {
        const { sessionId, phoneNumber, accountName, proxyHost, proxyPort, proxyUsername, proxyPassword } = params;
        
        if (!sessionId || !phoneNumber) {
          return new Response(
            JSON.stringify({ error: "Session ID and phone number required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Save to database
        const { data, error } = await supabase
          .from("whatsapp_accounts")
          .insert({
            user_id: user.id,
            phone_number: phoneNumber,
            account_name: accountName || phoneNumber,
            wa_session_id: sessionId,
            status: "connected",
            proxy_host: proxyHost || null,
            proxy_port: proxyPort || null,
            proxy_username: proxyUsername || null,
            proxy_password: proxyPassword || null
          })
          .select()
          .single();

        if (error) {
          console.error(`[whatsapp-accounts] Save error:`, error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[whatsapp-accounts] Account saved: ${data.id}`);

        return new Response(
          JSON.stringify({ success: true, account: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "validate_session": {
        const { accountId } = params;
        
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "Account ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get account from database
        const { data: account, error } = await supabase
          .from("whatsapp_accounts")
          .select("*")
          .eq("id", accountId)
          .eq("user_id", user.id)
          .single();

        if (error || !account) {
          return new Response(
            JSON.stringify({ error: "Account not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!account.wa_session_id) {
          return new Response(
            JSON.stringify({ success: true, valid: false, reason: "No session ID" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check with proxy
        const response = await fetch(`${proxyUrl}/validateSession`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: account.wa_session_id })
        });

        const data = await response.json();

        // Update status in database if not valid
        if (!data.valid && account.status === "connected") {
          await supabase
            .from("whatsapp_accounts")
            .update({ status: "disconnected" })
            .eq("id", accountId);
        }

        return new Response(
          JSON.stringify({
            success: true,
            valid: data.valid,
            state: data.state,
            phoneNumber: data.phoneNumber
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "disconnect": {
        const { accountId } = params;
        
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "Account ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get account from database
        const { data: account, error } = await supabase
          .from("whatsapp_accounts")
          .select("*")
          .eq("id", accountId)
          .eq("user_id", user.id)
          .single();

        if (error || !account) {
          return new Response(
            JSON.stringify({ error: "Account not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Disconnect from proxy if session exists
        if (account.wa_session_id) {
          try {
            await fetch(`${proxyUrl}/disconnect/${account.wa_session_id}`, {
              method: "POST"
            });
          } catch (e) {
            console.error(`[whatsapp-accounts] Proxy disconnect error:`, e);
          }
        }

        // Update database
        await supabase
          .from("whatsapp_accounts")
          .update({ status: "disconnected", wa_session_id: null })
          .eq("id", accountId);

        return new Response(
          JSON.stringify({ success: true, message: "Account disconnected" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_chats": {
        const { accountId, limit = 10 } = params;
        
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "Account ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get account from database
        const { data: account, error } = await supabase
          .from("whatsapp_accounts")
          .select("*")
          .eq("id", accountId)
          .eq("user_id", user.id)
          .single();

        if (error || !account) {
          return new Response(
            JSON.stringify({ error: "Account not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!account.wa_session_id) {
          return new Response(
            JSON.stringify({ error: "Account not connected" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get chats from proxy
        const response = await fetch(`${proxyUrl}/getChats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: account.wa_session_id, limit })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          return new Response(
            JSON.stringify({ error: data.error || "Failed to get chats" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, chats: data.chats, total: data.total }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reconnect": {
        const { accountId } = params;
        
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "Account ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get account from database
        const { data: account, error } = await supabase
          .from("whatsapp_accounts")
          .select("*")
          .eq("id", accountId)
          .eq("user_id", user.id)
          .single();

        if (error || !account) {
          return new Response(
            JSON.stringify({ error: "Account not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate new QR for reconnection
        const response = await fetch(`${proxyUrl}/generateQR`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();
        
        if (!response.ok || !data.success) {
          return new Response(
            JSON.stringify({ error: data.error || "Failed to generate QR code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update account with new session ID
        await supabase
          .from("whatsapp_accounts")
          .update({ wa_session_id: data.sessionId, status: "pending" })
          .eq("id", accountId);

        return new Response(
          JSON.stringify({
            success: true,
            sessionId: data.sessionId,
            qrCode: data.qrCode,
            state: data.state,
            accountId: accountId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_status": {
        const { accountId, status, sessionId } = params;
        
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "Account ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, unknown> = { status };
        if (sessionId) updateData.wa_session_id = sessionId;

        const { error } = await supabase
          .from("whatsapp_accounts")
          .update(updateData)
          .eq("id", accountId)
          .eq("user_id", user.id);

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("[whatsapp-accounts] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
