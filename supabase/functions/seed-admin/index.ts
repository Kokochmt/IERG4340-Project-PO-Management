import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Check if admin already exists
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", "Admin")
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ message: "Admin already exists" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create admin user via auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@procureflow.local",
    password: "Admin",
    email_confirm: true,
    user_metadata: { full_name: "Administrator", username: "Admin" },
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // The trigger creates profile + observer role. Update role to admin.
  const userId = authData.user.id;

  await supabaseAdmin
    .from("user_roles")
    .update({ role: "admin" })
    .eq("user_id", userId);

  // Update username in profile
  await supabaseAdmin
    .from("profiles")
    .update({ username: "Admin" })
    .eq("id", userId);

  return new Response(JSON.stringify({ message: "Admin created", userId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
