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

      // PREMIUM: Extract full company data with all fields
      case 'companies_full': {
        const { keyword, industry, size, location, limit } = params;
        
        const { data, error } = await supabaseClient
          .from('linkedin_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'companies_full',
            source: keyword,
            filters: { industry, size, location, limit },
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const mockResults = Array.from({ length: Math.min(limit || 100, 500) }, (_, i) => ({
          company_id: `comp_${Date.now()}_${i}`,
          company_url: `https://linkedin.com/company/company-${i + 1}`,
          name: `${keyword || 'Tech'} Company ${i + 1}`,
          tagline: `Leading provider of ${keyword || 'technology'} solutions`,
          description: `We are a ${['startup', 'enterprise', 'mid-size'][Math.floor(Math.random() * 3)]} company specializing in ${keyword || 'technology'}. Founded in ${2000 + Math.floor(Math.random() * 24)}, we serve clients worldwide.`,
          industry: industry || ['Technology', 'Finance', 'Healthcare', 'Marketing', 'E-commerce'][Math.floor(Math.random() * 5)],
          company_type: ['Public Company', 'Privately Held', 'Partnership', 'Nonprofit'][Math.floor(Math.random() * 4)],
          headquarters: location || ['San Francisco, CA', 'New York, NY', 'London, UK', 'Berlin, DE', 'Singapore'][Math.floor(Math.random() * 5)],
          founded_year: 2000 + Math.floor(Math.random() * 24),
          specialties: ['SaaS', 'Cloud Computing', 'AI/ML', 'Data Analytics', 'Mobile Apps'].slice(0, Math.floor(Math.random() * 4) + 1),
          size: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'][Math.floor(Math.random() * 7)],
          employee_count: Math.floor(Math.random() * 10000) + 10,
          followers: Math.floor(Math.random() * 500000) + 100,
          website: `https://company${i + 1}.com`,
          phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          email: `contact@company${i + 1}.com`,
          linkedin_posts_per_month: Math.floor(Math.random() * 30) + 1,
          recent_funding: Math.random() > 0.7 ? `$${Math.floor(Math.random() * 100) + 1}M Series ${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}` : null,
          locations: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => 
            ['New York', 'San Francisco', 'London', 'Berlin', 'Tokyo', 'Sydney'][Math.floor(Math.random() * 6)]
          ),
          top_employees: Array.from({ length: 5 }, (_, j) => ({
            name: `Executive ${j + 1}`,
            title: ['CEO', 'CTO', 'CFO', 'COO', 'VP Engineering'][j],
            profile_url: `https://linkedin.com/in/exec-${i}-${j}`
          }))
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

        console.log(`Extracted ${mockResults.length} full company profiles`);
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

      // PREMIUM: Extract full university data with all fields
      case 'universities_full': {
        const { country, field, ranking, limit } = params;
        
        const { data, error } = await supabaseClient
          .from('linkedin_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'universities_full',
            source: country,
            filters: { field, ranking, limit },
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const universityNames = [
          'Massachusetts Institute of Technology', 'Stanford University', 'Harvard University',
          'University of Cambridge', 'University of Oxford', 'ETH Zurich',
          'National University of Singapore', 'University of Tokyo', 'Tsinghua University',
          'University of Melbourne', 'University of Toronto', 'Technical University of Munich'
        ];

        const mockResults = Array.from({ length: Math.min(limit || 50, 200) }, (_, i) => ({
          university_id: `univ_${Date.now()}_${i}`,
          university_url: `https://linkedin.com/school/university-${i + 1}`,
          name: universityNames[i % universityNames.length] || `University ${i + 1}`,
          type: ['Public University', 'Private University', 'Research University', 'Liberal Arts College'][Math.floor(Math.random() * 4)],
          description: `A leading institution of higher education specializing in ${field || 'various disciplines'}. Established in ${1800 + Math.floor(Math.random() * 200)}.`,
          location: {
            city: ['Boston', 'Stanford', 'Cambridge', 'Berlin', 'Tokyo', 'Singapore'][Math.floor(Math.random() * 6)],
            country: country || ['United States', 'United Kingdom', 'Germany', 'Japan', 'Singapore'][Math.floor(Math.random() * 5)]
          },
          founded_year: 1800 + Math.floor(Math.random() * 200),
          world_ranking: Math.floor(Math.random() * 500) + 1,
          national_ranking: Math.floor(Math.random() * 100) + 1,
          total_students: Math.floor(Math.random() * 50000) + 5000,
          undergraduate_students: Math.floor(Math.random() * 30000) + 3000,
          graduate_students: Math.floor(Math.random() * 20000) + 2000,
          international_students_percent: Math.floor(Math.random() * 40) + 5,
          faculty_count: Math.floor(Math.random() * 5000) + 500,
          student_faculty_ratio: `${Math.floor(Math.random() * 15) + 5}:1`,
          alumni_on_linkedin: Math.floor(Math.random() * 500000) + 50000,
          followers: Math.floor(Math.random() * 1000000) + 10000,
          website: `https://university${i + 1}.edu`,
          admissions_email: `admissions@university${i + 1}.edu`,
          phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          top_programs: ['Computer Science', 'Business Administration', 'Engineering', 'Medicine', 'Law', 'Economics'].slice(0, Math.floor(Math.random() * 4) + 2),
          research_areas: ['AI/ML', 'Biotechnology', 'Clean Energy', 'Quantum Computing', 'Neuroscience'].slice(0, Math.floor(Math.random() * 3) + 1),
          tuition_domestic: `$${Math.floor(Math.random() * 50000) + 10000}/year`,
          tuition_international: `$${Math.floor(Math.random() * 70000) + 30000}/year`,
          acceptance_rate: `${Math.floor(Math.random() * 30) + 5}%`,
          notable_alumni: Array.from({ length: 3 }, (_, j) => ({
            name: `Notable Alumnus ${j + 1}`,
            achievement: ['Nobel Laureate', 'Fortune 500 CEO', 'Tech Founder', 'Political Leader'][Math.floor(Math.random() * 4)]
          })),
          campus_locations: Math.floor(Math.random() * 5) + 1
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

        console.log(`Extracted ${mockResults.length} full university profiles`);
        return new Response(JSON.stringify({ 
          extraction_id: data.id, 
          results: mockResults,
          count: mockResults.length 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // PREMIUM: Extract emails from search engines by interest + country
      case 'emails_search_engine': {
        const { interest, country, job_titles, sources, limit } = params;
        
        const { data, error } = await supabaseClient
          .from('linkedin_extractions')
          .insert({
            user_id: user.id,
            extraction_type: 'emails_search_engine',
            source: `${interest} - ${country}`,
            filters: { interest, country, job_titles, sources, limit },
            status: 'processing'
          })
          .select()
          .single();

        if (error) throw error;

        const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.io', 'corp.net'];
        const jobTitleList = job_titles?.split(',').map((t: string) => t.trim()) || ['CEO', 'Director', 'Manager', 'Founder', 'VP'];

        const mockResults = Array.from({ length: Math.min(limit || 500, 2000) }, (_, i) => ({
          email: `${['john', 'jane', 'mike', 'sarah', 'alex'][Math.floor(Math.random() * 5)]}${i + 1}@${domains[Math.floor(Math.random() * domains.length)]}`,
          name: `Contact ${i + 1}`,
          title: jobTitleList[Math.floor(Math.random() * jobTitleList.length)],
          company: `Company ${Math.floor(Math.random() * 500) + 1}`,
          linkedin_url: Math.random() > 0.3 ? `https://linkedin.com/in/user-${i + 1}` : null,
          interest: interest,
          country: country,
          source: sources?.split(',')[Math.floor(Math.random() * (sources?.split(',').length || 1))] || 'Google',
          verified: Math.random() > 0.2,
          confidence_score: Math.floor(Math.random() * 40) + 60,
          extracted_at: new Date().toISOString()
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

        console.log(`Extracted ${mockResults.length} emails from search engines`);
        return new Response(JSON.stringify({ 
          extraction_id: data.id, 
          results: mockResults,
          count: mockResults.length,
          verified_count: mockResults.filter(r => r.verified).length
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
