import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...params } = await req.json();
    console.log(`Telegram extract action: ${action}`, params);

    switch (action) {
      case 'group_members': {
        const { group_link, include_hidden } = params;
        
        const { data, error } = await supabaseClient
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: include_hidden ? 'group_members_hidden' : 'group_members',
            source: group_link,
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        // Simulate extraction with mock data including last_seen
        const mockResults = Array.from({ length: 50 }, (_, i) => ({
          user_id: `user_${i + 1}`,
          username: `telegram_user_${i + 1}`,
          first_name: `User ${i + 1}`,
          last_name: Math.random() > 0.5 ? `Lastname ${i + 1}` : null,
          phone: include_hidden ? `+1234567${String(i).padStart(4, '0')}` : null,
          is_bot: false,
          is_premium: Math.random() > 0.7,
          last_seen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          last_seen_status: ['recently', 'within_week', 'within_month', 'long_ago', 'online'][Math.floor(Math.random() * 5)],
          bio: include_hidden && Math.random() > 0.5 ? `Bio of user ${i + 1}` : null,
          profile_photo: include_hidden ? `https://example.com/photo_${i + 1}.jpg` : null,
          restriction_reason: null,
          verified: Math.random() > 0.9
        }));

        await supabaseClient
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id);

        console.log(`Extracted ${mockResults.length} group members`);
        return new Response(JSON.stringify({ 
          extraction_id: data.id, 
          results: mockResults,
          count: mockResults.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'last_seen': {
        const { usernames, user_ids } = params;
        
        const { data, error } = await supabaseClient
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'last_seen',
            source: 'bulk_users',
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const targetUsers = usernames || user_ids || [];
        const mockResults = targetUsers.map((identifier: string, i: number) => ({
          identifier,
          user_id: `uid_${i + 1}`,
          username: identifier.startsWith('@') ? identifier : `@user_${i + 1}`,
          last_seen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          last_seen_status: ['online', 'recently', 'within_week', 'within_month', 'long_ago'][Math.floor(Math.random() * 5)],
          is_online: Math.random() > 0.8,
          last_online_duration: Math.floor(Math.random() * 24 * 60) // minutes
        }));

        await supabaseClient
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id);

        return new Response(JSON.stringify({ 
          extraction_id: data.id, 
          results: mockResults,
          count: mockResults.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'hidden_members_full': {
        const { group_link } = params;
        
        const { data, error } = await supabaseClient
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'hidden_members_full',
            source: group_link,
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        // Full hidden member info extraction
        const mockResults = Array.from({ length: 75 }, (_, i) => ({
          user_id: `hidden_${i + 1}`,
          username: Math.random() > 0.3 ? `hidden_user_${i + 1}` : null,
          first_name: `Hidden User ${i + 1}`,
          last_name: Math.random() > 0.4 ? `Lastname ${i + 1}` : null,
          phone: `+1234567${String(i).padStart(4, '0')}`,
          bio: Math.random() > 0.5 ? `This is the bio of hidden user ${i + 1}` : null,
          profile_photo_url: `https://example.com/hidden_photo_${i + 1}.jpg`,
          last_seen: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
          last_seen_status: ['recently', 'within_week', 'within_month', 'long_ago'][Math.floor(Math.random() * 4)],
          is_premium: Math.random() > 0.6,
          is_verified: Math.random() > 0.95,
          is_scam: false,
          is_fake: false,
          mutual_contacts_count: Math.floor(Math.random() * 10),
          common_groups_count: Math.floor(Math.random() * 5),
          join_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          admin_rights: Math.random() > 0.9 ? { can_post: true, can_edit: false } : null
        }));

        await supabaseClient
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id);

        console.log(`Extracted ${mockResults.length} full hidden members`);
        return new Response(JSON.stringify({ 
          extraction_id: data.id, 
          results: mockResults,
          count: mockResults.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'messenger_customers': {
        const { account_id, time_range, min_messages } = params;
        
        const { data, error } = await supabaseClient
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'messenger_customers',
            source: account_id,
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        // Extract customers who have messaged (potential leads)
        const mockResults = Array.from({ length: 80 }, (_, i) => ({
          user_id: `customer_${i + 1}`,
          username: Math.random() > 0.2 ? `customer_user_${i + 1}` : null,
          first_name: `Customer ${i + 1}`,
          last_name: Math.random() > 0.5 ? `CustLast ${i + 1}` : null,
          phone: Math.random() > 0.4 ? `+1234567${String(i).padStart(4, '0')}` : null,
          total_messages: Math.floor(Math.random() * 100) + (min_messages || 1),
          first_message_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
          last_message_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          response_rate: Math.random(),
          avg_response_time_minutes: Math.floor(Math.random() * 60),
          sentiment_score: Math.random() * 2 - 1, // -1 to 1
          is_potential_buyer: Math.random() > 0.3,
          tags: ['interested', 'lead', 'customer', 'support'][Math.floor(Math.random() * 4)],
          notes: Math.random() > 0.7 ? `Note for customer ${i + 1}` : null
        }));

        await supabaseClient
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results: mockResults,
            result_count: mockResults.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id);

        return new Response(JSON.stringify({ 
          extraction_id: data.id, 
          results: mockResults,
          count: mockResults.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'contacts_filtered': {
        const { account_id, phone_prefixes, country_codes, exclude_prefixes } = params;
        
        const { data, error } = await supabaseClient
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'contacts_filtered',
            source: account_id,
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        // Filter contacts by phone number patterns
        const allContacts = Array.from({ length: 200 }, (_, i) => {
          const countryCode = ['+1', '+44', '+91', '+49', '+33', '+81', '+86'][Math.floor(Math.random() * 7)];
          return {
            user_id: `contact_${i + 1}`,
            username: Math.random() > 0.3 ? `contact_user_${i + 1}` : null,
            first_name: `Contact ${i + 1}`,
            last_name: Math.random() > 0.5 ? `Lastname ${i + 1}` : null,
            phone: `${countryCode}${String(Math.floor(Math.random() * 10000000000)).padStart(10, '0')}`,
            country_code: countryCode,
            is_mutual: Math.random() > 0.5,
            added_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
          };
        });

        // Apply filters
        let filteredContacts = allContacts;
        if (phone_prefixes && phone_prefixes.length > 0) {
          filteredContacts = filteredContacts.filter(c => 
            phone_prefixes.some((prefix: string) => c.phone.startsWith(prefix))
          );
        }
        if (country_codes && country_codes.length > 0) {
          filteredContacts = filteredContacts.filter(c =>
            country_codes.includes(c.country_code)
          );
        }
        if (exclude_prefixes && exclude_prefixes.length > 0) {
          filteredContacts = filteredContacts.filter(c =>
            !exclude_prefixes.some((prefix: string) => c.phone.startsWith(prefix))
          );
        }

        await supabaseClient
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results: filteredContacts,
            result_count: filteredContacts.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id);

        return new Response(JSON.stringify({ 
          extraction_id: data.id, 
          results: filteredContacts,
          count: filteredContacts.length,
          total_before_filter: allContacts.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'chats': {
        const { account_id } = params;
        
        const { data, error } = await supabaseClient
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'chats',
            source: account_id,
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const mockChats = Array.from({ length: 30 }, (_, i) => ({
          chat_id: `chat_${i + 1}`,
          chat_name: `Chat ${i + 1}`,
          chat_type: ['private', 'group', 'supergroup', 'channel'][Math.floor(Math.random() * 4)],
          unread_count: Math.floor(Math.random() * 50),
          last_message_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }));

        await supabaseClient
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results: mockChats,
            result_count: mockChats.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id);

        return new Response(JSON.stringify({ 
          extraction_id: data.id, 
          results: mockChats,
          count: mockChats.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'contacts': {
        const { account_id } = params;
        
        const { data, error } = await supabaseClient
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'contacts',
            source: account_id,
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const mockContacts = Array.from({ length: 100 }, (_, i) => ({
          user_id: `contact_${i + 1}`,
          username: Math.random() > 0.3 ? `contact_user_${i + 1}` : null,
          first_name: `Contact ${i + 1}`,
          last_name: Math.random() > 0.5 ? `Lastname ${i + 1}` : null,
          phone: `+1234567${String(i).padStart(4, '0')}`
        }));

        await supabaseClient
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results: mockContacts,
            result_count: mockContacts.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id);

        return new Response(JSON.stringify({ 
          extraction_id: data.id, 
          results: mockContacts,
          count: mockContacts.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'archived': {
        const { account_id } = params;
        
        const { data, error } = await supabaseClient
          .from('telegram_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'archived',
            source: account_id,
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const mockArchived = Array.from({ length: 20 }, (_, i) => ({
          chat_id: `archived_${i + 1}`,
          chat_name: `Archived Chat ${i + 1}`,
          chat_type: ['private', 'group'][Math.floor(Math.random() * 2)],
          archived_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }));

        await supabaseClient
          .from('telegram_extractions')
          .update({
            status: 'completed',
            results: mockArchived,
            result_count: mockArchived.length,
            completed_at: new Date().toISOString()
          })
          .eq('id', data.id);

        return new Response(JSON.stringify({ 
          extraction_id: data.id, 
          results: mockArchived,
          count: mockArchived.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'history': {
        const { data, error } = await supabaseClient
          .from('telegram_extractions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return new Response(JSON.stringify({ extractions: data }), {
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
    console.error('Telegram extract error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
