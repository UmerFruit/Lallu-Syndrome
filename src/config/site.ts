export const siteConfig = {
  name: 'Lallu Syndrome',
  description: 'Notes, experiments, and deep dives into technology.',
  creator: {
    name: 'Umer Farooq',
    avatarUrl:
      'https://sakhudjwzeyhtixjqrsn.supabase.co/storage/v1/object/public/avatars/mine.webp',
    links: [
      { label: 'Portfolio', href: 'https://umerfruit.dev' },
      { label: 'GitHub', href: 'https://github.com/UmerFruit' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/umer-farooq-242130277/' },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;