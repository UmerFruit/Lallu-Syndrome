// scripts/sitemap.js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY // Add this to your build env vars

if (!url || !key) {
  console.warn('⚠️ Skipping sitemap generation: Missing Supabase env vars.')
  process.exit(0)
}

const supabase = createClient(url, key)
const { data: articles } = await supabase.from('articles').select('slug, updated_at').eq('status', 'published')
const { data: writers } = await supabase.from('profiles').select('username').not('username', 'is', null)

const siteUrl = 'https://syndrome.umerfruit.dev' // Update with your domain

const urls = [
  { loc: '/', priority: '1.0' },
  { loc: '/latest', priority: '0.8' },
  ...(articles || []).map(a => ({ loc: `/articles/${a.slug}`, lastmod: a.updated_at, priority: '0.9' })),
  ...(writers || []).map(w => ({ loc: `/writers/${w.username}`, priority: '0.6' }))
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${siteUrl}${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority || '0.5'}</priority>
  </url>`).join('\n')}
</urlset>`

writeFileSync('public/sitemap.xml', xml)
console.log(`Generated sitemap.xml with ${urls.length} URLs`)
