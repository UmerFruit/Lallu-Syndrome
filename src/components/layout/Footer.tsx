import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const PORTFOLIO_URL = 'https://umerfruit.dev';
const GITHUB_URL = 'https://github.com/UmerFruit';
const LINKEDIN_URL = 'https://linkedin.com/in/umerfarooq';

export function Footer() {
  return (
    <footer className="border-t border-border-subtle mt-20">
      <div className="max-w-content mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <Link to="/" className="font-serif text-lg font-semibold text-text-primary hover:text-accent transition-colors">
              Lallu Syndrome
            </Link>
            <p className="text-sm text-text-muted max-w-xs">
              Notes, experiments, and deep dives into technology.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted">Navigate</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/articles" className="text-text-secondary hover:text-text-primary transition-colors">
                  Articles
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-text-secondary hover:text-text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted">Elsewhere</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-0.5">
                  Portfolio <ArrowUpRight size={14} />
                </a>
              </li>
              <li>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-0.5">
                  GitHub <ArrowUpRight size={14} />
                </a>
              </li>
              <li>
                <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-0.5">
                  LinkedIn <ArrowUpRight size={14} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Lallu Syndrome. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            by Umer Farooq
          </p>
        </div>
      </div>
    </footer>
  );
}
