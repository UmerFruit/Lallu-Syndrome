// middleware.ts

export const config = {
  // Only run this middleware on public content routes
  matcher: ['/articles/:path*', '/writers/:path*', '/p/:path*', '/latest', '/'],
}

export default async function middleware(req: Request) {
  const ua = req.headers.get('user-agent') || ''
  
  // ONLY run for social bots and search crawlers. Real users bypass this entirely.
  if (!/bot|crawler|spider|twitter|linkedin|facebook|whatsapp|telegram|discord|slack/i.test(ua)) {
    return fetch(req) // Pass through to the Vite SPA
  }

  const url = new URL(req.url)
  const slug = url.pathname.split('/').pop()
  
  // Determine which Supabase table to query based on the route
  let table = 'articles'
  let select = 'title,cover_image,content' // Note: 'content' instead of 'excerpt'
  let queryParam = `slug=eq.${slug}`
  
  if (url.pathname.startsWith('/writers/')) { 
    table = 'profiles'
    select = 'display_name,bio,avatar_url'
    queryParam = `username=eq.${slug}` // Profiles use 'username', not 'slug'
  }
  if (url.pathname.startsWith('/p/')) { 
    table = 'publications'
    select = 'name,description,logo_url'
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return fetch(req)
  }

  try {
    // Fetch data directly from Supabase PostgREST
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${queryParam}&select=${select}&limit=1`, {
      headers: { 
        apikey: supabaseKey, 
        Authorization: `Bearer ${supabaseKey}` 
      }
    })
    
    const data = await res.json()
    if (!data || data.length === 0) return fetch(req) // Fallback to default SPA
    
    const item = data[0]
    const title = item.title || item.display_name || item.name || 'Lallu Syndrome'
    
    // Strip HTML tags from Tiptap content for a clean description, limit to 160 chars
    const rawDesc = item.content || item.bio || item.description || 'Notes, experiments, and deep dives into technology.'
    const desc = rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 160)
    
    const image = item.cover_image || item.avatar_url || item.logo_url || 'https://sakhudjwzeyhtixjqrsn.supabase.co/storage/v1/object/public/media/coverShot.png'

    // Fetch your base index.html from the deployment
    const htmlRes = await fetch(new URL('/index.html', req.url))
    let html = await htmlRes.text()

    // Inject the dynamic tags via simple string replacement
    html = html.replace(/<title>.*?<\/title>/, `<title>${title} | Lallu Syndrome</title>`)
    html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${desc}" />`)
    
    // Open Graph (Facebook, LinkedIn, Discord)
    html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`)
    html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${desc}" />`)
    html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${image}" />`)
    
    // Twitter Cards
    html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${title}" />`)
    html = html.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${desc}" />`)
    html = html.replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${image}" />`)

    return new Response(html, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // Cache the bot response for 1 hour
      },
    })
  } catch {
    // If anything fails, just serve the normal SPA
    return fetch(req)
  }
}