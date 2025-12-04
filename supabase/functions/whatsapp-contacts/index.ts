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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // GET - fetch contacts
    if (req.method === "GET") {
      const search = url.searchParams.get("search") || "";
      const tag = url.searchParams.get("tag");

      let query = supabase
        .from("whatsapp_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (search) {
        query = query.or(`phone_number.ilike.%${search}%,name.ilike.%${search}%`);
      }

      if (tag) {
        query = query.contains("tags", [tag]);
      }

      const { data, error } = await query.limit(200);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ contacts: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - create/bulk import/convert contacts
    if (req.method === "POST") {
      const body = await req.json();

      // Bulk import contacts
      if (action === "import") {
        const { contacts } = body;
        if (!contacts || contacts.length === 0) {
          return new Response(JSON.stringify({ error: "No contacts provided" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const contactsToInsert = contacts.map((c: any) => ({
          user_id: user.id,
          phone_number: c.phone_number,
          name: c.name || null,
          tags: c.tags || [],
          notes: c.notes || null,
        }));

        const { data, error } = await supabase
          .from("whatsapp_contacts")
          .upsert(contactsToInsert, { onConflict: "user_id,phone_number", ignoreDuplicates: false })
          .select();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          imported: data?.length || 0,
          message: `Imported ${data?.length || 0} contacts`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Convert numbers to contacts (mass conversion)
      if (action === "convert") {
        const { numbers, default_tags } = body;
        if (!numbers || numbers.length === 0) {
          return new Response(JSON.stringify({ error: "No numbers provided" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Parse and normalize phone numbers
        const normalizedNumbers = numbers.map((num: string) => {
          let phone = num.trim().replace(/\s+/g, "").replace(/[^0-9+]/g, "");
          if (!phone.startsWith("+")) {
            phone = "+" + phone;
          }
          return phone;
        }).filter((num: string) => num.length >= 10);

        const contactsToInsert = normalizedNumbers.map((phone: string) => ({
          user_id: user.id,
          phone_number: phone,
          tags: default_tags || ["converted"],
        }));

        const { data, error } = await supabase
          .from("whatsapp_contacts")
          .insert(contactsToInsert)
          .select();

        if (error) {
          console.error("Error converting numbers:", error);
        }

        return new Response(JSON.stringify({
          success: true,
          converted: normalizedNumbers.length,
          contacts: data,
          message: `Converted ${normalizedNumbers.length} numbers to contacts`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Single contact create
      const { phone_number, name, tags, notes } = body;
      if (!phone_number) {
        return new Response(JSON.stringify({ error: "Phone number is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("whatsapp_contacts")
        .insert({
          user_id: user.id,
          phone_number,
          name,
          tags,
          notes,
        })
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, contact: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT - update contact
    if (req.method === "PUT") {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "Contact ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("whatsapp_contacts")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, contact: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE - remove contact
    if (req.method === "DELETE") {
      const body = await req.json();
      const { id, ids } = body;

      if (ids && Array.isArray(ids)) {
        // Bulk delete
        const { error } = await supabase
          .from("whatsapp_contacts")
          .delete()
          .in("id", ids)
          .eq("user_id", user.id);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, deleted: ids.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!id) {
        return new Response(JSON.stringify({ error: "Contact ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("whatsapp_contacts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
