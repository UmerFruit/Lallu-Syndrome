// supabase/functions/delete-article/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { deleteArticleMedia } from "../_shared/mediaStorage.ts";

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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { articleId } = await req.json().catch(() => ({ articleId: null }));

    if (
      !articleId ||
      typeof articleId !== "string" ||
      !UUID_REGEX.test(articleId)
    ) {
      return jsonResponse({ error: "articleId is required" }, 400);
    }

    const { data: article, error: articleError } = await supabaseAdmin
      .from("articles")
      .select("id, author_id")
      .eq("id", articleId)
      .maybeSingle();

    if (articleError) {
      throw articleError;
    }

    if (!article) {
      // Idempotent behavior.
      //
      // If the article is already gone, allow admins to clean up any leftover
      // media prefix from a previously failed deletion.
      const { data: callerProfile, error: missingArticleProfileError } =
        await supabaseAdmin
          .from("profiles")
          .select("is_admin")
          .eq("id", caller.id)
          .maybeSingle();

      if (missingArticleProfileError) {
        throw missingArticleProfileError;
      }

      if (callerProfile?.is_admin) {
        await deleteArticleMedia(supabaseAdmin, articleId);
      }

      return jsonResponse({ success: true }, 200);
    }

    const isOwner = article.author_id === caller.id;

    if (!isOwner) {
      const { data: callerProfile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", caller.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!callerProfile?.is_admin) {
        return jsonResponse({ error: "Admin access required" }, 403);
      }
    }

    // Delete media first so we do not orphan storage objects.
    await deleteArticleMedia(supabaseAdmin, articleId);

    const { error: deleteArticleError } = await supabaseAdmin
      .from("articles")
      .delete()
      .eq("id", articleId);

    if (deleteArticleError) {
      throw deleteArticleError;
    }

    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error("delete-article error:", error);
    return jsonResponse({ error: "Failed to delete article" }, 500);
  }
});