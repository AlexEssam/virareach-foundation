import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to generate mock data as fallback
function generateMockData(count: number, type: string): any[] {
  const mockUsers = [];
  const statuses = ['online', 'recently', 'within_week', 'within_month', 'long_time_ago', 'hidden'];
  
  for (let i = 0; i < count; i++) {
    const isPremium = Math.random() > 0.7;
    const hasUsername = Math.random() > 0.3;
    const hasPhone = Math.random() > 0.5;
    
    mockUsers.push({
      user_id: `mock_${Date.now()}_${i}`,
      username: hasUsername ? `user_${Math.random().toString(36).substring(7)}` : '',
      first_name: `User${i}`,
      last_name: `Test${i}`,
      phone: hasPhone ? `+1${Math.floor(1000000000 + Math.random() * 9000000000)}` : '',
      bio: Math.random() > 0.5 ? `Bio for user ${i}` : '',
      is_premium: isPremium,
      is_verified: Math.random() > 0.9,
      is_bot: false,
      profile_photo: Math.random() > 0.4,
      last_seen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_seen_status: statuses[Math.floor(Math.random() * statuses.length)],
    });
  }
  return mockUsers;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mtprotoProxyUrl = Deno.env.get('TELEGRAM_MTPROTO_PROXY_URL');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    const action = requestBody.action;
    // Support both { action, params: {...} } and { action, ...params } formats
    const params = requestBody.params || requestBody;
    console.log(`[telegram-extract] Action: ${action}, User: ${user.id}`);

    // Get account credentials
    let account: any = null;
    if (params?.account_id) {
      const { data } = await supabase
        .from('telegram_accounts')
        .select('*')
        .eq('id', params.account_id)
        .eq('user_id', user.id)
        .single();
      account = data;
    } else {
      const { data } = await supabase
        .from('telegram_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();
      account = data;
    }

    // If account doesn't have api_id/api_hash, try to get global credentials from profiles
    let apiId = account?.api_id;
    let apiHash = account?.api_hash;
    
    if ((!apiId || !apiHash) && user.id) {
      console.log(`[telegram-extract] Account missing API credentials, checking global settings...`);
      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_api_id, telegram_api_hash')
        .eq('id', user.id)
        .single();
      
      if (profile?.telegram_api_id && profile?.telegram_api_hash) {
        apiId = profile.telegram_api_id;
        apiHash = profile.telegram_api_hash;
        console.log(`[telegram-extract] Using global API credentials from profile`);
      }
    }

    // Helper function to validate session string
    // A valid GramJS session string is a long base64-encoded string (200+ characters)
    // It should NOT be JSON metadata like {"verified":true,"loginMethod":"qr"}
    function isValidSessionString(sessionData: any): boolean {
      if (!sessionData || typeof sessionData !== 'string') return false;
      // Check it's not JSON
      if (sessionData.trim().startsWith('{')) return false;
      // Valid session strings are typically 200+ characters
      if (sessionData.length < 100) return false;
      // Should be mostly alphanumeric/base64
      const base64Pattern = /^[A-Za-z0-9+/=]+$/;
      return base64Pattern.test(sessionData.trim());
    }

    const hasValidSession = isValidSessionString(account?.session_data);
    
    // Check if we can use real API (now using resolved apiId/apiHash)
    const canUseRealApi = mtprotoProxyUrl && 
      apiId && 
      apiHash && 
      hasValidSession;

    console.log(`[telegram-extract] Can use real API: ${canUseRealApi}, Proxy: ${mtprotoProxyUrl ? 'configured' : 'not configured'}, Account: ${account?.phone_number || 'none'}, API ID: ${apiId ? 'set' : 'missing'}, Valid Session: ${hasValidSession}`);
    
    if (account?.session_data && !hasValidSession) {
      console.log(`[telegram-extract] Session data exists but is invalid (likely metadata, not a real session string). Length: ${account.session_data?.length}, Starts with '{': ${account.session_data?.trim()?.startsWith('{')}`);
    }

    // Helper function to call MTProto proxy (uses resolved apiId/apiHash)
    async function callProxy(endpoint: string, body: any): Promise<any> {
      if (!mtprotoProxyUrl) throw new Error('MTProto proxy URL not configured');
      if (!apiId || !apiHash || !account?.session_data) {
        throw new Error('Missing API credentials or session');
      }
      
      console.log(`[telegram-extract] Calling proxy: ${mtprotoProxyUrl}${endpoint}`);
      
      const response = await fetch(`${mtprotoProxyUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiId: apiId,
          apiHash: apiHash,
          sessionString: account.session_data,
          ...body
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Proxy request failed: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch { }
        throw new Error(errorMessage);
      }
      
      return response.json();
    }

    switch (action) {
      case 'group_members': {
        const { group_link, limit = 200, include_hidden } = params;
        
        // Create extraction record
        const { data: extraction, error: insertError } = await supabase
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: include_hidden ? 'group_members_hidden' : 'group_members',
            source: group_link,
            status: 'processing',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        let results: any[] = [];
        let usingRealApi = false;
        let groupInfo = null;

        if (canUseRealApi) {
          try {
            console.log(`[telegram-extract] Calling real API for group: ${group_link}`);
            const proxyResult = await callProxy('/getParticipants', { 
              groupLink: group_link, 
              limit: Math.min(limit, 5000) 
            });
            results = proxyResult.participants || [];
            groupInfo = proxyResult.group;
            usingRealApi = true;
            console.log(`[telegram-extract] Real API returned ${results.length} participants`);
          } catch (proxyError: any) {
            console.error(`[telegram-extract] Proxy error, falling back to mock:`, proxyError.message);
            results = generateMockData(Math.min(limit, 100), 'group_members');
          }
        } else {
          console.log(`[telegram-extract] Using mock data (missing credentials or proxy)`);
          results = generateMockData(Math.min(limit, 100), 'group_members');
        }

        // Update extraction with results
        await supabase
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results: results,
            result_count: results.length,
            completed_at: new Date().toISOString(),
          })
          .eq('id', extraction.id);

        return new Response(JSON.stringify({ 
          success: true, 
          extraction_id: extraction.id,
          count: results.length,
          results,
          group: groupInfo,
          using_real_api: usingRealApi,
          message: usingRealApi 
            ? 'Extracted real data from Telegram' 
            : 'Using mock data. Configure API credentials and deploy MTProto proxy for real extraction.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'contacts': 
      case 'contacts_filtered': {
        const { phone_prefix, country_code, phone_prefixes, country_codes } = params;

        const { data: extraction, error: insertError } = await supabase
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'contacts',
            status: 'processing',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        let results: any[] = [];
        let usingRealApi = false;

        if (canUseRealApi) {
          try {
            console.log(`[telegram-extract] Calling real API for contacts`);
            const proxyResult = await callProxy('/getContacts', { 
              phonePrefix: phone_prefix || (phone_prefixes && phone_prefixes[0]), 
              countryCode: country_code || (country_codes && country_codes[0])
            });
            results = proxyResult.contacts || [];
            usingRealApi = true;
            console.log(`[telegram-extract] Real API returned ${results.length} contacts`);
          } catch (proxyError: any) {
            console.error(`[telegram-extract] Proxy error, falling back to mock:`, proxyError.message);
            results = generateMockData(50, 'contacts');
          }
        } else {
          results = generateMockData(50, 'contacts');
        }

        await supabase
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results,
            result_count: results.length,
            completed_at: new Date().toISOString(),
          })
          .eq('id', extraction.id);

        return new Response(JSON.stringify({ 
          success: true, 
          extraction_id: extraction.id,
          count: results.length,
          results,
          using_real_api: usingRealApi
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'chats': {
        const { limit = 100, archived = false } = params;

        const { data: extraction, error: insertError } = await supabase
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: archived ? 'archived_chats' : 'chats',
            status: 'processing',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        let results: any[] = [];
        let usingRealApi = false;

        if (canUseRealApi) {
          try {
            console.log(`[telegram-extract] Calling real API for chats`);
            const proxyResult = await callProxy('/getChats', { limit, archived });
            results = proxyResult.chats || [];
            usingRealApi = true;
          } catch (proxyError: any) {
            console.error(`[telegram-extract] Proxy error:`, proxyError.message);
            results = [];
          }
        }

        await supabase
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results,
            result_count: results.length,
            completed_at: new Date().toISOString(),
          })
          .eq('id', extraction.id);

        return new Response(JSON.stringify({ 
          success: true, 
          extraction_id: extraction.id,
          count: results.length,
          results,
          using_real_api: usingRealApi
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'archived': {
        return new Response(JSON.stringify({ 
          success: true, 
          count: 0,
          results: [],
          using_real_api: false,
          message: 'Archived chats extraction requires deployed MTProto proxy'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'last_seen': {
        const { user_ids, usernames } = params;

        let results: any[] = [];
        let usingRealApi = false;

        const targetIds = user_ids || usernames || [];

        if (canUseRealApi && targetIds.length > 0) {
          try {
            const proxyResult = await callProxy('/getLastSeen', { userIds: targetIds });
            results = proxyResult.users || [];
            usingRealApi = true;
          } catch (proxyError: any) {
            console.error(`[telegram-extract] Proxy error:`, proxyError.message);
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          results,
          using_real_api: usingRealApi
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'hidden_members_full': {
        const { group_link } = params;
        
        const { data: extraction, error: insertError } = await supabase
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'hidden_members_full',
            source: group_link,
            status: 'processing',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        let results: any[] = [];
        let usingRealApi = false;

        if (canUseRealApi) {
          try {
            const proxyResult = await callProxy('/getParticipants', { 
              groupLink: group_link, 
              limit: 1000 
            });
            results = proxyResult.participants || [];
            usingRealApi = true;
          } catch (proxyError: any) {
            console.error(`[telegram-extract] Proxy error:`, proxyError.message);
            results = generateMockData(75, 'hidden_members');
          }
        } else {
          results = generateMockData(75, 'hidden_members');
        }

        await supabase
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results,
            result_count: results.length,
            completed_at: new Date().toISOString(),
          })
          .eq('id', extraction.id);

        return new Response(JSON.stringify({ 
          success: true, 
          extraction_id: extraction.id,
          count: results.length,
          results,
          using_real_api: usingRealApi
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'messenger_customers': {
        const { time_range, min_messages } = params;

        const { data: extraction, error: insertError } = await supabase
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'messenger_customers',
            status: 'processing',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // This requires iterating through chats - use mock for now
        const results = generateMockData(80, 'customers');

        await supabase
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results,
            result_count: results.length,
            completed_at: new Date().toISOString(),
          })
          .eq('id', extraction.id);

        return new Response(JSON.stringify({ 
          success: true, 
          extraction_id: extraction.id,
          count: results.length,
          results,
          using_real_api: false,
          message: 'Customer extraction uses mock data. Deploy MTProto proxy for real data.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'validate_session': {
        let isValid = false;
        let userInfo = null;
        const sessionValid = isValidSessionString(account?.session_data);

        if (canUseRealApi) {
          try {
            const proxyResult = await callProxy('/validateSession', {});
            isValid = proxyResult.valid === true;
            userInfo = proxyResult.user;
          } catch (proxyError: any) {
            console.error(`[telegram-extract] Session validation error:`, proxyError.message);
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          valid: isValid,
          user: userInfo,
          has_credentials: !!(apiId && apiHash),
          has_session: !!account?.session_data,
          session_valid: sessionValid,
          session_issue: account?.session_data && !sessionValid 
            ? 'Session data is metadata, not a valid GramJS session string. Generate a real session using the Python script.'
            : null,
          has_proxy: !!mtprotoProxyUrl
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'history': {
        const { data: extractions, error } = await supabase
          .from('telegram_extractions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true, 
          extractions,
          proxy_configured: !!mtprotoProxyUrl,
          account_configured: !!(account?.api_id && account?.api_hash && account?.session_data)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: any) {
    console.error('[telegram-extract] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
