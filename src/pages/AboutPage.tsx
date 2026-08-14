import { PageContainer } from '@/components/layout/Navbar';
import { ArrowUpRight } from 'lucide-react';
import { getCategories } from '@/services/categoryService';

const PORTFOLIO_URL = 'https://umerfruit.dev';
const GITHUB_URL = 'https://github.com/UmerFruit';
const LINKEDIN_URL = 'https://linkedin.com/in/umerfarooq';

const AUTHOR_PHOTO = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTcmwbRhukHR-WaeLkoUZIJQzBr7khQNXlmA&s';

export function AboutPage() {
  const categories = async () => getCategories();

  return (
    <PageContainer className="py-8 md:py-12">
      <div className="max-w-2xl space-y-16">
        {/* About Lallu Syndrome */}
        <section>
          <h2 className="font-mono text-xs uppercase tracking-wider text-text-muted mb-4">
            About Lallu Syndrome
          </h2>
          <p className="font-serif text-xl md:text-2xl text-text-primary leading-relaxed">
            A place where I write about technology, things I'm building, and things I spend far too much time trying to understand.
          </p>
        </section>

        {/* About the Author */}
        <section>
          <h2 className="font-mono text-xs uppercase tracking-wider text-text-muted mb-6">
            About the Author
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <img
              src={AUTHOR_PHOTO}
              alt="Umer Farooq"
              className="w-24 h-24 rounded-card object-cover flex-shrink-0"
            />
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-medium text-text-primary">Umer Farooq</h3>
              <p className="text-text-secondary leading-relaxed">
                Software engineer working across web platforms, systems, and developer tooling. I write here to think out loud, document what I learn, and occasionally rant about abstractions that cost more than they save.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href={PORTFOLIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  Portfolio <ArrowUpRight size={14} />
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  GitHub <ArrowUpRight size={14} />
                </a>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  LinkedIn <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* What I Write About */}
        <section>
          <h2 className="font-mono text-xs uppercase tracking-wider text-text-muted mb-6">
            What I Write About
          </h2>
          <ul className="space-y-3">
            {categories.map((cat) => (
              <li key={cat.slug} className="border-b border-border-subtle pb-3">
                <span className="font-serif text-lg text-text-primary">{cat.name}</span>
                <span className="block text-sm text-text-muted mt-0.5">{cat.description}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageContainer>
  );
}
