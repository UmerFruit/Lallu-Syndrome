import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import algoliasearch from "npm:algoliasearch@4";

const ALGOLIA_APP_ID = Deno.env.get("ALGOLIA_APP_ID")!;
const ALGOLIA_ADMIN_KEY = Deno.env.get("ALGOLIA_ADMIN_KEY")!;
const ALGOLIA_INDEX_NAME = Deno.env.get("ALGOLIA_INDEX_NAME")!;
const WEBHOOK_SECRET = Deno.env.get("ALGOLIA_SYNC_WEBHOOK_SECRET")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);

function stripHtml(html: string): string {
  return html
    .replace(/<\/?[a-zA-Z][^>]*>/g, " ")
    .replaceAll("&nbsp;", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createExcerpt(content: string, maxLength = 300): string {
  const text = stripHtml(content);
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await req.json();

  try {
    // Handle manual reindex
    if (payload.action === "reindex_all") {
      await reindexAll();
      return new Response(JSON.stringify({ action: "reindexed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { type, record, old_record } = payload;

    // DELETE → remove from Algolia
    if (type === "DELETE") {
      const articleId = old_record?.id;
      if (articleId) {
        await index.deleteObject(articleId);
      }
      return new Response(JSON.stringify({ action: "deleted" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // INSERT or UPDATE
    if (type === "INSERT" || type === "UPDATE") {
      if (!record) {
        return new Response(JSON.stringify({ error: "No record" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // If article is not published, remove from index (handles unpublish)
      if (record.status !== "published") {
        try {
          await index.deleteObject(record.id);
        } catch {
          // Ignore if not found
        }
        return new Response(JSON.stringify({ action: "removed_unpublished" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Fetch full article with relations
      const { data: fullArticle, error } = await supabase
        .from("articles")
        .select(`
          id, title, slug, content, published_at, reading_time,
          categories (name),
          profiles!articles_author_id_fkey (display_name)
        `)
        .eq("id", record.id)
        .single();

      if (error || !fullArticle) {
        return new Response(JSON.stringify({ error: "Article not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const category = fullArticle.categories as any;
      const author = fullArticle.profiles as any;

      const algoliaRecord = {
        objectID: fullArticle.id,
        title: fullArticle.title,
        slug: fullArticle.slug,
        excerpt: createExcerpt(fullArticle.content),
        category: category?.name ?? "Uncategorized",
        author: author?.display_name ?? "Unknown",
        authorAvatar: author?.avatar_url ?? null,
        publishedAt: fullArticle.published_at,
        readingTime: fullArticle.reading_time,
      };

      await index.saveObject(algoliaRecord);

      return new Response(JSON.stringify({ action: "indexed", id: fullArticle.id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown event type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function reindexAll() {
  const { data: articles, error } = await supabase
    .from("articles")
    .select(`
      id, title, slug, content, published_at, reading_time,
      categories (name),
      profiles!articles_author_id_fkey (display_name)
    `)
    .eq("status", "published");

  if (error) {
    throw new Error(`Failed to fetch articles: ${error.message}`);
  }

  if (!articles || articles.length === 0) {
    return;
  }

  const records = articles.map((article: any) => {
    const category = article.categories as any;
    const author = article.profiles as any;

    return {
      objectID: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: createExcerpt(article.content),
      category: category?.name ?? "Uncategorized",
      author: author?.display_name ?? "Unknown",
      authorAvatar: author?.avatar_url ?? null,
      publishedAt: article.published_at,
      readingTime: article.reading_time,
    };
  });

  await index.replaceAllObjects(records);
}