import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  deleteArticleMedia,
  deleteUserAvatarMedia,
} from "../_shared/mediaStorage.ts";
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

    // 2. Parse the target user
    const { userId } = await req.json().catch(() => ({ userId: null }));
    if (
      !userId ||
      typeof userId !== "string" ||
      !UUID_REGEX.test(userId)
    ) {
      return jsonResponse({ error: "userId is required" }, 400);
    }

    // 3. Permissions: anyone may delete their OWN account; deleting
    //    someone else requires admin.
    const isSelfDelete = userId === caller.id;
    if (!isSelfDelete) {
      const { data: callerProfile } = await supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", caller.id)
        .maybeSingle();
      if (!callerProfile?.is_admin) {
        return jsonResponse({ error: "Admin access required" }, 403);
      }
    }

    // 4. Delete the user's article media, then their articles
    const { data: articles, error: articlesError } = await supabaseAdmin
      .from("articles")
      .select("id")
      .eq("author_id", userId);
    if (articlesError) throw articlesError;

    for (const article of articles ?? []) {
      await deleteArticleMedia(article.id);
    }

    if (articles && articles.length > 0) {
      const { error: deleteArticlesError } = await supabaseAdmin
        .from("articles")
        .delete()
        .in("id", articles.map((a) => a.id));
      if (deleteArticlesError) throw deleteArticlesError;
    }

    // 5. Delete their avatar folder
    await deleteUserAvatarMedia(supabaseAdmin, userId);

    // 6. Delete the auth user — profile, publications, comments and likes cascade
    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) throw deleteUserError;

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("delete-user error:", error);
    return jsonResponse({ error: "Failed to delete user" }, 500);
  }
});