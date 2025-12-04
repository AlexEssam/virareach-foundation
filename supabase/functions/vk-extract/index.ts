import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { extraction_type, interests, source_user_id, community_id, city } = body;

    console.log(`VK extraction: type=${extraction_type}`);

    // Create extraction record
    const { data: extraction, error: insertError } = await supabase
      .from("vk_extractions")
      .insert({
        user_id: user.id,
        extraction_type,
        interests,
        source_user_id,
        community_id,
        city,
        status: "running",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating extraction:", insertError);
      throw insertError;
    }

    // Generate mock results with detailed user data
    const mockResults = generateMockResults(extraction_type, interests, city);

    // Update extraction with results
    const { error: updateError } = await supabase
      .from("vk_extractions")
      .update({
        status: "completed",
        result_count: mockResults.length,
        results: mockResults,
        completed_at: new Date().toISOString(),
      })
      .eq("id", extraction.id);

    if (updateError) {
      console.error("Error updating extraction:", updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      extraction_id: extraction.id,
      result_count: mockResults.length,
      results: mockResults,
      message: `Extracted ${mockResults.length} users with detailed data (simulation mode)`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateMockResults(extractionType: string, interests?: string, city?: string): any[] {
  const count = Math.floor(Math.random() * 100) + 30;
  const results = [];

  const firstNames = ["Александр", "Дмитрий", "Максим", "Артём", "Иван", "Мария", "Анна", "Елена", "Ольга", "Наталья"];
  const lastNames = ["Иванов", "Петров", "Сидоров", "Козлов", "Новиков", "Морозов", "Волков", "Соколов", "Лебедев", "Кузнецов"];
  const cities = city ? [city] : ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород"];
  const educations = ["МГУ", "СПбГУ", "МГТУ им. Баумана", "НИУ ВШЭ", "МФТИ", "ИТМО"];
  const workplaces = ["Яндекс", "VK", "Сбербанк", "Тинькофф", "Mail.ru", "Газпром", "Роснефть"];
  const maritalStatuses = ["не женат", "женат", "не замужем", "замужем", "в активном поиске", "всё сложно"];
  const genders = ["мужской", "женский"];
  const interestsList = interests?.split(",").map(i => i.trim()) || ["музыка", "путешествия", "спорт", "кино", "технологии"];

  for (let i = 0; i < count; i++) {
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    results.push({
      id: `vk_${Math.random().toString(36).substr(2, 9)}`,
      vk_id: Math.floor(Math.random() * 900000000) + 100000000,
      name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      phone: Math.random() > 0.7 ? `+7${Math.floor(Math.random() * 9000000000) + 1000000000}` : null,
      city: cities[Math.floor(Math.random() * cities.length)],
      place_of_origin: cities[Math.floor(Math.random() * cities.length)],
      address: Math.random() > 0.8 ? `ул. ${lastName}а, д. ${Math.floor(Math.random() * 100)}` : null,
      education: educations[Math.floor(Math.random() * educations.length)],
      graduation_year: 2000 + Math.floor(Math.random() * 24),
      work: workplaces[Math.floor(Math.random() * workplaces.length)],
      work_position: ["Менеджер", "Разработчик", "Дизайнер", "Аналитик", "Маркетолог"][Math.floor(Math.random() * 5)],
      marital_status: maritalStatuses[Math.floor(Math.random() * maritalStatuses.length)],
      gender,
      interests: interestsList.slice(0, Math.floor(Math.random() * interestsList.length) + 1),
      birth_date: `${Math.floor(Math.random() * 28) + 1}.${Math.floor(Math.random() * 12) + 1}.${1970 + Math.floor(Math.random() * 40)}`,
      last_seen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      friends_count: Math.floor(Math.random() * 2000) + 50,
      followers_count: Math.floor(Math.random() * 500),
      photos_count: Math.floor(Math.random() * 200),
      extracted_from: extractionType,
      extracted_at: new Date().toISOString(),
    });
  }

  return results;
}
