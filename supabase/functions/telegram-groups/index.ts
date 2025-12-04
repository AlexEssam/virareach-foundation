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
    console.log(`Telegram groups action: ${action}`, params);

    switch (action) {
      case 'list': {
        const { data, error } = await supabaseClient
          .from('telegram_groups')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ groups: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'join': {
        const { invite_link, account_id } = params;
        
        // Simulate joining a group
        const mockGroup = {
          group_id: `group_${Date.now()}`,
          group_name: `Group from ${invite_link}`,
          group_type: 'supergroup',
          member_count: Math.floor(Math.random() * 10000) + 100,
          is_public: invite_link.includes('joinchat') ? false : true
        };

        const { data, error } = await supabaseClient
          .from('telegram_groups')
          .insert({
            user_id: user.id,
            account_id,
            ...mockGroup,
            invite_link,
            joined_at: new Date().toISOString(),
            status: 'joined'
          })
          .select()
          .single();

        if (error) throw error;

        console.log(`Joined group: ${mockGroup.group_name}`);
        return new Response(JSON.stringify({ 
          group: data,
          message: `Successfully joined ${mockGroup.group_name}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'leave': {
        const { group_id } = params;
        
        const { error } = await supabaseClient
          .from('telegram_groups')
          .update({ status: 'left' })
          .eq('id', group_id)
          .eq('user_id', user.id);

        if (error) throw error;
        return new Response(JSON.stringify({ message: 'Left group successfully' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'add_members': {
        const { group_id, members, account_ids } = params;
        
        const memberList = members.split('\n').filter((m: string) => m.trim());
        
        // Simulate adding members with rotation
        console.log(`Adding ${memberList.length} members to group using ${account_ids?.length || 1} accounts`);
        
        const successCount = Math.floor(memberList.length * 0.85);
        const failedCount = memberList.length - successCount;

        return new Response(JSON.stringify({ 
          message: `Added ${successCount} members, ${failedCount} failed`,
          success_count: successCount,
          failed_count: failedCount
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'load_groups': {
        const { keyword, category, limit } = params;
        
        // Simulate loading groups by keyword/category
        const mockGroups = Array.from({ length: Math.min(limit || 100, 500) }, (_, i) => ({
          group_id: `found_${i + 1}`,
          group_name: `${keyword || category} Group ${i + 1}`,
          group_type: Math.random() > 0.5 ? 'supergroup' : 'group',
          member_count: Math.floor(Math.random() * 50000) + 100,
          invite_link: `https://t.me/${keyword?.replace(/\s/g, '_').toLowerCase() || 'group'}_${i + 1}`,
          is_public: Math.random() > 0.3
        }));

        console.log(`Found ${mockGroups.length} groups for "${keyword || category}"`);
        return new Response(JSON.stringify({ 
          groups: mockGroups,
          count: mockGroups.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'analyze': {
        const { group_link } = params;
        
        // Simulate group analysis
        const analysis = {
          group_name: `Analyzed Group`,
          group_type: 'supergroup',
          member_count: Math.floor(Math.random() * 100000) + 1000,
          online_count: Math.floor(Math.random() * 5000) + 50,
          admins_count: Math.floor(Math.random() * 20) + 1,
          messages_per_day: Math.floor(Math.random() * 500) + 10,
          is_public: Math.random() > 0.5,
          has_username: Math.random() > 0.3,
          invite_link: group_link,
          created_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'This is a sample group description for analysis.',
          engagement_rate: (Math.random() * 10 + 1).toFixed(2) + '%',
          growth_rate: (Math.random() * 5).toFixed(2) + '% per week'
        };

        console.log(`Analyzed group: ${group_link}`);
        return new Response(JSON.stringify({ analysis }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'bulk_join': {
        const { group_links, account_id, delay_seconds } = params;
        
        const links = group_links.split('\n').filter((l: string) => l.trim());
        
        // Simulate bulk joining
        console.log(`Bulk joining ${links.length} groups with ${delay_seconds}s delay`);
        
        const successCount = Math.floor(links.length * 0.9);
        const failedCount = links.length - successCount;

        return new Response(JSON.stringify({ 
          message: `Joined ${successCount} groups, ${failedCount} failed`,
          success_count: successCount,
          failed_count: failedCount
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // PREMIUM: Extract members from hidden/secret groups
      case 'extract_hidden_members': {
        const { group_id, include_phones, include_ids } = params;
        
        console.log(`Extracting hidden members from group: ${group_id}`);
        
        // Simulate extracting hidden group members with full data
        const mockMembers = Array.from({ length: Math.floor(Math.random() * 500) + 50 }, (_, i) => ({
          user_id: `user_${Date.now()}_${i}`,
          username: Math.random() > 0.3 ? `user_${i + 1}` : null,
          first_name: `User ${i + 1}`,
          last_name: Math.random() > 0.5 ? `Surname ${i + 1}` : null,
          phone: include_phones ? `+${Math.floor(Math.random() * 9000000000) + 1000000000}` : null,
          is_bot: false,
          is_premium: Math.random() > 0.8,
          is_verified: Math.random() > 0.95,
          is_restricted: Math.random() > 0.98,
          is_scam: false,
          is_fake: false,
          status: ['online', 'offline', 'recently', 'within_week', 'within_month', 'long_ago'][Math.floor(Math.random() * 6)],
          last_online: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          access_hash: include_ids ? `${Math.floor(Math.random() * 9999999999)}` : null,
          restriction_reason: null
        }));

        return new Response(JSON.stringify({ 
          members: mockMembers,
          count: mockMembers.length,
          group_id,
          extracted_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // PREMIUM: Add members by username or phone
      case 'add_members_advanced': {
        const { group_id, usernames, phone_numbers, account_ids, delay_ms } = params;
        
        const usernameList = usernames ? usernames.split('\n').filter((u: string) => u.trim()) : [];
        const phoneList = phone_numbers ? phone_numbers.split('\n').filter((p: string) => p.trim()) : [];
        const totalMembers = usernameList.length + phoneList.length;
        
        console.log(`Adding ${usernameList.length} by username, ${phoneList.length} by phone to group`);
        
        const usernameSuccess = Math.floor(usernameList.length * 0.9);
        const phoneSuccess = Math.floor(phoneList.length * 0.75);
        const totalSuccess = usernameSuccess + phoneSuccess;
        
        const results = {
          by_username: {
            total: usernameList.length,
            success: usernameSuccess,
            failed: usernameList.length - usernameSuccess,
            errors: usernameList.length - usernameSuccess > 0 ? ['User not found', 'Privacy settings'] : []
          },
          by_phone: {
            total: phoneList.length,
            success: phoneSuccess,
            failed: phoneList.length - phoneSuccess,
            errors: phoneList.length - phoneSuccess > 0 ? ['Phone not registered', 'User blocked adds'] : []
          }
        };

        return new Response(JSON.stringify({ 
          message: `Added ${totalSuccess}/${totalMembers} members`,
          results,
          accounts_used: account_ids?.length || 1
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // PREMIUM: Move members between groups
      case 'move_members': {
        const { source_group_id, target_group_id, member_ids, account_ids } = params;
        
        const memberList = member_ids.split('\n').filter((m: string) => m.trim());
        console.log(`Moving ${memberList.length} members from ${source_group_id} to ${target_group_id}`);
        
        const successCount = Math.floor(memberList.length * 0.8);

        return new Response(JSON.stringify({ 
          message: `Moved ${successCount}/${memberList.length} members`,
          success_count: successCount,
          failed_count: memberList.length - successCount
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // PREMIUM: Advanced search for groups/channels/chats
      case 'advanced_search': {
        const { keyword, search_type, limit, filters } = params;
        
        const searchTypes = search_type || 'all';
        const mockResults = Array.from({ length: Math.min(limit || 100, 1000) }, (_, i) => {
          const type = searchTypes === 'all' 
            ? ['group', 'supergroup', 'channel', 'chat'][Math.floor(Math.random() * 4)]
            : searchTypes;
          
          return {
            id: `result_${i + 1}`,
            title: `${keyword} ${type} ${i + 1}`,
            type,
            username: Math.random() > 0.3 ? `${keyword.replace(/\s/g, '_').toLowerCase()}_${i + 1}` : null,
            member_count: Math.floor(Math.random() * 100000) + 10,
            description: `A ${type} about ${keyword}`,
            invite_link: `https://t.me/${keyword.replace(/\s/g, '_').toLowerCase()}_${i + 1}`,
            is_verified: Math.random() > 0.9,
            is_scam: false,
            is_restricted: Math.random() > 0.98,
            date_created: new Date(Date.now() - Math.random() * 365 * 3 * 24 * 60 * 60 * 1000).toISOString()
          };
        });

        // Apply filters if provided
        let filteredResults = mockResults;
        if (filters?.min_members) {
          filteredResults = filteredResults.filter(r => r.member_count >= filters.min_members);
        }
        if (filters?.verified_only) {
          filteredResults = filteredResults.filter(r => r.is_verified);
        }

        console.log(`Advanced search: "${keyword}" type=${searchTypes}, found ${filteredResults.length}`);
        
        return new Response(JSON.stringify({ 
          results: filteredResults,
          count: filteredResults.length,
          search_type: searchTypes,
          keyword
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // PREMIUM: Auto-interact with messages
      case 'auto_interact': {
        const { group_id, interaction_type, keywords, reply_template, account_id, settings } = params;
        
        console.log(`Setting up auto-interact for group ${group_id}, type: ${interaction_type}`);
        
        // Simulate setting up auto-interaction
        const config = {
          group_id,
          interaction_type, // 'like', 'reply', 'react', 'forward'
          keywords: keywords?.split(',').map((k: string) => k.trim()) || [],
          reply_template,
          account_id,
          settings: {
            delay_min: settings?.delay_min || 5,
            delay_max: settings?.delay_max || 30,
            max_interactions_per_hour: settings?.max_interactions_per_hour || 20,
            only_new_messages: settings?.only_new_messages !== false,
            reactions: settings?.reactions || ['👍', '❤️', '🔥']
          },
          status: 'active',
          created_at: new Date().toISOString()
        };

        return new Response(JSON.stringify({ 
          message: `Auto-interact configured for ${interaction_type}`,
          config
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // PREMIUM: Get auto-interact status
      case 'get_auto_interact_status': {
        const { group_id } = params;
        
        // Simulate getting status
        const status = {
          group_id,
          is_active: true,
          interactions_today: Math.floor(Math.random() * 100),
          messages_matched: Math.floor(Math.random() * 50),
          last_interaction: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          errors: []
        };

        return new Response(JSON.stringify({ status }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // PREMIUM: Stop auto-interact
      case 'stop_auto_interact': {
        const { group_id } = params;
        
        console.log(`Stopping auto-interact for group ${group_id}`);
        
        return new Response(JSON.stringify({ 
          message: 'Auto-interact stopped',
          group_id
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
    console.error('Telegram groups error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
