import { algoliasearch } from 'algoliasearch';
import {
    InstantSearch,
    Hits,
    Highlight,
    useInstantSearch,
    useSearchBox,
    Configure,
} from 'react-instantsearch';
import type { Hit } from 'instantsearch.js';
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageContainer } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/utils/date';

type ArticleHitType = Hit<{
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    author: string;
    publishedAt: string;
    readingTime: number;
}>;

const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID as string;
const ALGOLIA_SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY as string;

const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

function CustomSearchBox() {
  const { query, refine } = useSearchBox();
  const [inputValue, setInputValue] = useState(query);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 1. Instantly update local input so typing/deleting is butter smooth
    setInputValue(newValue);

    // 2. Clear any pending search execution
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 3. Debounce refine call by 200ms to stop rapid backspaces from thrashing the browser
    timerRef.current = setTimeout(() => {
      refine(newValue);
    }, 200);
  };

  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="search"
        value={inputValue}
        onChange={handleChange}
        placeholder="Search articles..."
        className="w-full rounded border border-border bg-surface pl-10 pr-4 py-3 text-text-primary placeholder:text-text-muted text-base focus:border-accent focus:outline-none"
        autoFocus
      />
    </div>
  );
}

function ArticleHit({ hit }: Readonly<{ hit: ArticleHitType }>) {
    return (
        <Link
            to={`/articles/${hit.slug}`}
            className="block group p-4 rounded border border-border-subtle bg-surface hover:border-border transition-colors"
        >
            <div className="flex items-center gap-2 mb-2">
                <Badge variant="accent">{hit.category}</Badge>
                <span className="font-mono text-xs text-text-muted">
                    {hit.readingTime} min read
                </span>
            </div>
            <h3 className="font-serif text-lg font-medium text-text-primary group-hover:text-accent transition-colors">
                <Highlight hit={hit} attribute="title" />
            </h3>
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                <Highlight hit={hit} attribute="excerpt" />
            </p>
            <p className="mt-2 font-mono text-xs text-text-muted">
                {hit.author} · {formatDate(hit.publishedAt)}
            </p>
        </Link>
    );
}

function SearchResults() {
    const { status, results } = useInstantSearch();

    if (status === 'loading' || status === 'stalled') {
        return <p className="text-text-muted py-8 text-center">Searching...</p>;
    }

    if (results?.nbHits === 0) {
        return <p className="text-text-muted py-8 text-center">No articles found.</p>;
    }

    return <Hits hitComponent={ArticleHit} />;
}

export function SearchPage() {
    return (
        <InstantSearch
            searchClient={searchClient}
            indexName="articles"
            future={{ preserveSharedStateOnUnmount: true }}
        >
            <Configure hitsPerPage={20} />
            <PageContainer className="py-8 md:py-12">
                <h1 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary tracking-tight mb-6">
                    Search
                </h1>
                <CustomSearchBox />
                <div className="mt-6">
                    <SearchResults />
                </div>
            </PageContainer>
        </InstantSearch>
    );
}