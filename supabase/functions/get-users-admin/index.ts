import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } =
      await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // 2. Caller must be an admin
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", caller.id)
      .maybeSingle();
    if (!callerProfile?.is_admin) {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    // 3. Fetch all profiles (service role bypasses RLS)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (profilesError) throw profilesError;

    // 4. Fetch auth users (paginated) to build a last_sign_in_at map
    const lastSignInMap = new Map<string, string | null>();
    let page = 1;
    const perPage = 1000;
    // deno-lint-ignore no-constant-condition
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw error;
      const authUsers = data.users ?? [];
      for (const u of authUsers) {
        lastSignInMap.set(u.id, u.last_sign_in_at ?? null);
      }
      if (authUsers.length < perPage) break;
      page += 1;
    }

    // 5. Merge profile data with last_sign_in_at
    const users = (profiles ?? []).map((p) => ({
      ...p,
      last_sign_in_at: lastSignInMap.get(p.id) ?? null,
    }));

    return jsonResponse({ users }, 200);
  } catch (error) {
    console.error("get-users-admin error:", error);
    return jsonResponse({ error: "Failed to fetch users" }, 500);
  }
});