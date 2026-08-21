import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import {
  Configure,
  Highlight,
  InstantSearch,
  useHits,
  useInstantSearch,
  useSearchBox,
} from 'react-instantsearch';
import type { BaseHit } from 'instantsearch.js';

type ArticleSearchHit = BaseHit & {
  objectID: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  readingTime: number;
  publishedAt: string;
};

const algoliaAppId = import.meta.env.VITE_ALGOLIA_APP_ID as string | undefined;
const algoliaSearchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY as string | undefined;

const searchClient =
  algoliaAppId && algoliaSearchKey
    ? algoliasearch(algoliaAppId, algoliaSearchKey)
    : null;

function SearchModal({
  open,
  onClose,
}: Readonly<{
  open: boolean;
  onClose: () => void;
}>) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { query, refine } = useSearchBox();
  const { items: articleHits } = useHits<ArticleSearchHit>();
  const { status } = useInstantSearch();

  useEffect(() => {
    if (open) {
      // Small timeout to allow the DOM to render the input before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      refine(''); // Clear query when closing so it's fresh next time
    }
    // Note: removed `refine` from dependencies to prevent effect re-runs 
    // if the instantsearch hook returns a new function reference on render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const goToArticle = (slug: string) => {
    refine('');
    onClose();
    navigate(`/articles/${slug}`);
  };

  const renderSearchResults = () => {
    if (!query.trim()) {
      return (
        <p className="px-4 py-8 text-center text-sm text-text-muted">
          Start typing to search published articles...
        </p>
      );
    }

    if (status === 'loading' || status === 'stalled') {
      return (
        <p className="px-4 py-8 text-center text-sm text-text-muted">
          Searching...
        </p>
      );
    }

    if (articleHits.length === 0) {
      return (
        <p className="px-4 py-8 text-center text-sm text-text-muted">
          No articles found for "{query}".
        </p>
      );
    }

    return articleHits.map((hit) => (
      <button
        key={hit.objectID}
        type="button"
        onClick={() => goToArticle(hit.slug)}
        className="w-full rounded-lg px-4 py-3 text-left transition-colors hover:bg-elevated group"
      >
        <span className="block text-base font-medium text-text-primary group-hover:text-accent transition-colors">
          <Highlight hit={hit} attribute="title" />
        </span>
        {hit.excerpt ? (
          <span className="mt-1 block text-sm text-text-secondary line-clamp-2">
            <Highlight hit={hit} attribute="excerpt" />
          </span>
        ) : null}
        <span className="mt-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
          {hit.category} · {hit.readingTime} min read
        </span>
      </button>
    ));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-0 bg-bg/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-slide-up">
        {/* Search Input Area */}
        <div className="border-b border-border-subtle p-4">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-text-muted shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => refine(event.target.value)}
              placeholder="Search articles..."
              className="w-full bg-transparent text-lg text-text-primary placeholder:text-text-muted focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => refine('')}
                className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {renderSearchResults()}
        </div>
      </div>
    </div>
  );
}

export function NavbarSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
      // Bonus: Cmd/Ctrl + K to open/close search globally
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!searchClient) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors duration-200"
        aria-label="Search"
      >
        <Search size={18} />
      </button>
      
      <InstantSearch
        searchClient={searchClient}
        indexName="articles"
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure hitsPerPage={8} />
        <SearchModal
          open={open}
          onClose={() => setOpen(false)}
        />
      </InstantSearch>
    </>
  );
}