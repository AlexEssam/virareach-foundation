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
