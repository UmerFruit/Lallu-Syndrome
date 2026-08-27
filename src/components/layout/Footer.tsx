import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { siteConfig } from '@/config/site';

const linkClass =
  'text-text-secondary hover:text-text-primary transition-colors';

export function Footer() {
  return (
    <footer className="border-t border-border-subtle mt-20">
      <div className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <Link
              to="/"
              className="font-serif text-lg font-semibold text-text-primary hover:text-accent transition-colors"
            >
              {siteConfig.name}
            </Link>
            <p className="text-sm text-text-muted max-w-xs">
              {siteConfig.description}
            </p>
            <p className="text-sm text-text-muted max-w-xs mt-3">
              Have feedback? Drop me an email at{' '}
              <a
                href="mailto:umerfarooq1105@gmail.com"
                className="text-text-secondary hover:text-text-primary underline decoration-border hover:decoration-accent transition-colors"
              >
                umerfarooq1105@gmail.com
              </a>
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Navigate
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/latest" className={linkClass}>Latest</Link></li>
              <li><Link to="/articles" className={linkClass}>Articles</Link></li>
              <li><Link to="/about" className={linkClass}>About</Link></li>
              <li><Link to="/creator" className={linkClass}>Creator</Link></li>
              <li><Link to="/dashboard" className={linkClass}>Dashboard</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Elsewhere
            </h3>
            <ul className="space-y-2 text-sm">
              {siteConfig.creator.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${linkClass} inline-flex items-center gap-0.5`}
                  >
                    {link.label} <ArrowUpRight size={14} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            by{' '}
            <Link
              to="/creator"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              {siteConfig.creator.name + " @UmerFruit"}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}