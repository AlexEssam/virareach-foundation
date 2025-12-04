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
    console.log(`LinkedIn extract action: ${action}`, params);

    switch (action) {
      case 'customers': {
        const { company_url, filters } = params;
        
        const { data, error } = await supabaseClient
          .from('linkedin_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'customers',
            source: company_url,
            filters,
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const mockResults = Array.from({ length: 100 }, (_, i) => ({
          profile_url: `https://linkedin.com/in/customer-${i + 1}`,
          name: `Customer ${i + 1}`,
          title: ['CEO', 'CTO', 'Marketing Director', 'Sales Manager', 'Product Manager'][Math.floor(Math.random() * 5)],
          company: `Company ${Math.floor(Math.random() * 50) + 1}`,
          location: ['New York', 'San Francisco', 'London', 'Berlin', 'Singapore'][Math.floor(Math.random() * 5)],
          email: Math.random() > 0.5 ? `customer${i + 1}@example.com` : null
        }));

        await supabaseClient
          .from('linkedin_extractions')
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

      case 'companies': {
        const { keyword, industry, size, location } = params;
        
        const { data, error } = await supabaseClient
          .from('linkedin_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'companies',
            source: keyword,
            filters: { industry, size, location },
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const mockResults = Array.from({ length: 50 }, (_, i) => ({
          company_url: `https://linkedin.com/company/company-${i + 1}`,
          name: `${keyword || 'Tech'} Company ${i + 1}`,
          industry: industry || ['Technology', 'Finance', 'Healthcare', 'Marketing'][Math.floor(Math.random() * 4)],
          size: ['1-10', '11-50', '51-200', '201-500', '500+'][Math.floor(Math.random() * 5)],
          location: location || ['United States', 'United Kingdom', 'Germany', 'France'][Math.floor(Math.random() * 4)],
          followers: Math.floor(Math.random() * 100000) + 100,
          website: `https://company${i + 1}.com`
        }));

        await supabaseClient
          .from('linkedin_extractions')
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

      case 'universities': {
        const { country, field } = params;
        
        const { data, error } = await supabaseClient
          .from('linkedin_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'universities',
            source: country,
            filters: { field },
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const mockResults = Array.from({ length: 30 }, (_, i) => ({
          university_url: `https://linkedin.com/school/university-${i + 1}`,
          name: `University of ${['Technology', 'Science', 'Business', 'Arts'][Math.floor(Math.random() * 4)]} ${i + 1}`,
          location: country || ['United States', 'United Kingdom', 'Canada', 'Australia'][Math.floor(Math.random() * 4)],
          students: Math.floor(Math.random() * 50000) + 5000,
          alumni_on_linkedin: Math.floor(Math.random() * 200000) + 10000,
          top_fields: ['Computer Science', 'Business', 'Engineering', 'Medicine'].slice(0, Math.floor(Math.random() * 3) + 1)
        }));

        await supabaseClient
          .from('linkedin_extractions')
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

      case 'colleagues': {
        const { company_url } = params;
        
        const { data, error } = await supabaseClient
          .from('linkedin_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'colleagues',
            source: company_url,
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const mockResults = Array.from({ length: 80 }, (_, i) => ({
          profile_url: `https://linkedin.com/in/colleague-${i + 1}`,
          name: `Colleague ${i + 1}`,
          title: ['Software Engineer', 'Product Designer', 'Data Analyst', 'Project Manager', 'HR Specialist'][Math.floor(Math.random() * 5)],
          department: ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'][Math.floor(Math.random() * 5)],
          tenure: `${Math.floor(Math.random() * 10) + 1} years`
        }));

        await supabaseClient
          .from('linkedin_extractions')
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

      case 'post_commenters': {
        const { post_url } = params;
        
        const { data, error } = await supabaseClient
          .from('linkedin_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'post_commenters',
            source: post_url,
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const mockResults = Array.from({ length: 60 }, (_, i) => ({
          profile_url: `https://linkedin.com/in/commenter-${i + 1}`,
          name: `Commenter ${i + 1}`,
          title: ['Founder', 'Director', 'Manager', 'Consultant', 'Specialist'][Math.floor(Math.random() * 5)],
          company: `Company ${Math.floor(Math.random() * 100) + 1}`,
          comment_snippet: `Great post! This is comment ${i + 1}...`,
          engagement_type: ['comment', 'like', 'share'][Math.floor(Math.random() * 3)]
        }));

        await supabaseClient
          .from('linkedin_extractions')
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

      case 'emails_by_interest': {
        const { interest, country } = params;
        
        const { data, error } = await supabaseClient
          .from('linkedin_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'emails_by_interest',
            source: interest,
            filters: { country },
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const mockResults = Array.from({ length: 200 }, (_, i) => ({
          profile_url: `https://linkedin.com/in/user-${i + 1}`,
          name: `User ${i + 1}`,
          email: `user${i + 1}@company${Math.floor(Math.random() * 100) + 1}.com`,
          title: ['CEO', 'CMO', 'VP Sales', 'Director', 'Manager'][Math.floor(Math.random() * 5)],
          company: `Company ${Math.floor(Math.random() * 100) + 1}`,
          interest: interest || 'Marketing',
          country: country || 'United States'
        }));

        await supabaseClient
          .from('linkedin_extractions')
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

      case 'history': {
        const { data, error } = await supabaseClient
          .from('linkedin_extractions')
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
    console.error('LinkedIn extract error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
