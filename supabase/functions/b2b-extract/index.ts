import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateExtractionRequest {
  action: 'create_extraction';
  extraction_name: string;
  source: string;
  source_url?: string;
  search_query?: string;
  location?: string;
  category?: string;
  filters?: Record<string, unknown>;
}

interface GetExtractionsRequest {
  action: 'get_extractions';
  source?: string;
}

interface UpdateExtractionRequest {
  action: 'update_extraction';
  extraction_id: string;
  status?: string;
  results?: unknown[];
  result_count?: number;
}

interface DeleteExtractionRequest {
  action: 'delete_extraction';
  extraction_id: string;
}

interface GetSourcesRequest {
  action: 'get_sources';
}

type RequestBody = 
  | CreateExtractionRequest 
  | GetExtractionsRequest 
  | UpdateExtractionRequest
  | DeleteExtractionRequest
  | GetSourcesRequest;

const B2B_SOURCES = [
  // General B2B
  { 
    id: 'facebook_b2b', 
    name: 'Facebook B2B', 
    icon: 'facebook',
    description: 'Extract business pages, groups, and company data',
    countries: ['Global'],
    category: 'social'
  },
  { 
    id: 'google_maps', 
    name: 'Google Maps', 
    icon: 'map-pin',
    description: 'Business listings, reviews, and contact info',
    countries: ['Global'],
    category: 'business'
  },
  { 
    id: 'google_travel', 
    name: 'Google Travel', 
    icon: 'plane',
    description: 'Hotels, flights, and travel business listings',
    countries: ['Global'],
    category: 'travel'
  },
  { 
    id: 'yellow_pages', 
    name: 'Yellow Pages', 
    icon: 'book-open',
    description: 'Business directory listings',
    countries: ['USA', 'Canada', 'UK', 'Australia', 'UAE', 'India'],
    category: 'business'
  },
  // Middle East Marketplaces
  { 
    id: 'olx', 
    name: 'OLX', 
    icon: 'shopping-bag',
    description: 'Classifieds marketplace - All regions',
    countries: ['UAE', 'Saudi Arabia', 'Egypt', 'Pakistan', 'India', 'Poland', 'Portugal', 'Brazil', 'Indonesia', 'Lebanon', 'Kuwait', 'Oman', 'Bahrain'],
    category: 'marketplace'
  },
  { 
    id: 'maroof', 
    name: 'Maroof Saudi', 
    icon: 'verified',
    description: 'Saudi verified business registry',
    countries: ['Saudi Arabia'],
    category: 'business'
  },
  { 
    id: 'aqar_city', 
    name: 'Aqar City', 
    icon: 'building',
    description: 'Real estate listings and property data',
    countries: ['Saudi Arabia', 'UAE'],
    category: 'realestate'
  },
  { 
    id: 'haraj', 
    name: 'Haraj', 
    icon: 'store',
    description: 'Saudi Arabian marketplace listings',
    countries: ['Saudi Arabia'],
    category: 'marketplace'
  },
  { 
    id: 'dubizzle', 
    name: 'Dubizzle', 
    icon: 'building',
    description: 'UAE & Middle East classifieds',
    countries: ['UAE', 'Egypt', 'Bahrain', 'Kuwait', 'Oman', 'Qatar', 'Saudi Arabia', 'Lebanon'],
    category: 'marketplace'
  },
  { 
    id: 'opensooq', 
    name: 'OpenSooq', 
    icon: 'shopping-cart',
    description: 'Arab world classifieds platform',
    countries: ['Jordan', 'Saudi Arabia', 'UAE', 'Kuwait', 'Oman', 'Bahrain', 'Qatar', 'Egypt', 'Iraq', 'Libya'],
    category: 'marketplace'
  },
  { 
    id: 'property_finder', 
    name: 'Property Finder', 
    icon: 'home',
    description: 'Real estate listings and agent data',
    countries: ['UAE', 'Saudi Arabia', 'Bahrain', 'Qatar', 'Egypt'],
    category: 'realestate'
  },
  { 
    id: 'waseet', 
    name: 'Waseet', 
    icon: 'newspaper',
    description: 'Gulf classifieds and business listings',
    countries: ['Kuwait', 'Bahrain', 'Qatar', 'UAE', 'Oman'],
    category: 'marketplace'
  },
  { 
    id: '4sale', 
    name: '4Sale', 
    icon: 'tag',
    description: 'Kuwait marketplace and classifieds',
    countries: ['Kuwait'],
    category: 'marketplace'
  },
  { 
    id: 'aqarmap', 
    name: 'Aqarmap', 
    icon: 'map',
    description: 'Egyptian real estate portal',
    countries: ['Egypt'],
    category: 'realestate'
  },
  { 
    id: 'saudi_aqar', 
    name: 'Saudi Aqar', 
    icon: 'home',
    description: 'Saudi real estate portal',
    countries: ['Saudi Arabia'],
    category: 'realestate'
  },
  { 
    id: 'mzad_qatar', 
    name: 'MzadQatar', 
    icon: 'gavel',
    description: 'Qatar auction and classifieds',
    countries: ['Qatar'],
    category: 'marketplace'
  },
  // Doctor Databases
  { 
    id: 'koshofat', 
    name: 'Koshofat', 
    icon: 'stethoscope',
    description: 'Doctor and clinic database',
    countries: ['Egypt', 'Saudi Arabia'],
    category: 'healthcare'
  },
  { 
    id: 'altibbi', 
    name: 'Altibbi', 
    icon: 'heart-pulse',
    description: 'Arabic medical professionals database',
    countries: ['Saudi Arabia', 'UAE', 'Jordan', 'Egypt', 'Kuwait'],
    category: 'healthcare'
  },
  // Rental Sites
  { 
    id: 'airbnb', 
    name: 'Airbnb', 
    icon: 'bed',
    description: 'Short-term rental listings',
    countries: ['Global'],
    category: 'rental'
  },
  { 
    id: 'booking', 
    name: 'Booking.com', 
    icon: 'hotel',
    description: 'Hotel and accommodation data',
    countries: ['Global'],
    category: 'rental'
  },
  // Demographics
  { 
    id: 'demographics', 
    name: 'Demographics Extraction', 
    icon: 'users',
    description: 'Extract full demographic data: religion, DOB, gender, job, education, origin',
    countries: ['Global'],
    category: 'demographics'
  }
];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    console.log(`B2B Extract action: ${body.action} for user: ${user.id}`);

    switch (body.action) {
      case 'get_sources': {
        return new Response(
          JSON.stringify({ success: true, sources: B2B_SOURCES }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_extraction': {
        const { extraction_name, source, source_url, search_query, location, category, filters } = body;

        const { data, error } = await supabase
          .from('b2b_extractions')
          .insert({
            user_id: user.id,
            extraction_name,
            source,
            source_url,
            search_query,
            location,
            category,
            filters: filters || {},
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_extractions': {
        let query = supabase
          .from('b2b_extractions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (body.source) {
          query = query.eq('source', body.source);
        }

        const { data, error } = await query;

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, extractions: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_extraction': {
        const { extraction_id, status, results, result_count } = body;

        const updateData: Record<string, unknown> = {};
        if (status) updateData.status = status;
        if (results) updateData.results = results;
        if (result_count !== undefined) updateData.result_count = result_count;
        if (status === 'completed') updateData.completed_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('b2b_extractions')
          .update(updateData)
          .eq('id', extraction_id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, extraction: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_extraction': {
        const { extraction_id } = body;

        const { error } = await supabase
          .from('b2b_extractions')
          .delete()
          .eq('id', extraction_id)
          .eq('user_id', user.id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Error in b2b-extract function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
