// src/hooks/useSeo.ts
import { useEffect } from "react";

// Made all properties optional to safely handle React Query loading states
export function useSeo({
  title,
  description,
  image,
}: {
  title?: string;
  description?: string;
  image?: string;
}) {
  useEffect(() => {
    const finalTitle = title ? `${title} | Lallu Syndrome` : "Lallu Syndrome";
    document.title = finalTitle;

    const setMeta = (attr: string, name: string, content?: string) => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!content) {
        if (el) el.remove(); // Clean up if no content
        return;
      }
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const defaultDesc = "Notes, experiments, and deep dives into technology.";
    const defaultImage = "/favicon.svg"; // Fallback to your monogram or an OG image

    setMeta("name", "description", description || defaultDesc);
    setMeta("property", "og:title", title || "Lallu Syndrome");
    setMeta("property", "og:description", description || defaultDesc);
    setMeta("property", "og:image", image || defaultImage);
    // Dynamically update the canonical URL to match the current route
    let canonical = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
    // Inject JSON-LD for Rich Snippets
    let script = document.getElementById("seo-jsonld") as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = "seo-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: title || "Lallu Syndrome",
      image: image || defaultImage,
      description: description || defaultDesc,
    });
  }, [title, description, image]);
}
