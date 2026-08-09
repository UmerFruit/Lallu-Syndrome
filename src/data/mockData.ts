import type { Article, Category, Comment } from '@/types';

export const categories: Category[] = [
  { slug: 'development', name: 'Development', description: 'Building software, frameworks, and the systems behind them.' },
  { slug: 'ai', name: 'AI', description: 'Machine learning, LLMs, and the intelligence layer of modern software.' },
  { slug: 'cybersecurity', name: 'Cybersecurity', description: 'Security research, vulnerabilities, and defensive engineering.' },
  { slug: 'web', name: 'Web', description: 'Frontend, backend, and everything in the browser and beyond.' },
  { slug: 'hardware', name: 'Hardware', description: 'Chips, devices, and the physical infrastructure of computing.' },
  { slug: 'software', name: 'Software', description: 'Tools, applications, and the software we use every day.' },
  { slug: 'other', name: 'Other', description: 'Everything else that caught my attention.' },
];

const author = {
  name: 'Umer Farooq',
  avatar: 'https://images.unsplash.com/photo-1500648767731-5ca545ace573?w=200&h=200&fit=crop&crop=faces&q=80',
  bio: 'Software engineer writing about technology, systems, and the things I spend far too much time trying to understand.',
};

export const articles: Article[] = [
  {
    id: '1',
    slug: 'building-a-type-safe-api-with-zod-and-typescript',
    title: 'Building a Type-Safe API with Zod and TypeScript',
    excerpt: 'Runtime validation and compile-time types from a single source of truth. A practical guide to building APIs that catch their own mistakes before your users do.',
    content: `## The Problem with TypeScript APIs

TypeScript gives you compile-time safety, but at runtime, your types are gone. An API endpoint that expects a \`{ name: string; age: number }\` body will happily accept \`{ name: 42, age: "hello" }\` because the type annotation is a lie the compiler tells you.

**The fix**: validate at the boundary, and derive types from the validation schema.

## Setting Up Zod

\`\`\`typescript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
});

type User = z.infer<typeof UserSchema>;
// { name: string; email: string; age?: number; role: 'admin' | 'user' | 'guest' }
\`\`\`

One schema. One type. No drift.

## Using It in an Express Handler

\`\`\`typescript
app.post('/users', async (req, res) => {
  const result = UserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: result.error.issues,
    });
  }

  const user: User = result.data;
  // user is now fully typed and validated
  await db.insert(user);
  res.status(201).json(user);
});
\`\`\`

> If your validation schema and your TypeScript type can disagree, they will. Zod eliminates that possibility entirely.

## Composing Schemas

Real APIs have nested data. Zod handles this elegantly:

\`\`\`typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zip: z.string().regex(/^\\d{5}$/),
});

const OrderSchema = z.object({
  id: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
  })).min(1),
  shippingAddress: AddressSchema,
  placedAt: z.string().datetime(),
});

type Order = z.infer<typeof OrderSchema>;
\`\`\`

## Transformations

Sometimes the wire format differs from what your code wants:

\`\`\`typescript
const DateString = z.string().transform((val) => new Date(val));

const EventSchema = z.object({
  name: z.string(),
  date: DateString,
  attendees: z.string().transform((s) => s.split(',').map((s) => s.trim())),
});
\`\`\`

## Error Handling That Actually Helps

Zod's error format is structured and machine-readable:

\`\`\`typescript
const result = UserSchema.safeParse({ name: '', email: 'not-an-email' });
// result.error.issues[0] = {
//   code: 'too_small',
//   minimum: 1,
//   type: 'string',
//   inclusive: true,
//   exact: false,
//   message: 'String must contain at least 1 character(s)',
//   path: ['name']
// }
\`\`\`

| Field | Error | Message |
|-------|-------|---------|
| name | too_small | Must contain at least 1 character |
| email | invalid_string | Invalid email |
| age | invalid_type | Expected number, received undefined |

## Conclusion

Zod isn't just a validation library — it's a type system multiplier. You write one schema, and you get runtime validation, compile-time types, and structured error handling for free. If you're building a TypeScript API without it, you're doing more work for less safety.`,
    category: 'development',
    tags: ['TypeScript', 'Zod', 'API', 'Validation'],
    coverImage: 'https://cdn.thenewstack.io/media/2022/01/10b88c68-typescript-logo.png',
    author,
    publishedAt: '2026-08-08T09:00:00Z',
    updatedAt: '2026-08-08T14:30:00Z',
    readingTime: 8,
    likes: 47,
    status: 'published',
  },
  {
    id: '2',
    slug: 'the-hidden-cost-of-abstraction-layers',
    title: 'The Hidden Cost of Abstraction Layers',
    excerpt: 'Every abstraction you add is a tax you pay forever. When does the convenience stop being worth it, and how do you know when you have crossed the line?',
    content: `## The Promise

Abstractions are supposed to make us faster. Wrap the database, wrap the HTTP client, wrap the cache, wrap the message queue. Now your business logic doesn't care about infrastructure. Clean. Testable. Portable.

## The Reality

Every layer you add is:

- **A thing to learn** — new developers must understand not just the technology but your wrapper around it
- **A thing to debug** — when something breaks, you trace through the abstraction, then the underlying system, then the gap between them
- **A thing to maintain** — the upstream library changes, your abstraction needs updating
- **A thing that leaks** — eventually the underlying system pokes through, and your abstraction becomes a lie with extra steps

## When Abstractions Earn Their Keep

Good abstractions hide *complexity that would otherwise be repeated and error-prone*:

\`\`\`typescript
// This is worth abstracting — retry logic is tedious and easy to get wrong
async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries: number; delay: number }
): Promise<T> {
  for (let i = 0; i <= opts.retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === opts.retries) throw err;
      await sleep(opts.delay * Math.pow(2, i));
    }
  }
  throw new Error('unreachable');
}
\`\`\`

\`\`\`typescript
// This is NOT worth abstracting — you've added a layer with zero value
class UserRepository {
  constructor(private db: Database) {}
  findById(id: string) { return this.db.users.findById(id); }
  create(data: UserData) { return this.db.users.create(data); }
  update(id: string, data: Partial<UserData>) { return this.db.users.update(id, data); }
  delete(id: string) { return this.db.users.delete(id); }
}
\`\`\`

The second example is a pass-through. It adds a class, a constructor, and an import, and gives you nothing in return. If you ever need to swap databases, you'll rewrite the repository anyway because the query patterns will differ.

> The best abstraction is the one you don't write until you actually need it.

## The Rule of Three

Don't abstract on the first repetition. Don't abstract on the second. Abstract on the third — but only if the pattern is stable.

1. **First time**: Write it inline. You don't know enough yet.
2. **Second time**: Copy-paste. You're still learning the shape.
3. **Third time**: Now you know the pattern. Abstract with confidence.

## The Leaky Abstraction Tax

| Abstraction | What It Hides | What Leaks |
|-------------|--------------|------------|
| ORM | SQL | N+1 queries, transaction boundaries |
| Fetch wrapper | HTTP details | Timeout behavior, streaming |
| Cache layer | Cache invalidation | Stale data, race conditions |
| Config loader | Environment | Missing keys, type coercion |

## Conclusion

Abstractions aren't free. They're a trade: complexity now for convenience later. The problem is that the complexity compounds and the convenience depreciates. Before adding a layer, ask yourself: what happens if I just don't?`,
    category: 'development',
    tags: ['Architecture', 'Abstraction', 'Software Design'],
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-08-05T09:00:00Z',
    readingTime: 6,
    likes: 89,
    status: 'published',
  },
  {
    id: '3',
    slug: 'understanding-llm-tokenization-and-why-it-matters',
    title: 'Understanding LLM Tokenization and Why It Matters',
    excerpt: 'Tokens are not words. Tokens are not characters. They are something in between, and understanding them changes how you think about every LLM interaction.',
    content: `## What Is a Token?

A token is a chunk of text. It might be a word, a part of a word, or a single character. Large language models don't see words — they see sequences of token IDs.

The sentence "The cat sat on the mat" might tokenize as:

\`\`\`
["The", " cat", " sat", " on", " the", " mat"]
\`\`\`

But "The cat sat on the mat!!!" might tokenize as:

\`\`\`
["The", " cat", " sat", " on", " the", " mat", "!!", "!"]
\`\`\`

The exclamation marks are split because they're rare in the training data.

## Byte Pair Encoding (BPE)

Most modern LLMs use BPE or a variant. The process:

1. Start with every byte as a separate token
2. Find the most common pair of adjacent tokens
3. Merge them into a single token
4. Repeat until the vocabulary is full

This means common words become single tokens, rare words get split, and the model's "vocabulary" is really a frequency-optimized set of subwords.

## Why This Matters

### Cost

You pay per token. If your prompt is 10,000 tokens and the response is 2,000 tokens, you pay for 12,000. Understanding tokenization helps you optimize:

\`\`\`python
# Inefficient: repeated system message
messages = [
    {"role": "system", "content": LONG_SYSTEM_PROMPT},
    {"role": "user", "content": "What is 2+2?"},
    {"role": "assistant", "content": "4"},
    {"role": "user", "content": "What is 3+3?"},
    {"role": "assistant", "content": "6"},
    {"role": "user", "content": "What is 4+4?"},
]
# The system prompt is re-sent every time. Cache it.

# Efficient: use prompt caching
messages = [
    {"role": "system", "content": LONG_SYSTEM_PROMPT},  # cached after first call
    {"role": "user", "content": "What is 4+4?"},
]
\`\`\`

### Context Windows

Every token in your conversation history counts toward the context limit. A long conversation can silently exceed the window, causing the model to "forget" earlier context.

### Multilingual Quirks

English text is tokenized efficiently because training data is mostly English. Other languages can cost 2-5x more tokens for the same semantic content.

| Language | Text | Approximate Tokens |
|----------|------|-------------------|
| English | "Hello, how are you?" | 6 |
| Spanish | "Hola, ¿cómo estás?" | 9 |
| Japanese | "こんにちは、お元気ですか？" | 12 |
| Arabic | "مرحبا، كيف حالك؟" | 15 |

## Practical Implications

1. **Count tokens before sending** — don't guess, measure
2. **Trim conversation history** — summarize or truncate old turns
3. **Be mindful of whitespace** — leading spaces are tokens too
4. **Test edge cases** — rare characters, emojis, and code can tokenize unpredictably

> "A token is a word" is the most common misconception about LLMs. It's also the most expensive one.

## Conclusion

Tokenization is the invisible layer between your text and the model's understanding. Once you see it, you can't unsee it — and your prompts, your costs, and your context management all get better.`,
    category: 'ai',
    tags: ['LLM', 'Tokenization', 'NLP', 'GPT'],
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-08-02T09:00:00Z',
    readingTime: 7,
    likes: 134,
    status: 'published',
  },
  {
    id: '4',
    slug: 'sql-injection-in-2026-still-a-thing',
    title: 'SQL Injection in 2026: Still a Thing',
    excerpt: 'Despite parameterized queries being a solved problem since the 2000s, SQL injection remains in the OWASP Top 10. Here is why it refuses to die.',
    content: `## A Solved Problem That Isn't

SQL injection was described in 1998. Parameterized queries have been available in every major language for over two decades. And yet, SQL injection remains the third most common web vulnerability in 2026.

How?

## The Many Faces of SQL Injection

### Classic: String Concatenation

\`\`\`typescript
// DON'T DO THIS
app.get('/users', (req, res) => {
  const query = "SELECT * FROM users WHERE name = '" + req.query.name + "'";
  db.execute(query);
});
\`\`\`

Input: \`name = "'; DROP TABLE users; --"\`

### Subtle: Dynamic Column Names

\`\`\`typescript
// Parameterized queries don't help here — you can't parameterize identifiers
app.get('/sort', (req, res) => {
  const column = req.query.sortBy;
  const query = \`SELECT * FROM products ORDER BY \${column}\`;
  db.execute(query);
});
\`\`\`

Input: \`sortBy = "1; DELETE FROM products WHERE 1=1; --"\`

### Sneaky: Second-Order Injection

Data is stored safely, then used unsafely later:

\`\`\`typescript
// Step 1: User registers with username "admin'; --"
// This is stored correctly via parameterized query.

// Step 2: Somewhere else in the codebase...
const username = getUserFromDb(userId).username;
const query = "SELECT * FROM logs WHERE action_by = '" + username + "'";
// Now the injection happens — but not at the input point.
\`\`\`

## The Real Problem: Culture, Not Code

| Layer | What We Tell Ourselves | What Actually Happens |
|-------|----------------------|----------------------|
| ORM | "The ORM handles it" | Raw queries bypass it |
| Code review | "Someone will catch it" | Reviewers miss it |
| Testing | "We test for this" | Tests use clean data |
| WAF | "The firewall blocks it" | Encoding bypasses rules |

> The vulnerability isn't in the SQL. It's in the assumption that someone else is handling it.

## Defense in Depth

### 1. Parameterize Everything

\`\`\`typescript
// Correct
db.query('SELECT * FROM users WHERE name = $1', [name]);

// Also correct — ORM with built-in parameterization
await db.users.findFirst({ where: { name } });
\`\`\`

### 2. Validate Identifiers Against an Allowlist

\`\`\`typescript
const ALLOWED_SORT = ['name', 'price', 'created_at'] as const;
type SortField = typeof ALLOWED_SORT[number];

function safeSort(input: string): SortField {
  if (!ALLOWED_SORT.includes(input as SortField)) {
    throw new Error('Invalid sort field');
  }
  return input as SortField;
}
\`\`\`

### 3. Least Privilege

Your application database user should not be able to \`DROP TABLE\`. Ever.

\`\`\`sql
-- Application user
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO app_user;

-- Migration user (used only during deployments)
GRANT ALL ON products TO migration_user;
\`\`\`

### 4. Query Structure Validation

For truly dynamic queries, validate the structure, not just the inputs:

\`\`\`typescript
import { z } from 'zod';

const SortSchema = z.object({
  field: z.enum(['name', 'price', 'created_at']),
  direction: z.enum(['ASC', 'DESC']),
});
\`\`\`

## Conclusion

SQL injection persists because it's not really a technical problem — it's an organizational one. The fix has been known for 25 years. The gap between knowing and doing is where vulnerabilities live.`,
    category: 'cybersecurity',
    tags: ['SQL Injection', 'Security', 'Web Security', 'OWASP'],
    coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-07-28T09:00:00Z',
    readingTime: 9,
    likes: 72,
    status: 'published',
  },
  {
    id: '5',
    slug: 'the-state-of-css-container-queries',
    title: 'The State of CSS Container Queries',
    excerpt: 'After years of waiting, container queries are finally here. A practical look at what they solve, where they fall short, and how to use them today.',
    content: `## The Problem Container Queries Solve

Media queries ask about the *viewport*. But components don't live in the viewport — they live in containers. A sidebar card and a full-width hero might be the same component, but media queries can't tell them apart.

\`\`\`css
/* Before: this is wrong */
.card {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .card {
    flex-direction: row;
  }
}
\`\`\`

This works if the card is always full-width on desktop. But put it in a sidebar? It's still \`row\` even though it only has 300px of space.

## Container Queries to the Rescue

\`\`\`css
.card-wrapper {
  container-type: inline-size;
}

.card {
  display: flex;
  flex-direction: column;
}

@container (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
\`\`\`

Now the card responds to its *container*, not the viewport. Put it in a narrow sidebar → column. Put it in the main content → row.

## Real-World Example

\`\`\`html
<div class="layout">
  <aside class="sidebar">
    <div class="card-wrapper">
      <article class="card">...</article>
    </div>
  </aside>
  <main class="content">
    <div class="card-wrapper">
      <article class="card">...</article>
    </div>
  </main>
</div>
\`\`\`

Both cards use the same CSS. Both look correct. No JavaScript, no resize observers, no hacks.

## Container Units

\`\`\`css
.hero-title {
  font-size: clamp(2rem, 10cqi, 5rem);
}
\`\`\`

\`cqi\` is 1% of the container's inline size. This scales the title based on the container, not the viewport.

| Unit | Relative To |
|------|------------|
| \`cqw\` | Container width |
| \`cqh\` | Container height |
| \`cqi\` | Container inline size |
| \`cqb\` | Container block size |
| \`cqw\` | Container width |
| \`cmin\` | Container smaller dimension |
| \`cmax\` | Container larger dimension |

## Where Container Queries Fall Short

1. **No container query for height** — \`container-type: size\` requires explicit height, which is rare
2. **No \`@container\` for style queries** — widely requested, still experimental
3. **Performance** — each \`container-type\` creates a containment context. Don't overuse it.

> Container queries don't replace media queries. They complement them. Use media queries for page layout, container queries for components.

## Browser Support

Container queries have baseline support across all modern browsers as of 2024. If you're still supporting IE11, you have bigger problems.

## Conclusion

Container queries are the most significant CSS feature since flexbox. They let you build truly modular components that adapt to their context. Start using them — your design systems will thank you.`,
    category: 'web',
    tags: ['CSS', 'Container Queries', 'Responsive Design', 'Frontend'],
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-07-22T09:00:00Z',
    readingTime: 6,
    likes: 58,
    status: 'published',
  },
  {
    id: '6',
    slug: 'arm-vs-risc-v-the-architecture-wars',
    title: 'ARM vs RISC-V: The Architecture Wars',
    excerpt: 'ARM dominates mobile. RISC-V wants to be everywhere. A look at the technical, political, and economic forces shaping the next decade of chip design.',
    content: `## The Current Landscape

ARM Holdings designs instruction set architectures (ISAs) and licenses them to chipmakers. If you're reading this on a phone, there's a 99% chance it's running an ARM chip. Apple Silicon, Qualcomm Snapdragon, Samsung Exynos — all ARM.

RISC-V is an open-source ISA. No licensing fees, no restrictions, no single owner. Anyone can implement it.

## Why This Matters Now

| Factor | ARM | RISC-V |
|--------|-----|--------|
| Licensing | Paid, controlled | Free, open |
| Ecosystem | Massive | Growing fast |
| Performance | Proven, world-class | Catching up |
| Politics | Geopolitically sensitive | Neutral |
| Customization | Limited | Unlimited |

## The Technical Argument

ARM's advantage isn't the ISA — it's the ecosystem. Decades of compiler optimization, tooling, and software support. RISC-V has a cleaner, more modular design, but that doesn't matter if your code runs slower because the compiler isn't as good yet.

### RISC-V's Modular Design

\`\`\`
RV32IMAFDC
│   │││││
│   ││││└─ Compressed instructions
│   │││└── Floating point (double)
│   ││└── Atomic operations
│   │└── Floating point (single)
│   └── Multiplication/division
└──── Base integer ISA (32-bit)
\`\`\`

You only include what you need. A microcontroller might use \`RV32I\`. A desktop-class chip might use \`RV64GC\`. This modularity is RISC-V's biggest technical advantage.

## The Economic Argument

ARM licensing costs vary wildly:
- **Microcontrollers**: cents per chip
- **Application processors**: percentage of chip price
- **Custom architectures**: negotiated, often expensive

RISC-V costs: $0 per chip. You download the spec, implement it, and ship.

> The question isn't whether RISC-V is technically superior. The question is whether the ecosystem gap is worth the zero licensing fee.

## The Political Argument

ARM is a UK company (now owned by SoftBank). In a world of increasing tech sanctions, having your chip architecture controlled by a foreign entity is a strategic risk. China, India, and the EU are all investing heavily in RISC-V for this reason.

## Where RISC-V Wins First

1. **Microcontrollers** — minimal ecosystem needed, cost-sensitive
2. **Custom accelerators** — AI/ML chips where the ISA is internal
3. **Embedded systems** — IoT, automotive, industrial
4. **Education** — universities can teach real architecture without licensing

## Where ARM Stays Dominant

1. **Mobile** — the ecosystem moat is enormous
2. **Laptops/desktops** — Apple Silicon proved ARM can compete at the high end
3. **Servers** — AWS Graviton is gaining real traction

## Conclusion

RISC-V won't kill ARM. But it will erode ARM's margins, capture the low end, and eventually move up. The architecture wars won't be won on technical merit — they'll be won on economics, geopolitics, and ecosystem investment.`,
    category: 'hardware',
    tags: ['ARM', 'RISC-V', 'Architecture', 'Chips'],
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-07-15T09:00:00Z',
    readingTime: 8,
    likes: 103,
    status: 'published',
  },
  {
    id: '7',
    slug: 'why-i-switched-from-vim-to-vs-code-and-back',
    title: 'Why I Switched from Vim to VS Code and Back',
    excerpt: 'A six-month journey through the grass on both sides of the fence. What I learned about editing, productivity, and the lies we tell ourselves about our tools.',
    content: `## The Departure

After 8 years of Vim, I switched to VS Code. My reasons were reasonable:

1. **LSP integration** — VS Code's language servers worked out of the box
2. **Debugging** — actual visual debugging, not GDB in a terminal
3. **Extensions** — a marketplace with everything I could want
4. **Onboarding** — new team members didn't need a Vim tutorial

For three months, it was great. I was productive. The debugger was lovely. Git integration was seamless.

## The Creeping Dissatisfaction

Then I noticed things:

### Latency

Vim opens instantly. VS Code takes 2-5 seconds on the same machine. That sounds trivial until you're opening and closing files hundreds of times a day.

### Keyboard Efficiency

In VS Code, I used the keyboard *more* than in Vim, not less. I had to learn VS Code's keybindings, then extension keybindings, then configure them to not conflict. In Vim, the keybindings *are* the editor.

### The Mouse Creep

VS Code's UX is designed around the mouse. Sure, you can keyboard everything, but the defaults push you toward clicking. I was clicking the file tree, clicking tabs, clicking the sidebar. In Vim, I never touched the mouse.

### Extension Hell

| Extension | What It Did | What Broke |
|-----------|------------|------------|
| Vim mode | Vim keybindings | 40% of features missing |
| GitLens | Git annotations | Slowed large repos |
| Prettier | Formatting | Conflicted with ESLint |
| Remote SSH | Remote dev | Connection drops lost work |

Each extension solved one problem and created two more.

## The Return

I came back to Vim. But I came back *differently*.

### What I Brought Back from VS Code

1. **LSP** — Neovim's built-in LSP client is excellent
2. **Telescope** — fuzzy finder that rivals VS Code's Quick Open
3. **DAP** — Debug Adapter Protocol, visual debugging in terminal
4. **Treesitter** — syntax highlighting that actually works

### What I Left Behind

1. **The mouse** — good riddance
2. **Extension marketplace** — Neovim plugins are code, not black boxes
3. **Settings UI** — my config is a Lua file, version-controlled
4. **Electron** — my editor uses 50MB of RAM, not 500MB

> The tool doesn't make the programmer. But the wrong tool makes the programmer slower, and life is too short for slow editing.

## The Actual Lesson

The best editor is the one that gets out of your way. For some people that's VS Code. For me, it's Neovim. The six months away taught me what I actually valued about Vim — not the hipster cred, not the modal editing worship, but the speed and the keyboard-first philosophy.

## My Current Setup

\`\`\`lua
-- init.lua (simplified)
vim.g.mapleader = ' '

-- LSP
require('lspconfig').tsserver.setup({})
require('lspconfig').rust_analyzer.setup({})

-- Telescope (fuzzy finder)
require('telescope').setup({})
vim.keymap.set('n', '<leader>f', require('telescope.builtin').find_files)
vim.keymap.set('n', '<leader>g', require('telescope.builtin').live_grep)

-- Treesitter
require('nvim-treesitter.configs').setup({
  highlight = { enable = true },
})

-- Completion
require('cmp').setup({
  sources = {
    { name = 'nvim_lsp' },
    { name = 'buffer' },
  },
})
\`\`\`

## Conclusion

Switching editors is not about finding the "best" tool. It's about understanding your own workflow well enough to know what you need. I had to leave Vim to appreciate it. Your journey will be different. The point is to take the journey.`,
    category: 'software',
    tags: ['Vim', 'VS Code', 'Editor', 'Productivity'],
    coverImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-07-10T09:00:00Z',
    readingTime: 7,
    likes: 156,
    status: 'published',
  },
  {
    id: '8',
    slug: 'the-case-against-microservices-for-small-teams',
    title: 'The Case Against Microservices for Small Teams',
    excerpt: 'Microservices solve organizational scaling problems. If you do not have the organization, you do not have the problem. Here is what you actually need.',
    content: `## The Pitch

"Microservices let you scale independently. Different teams can work on different services. You can use the best tool for each job. You can deploy without coordinating."

All true. All irrelevant if you have 5 engineers.

## What Microservices Actually Cost

### Operational Complexity

A monolith is one thing to deploy, monitor, and debug. Ten microservices are ten things to deploy, ten things to monitor, and a distributed system to debug.

\`\`\`yaml
# docker-compose.yml for a "simple" microservices setup
services:
  api-gateway:
  user-service:
  order-service:
  payment-service:
  notification-service:
  search-service:
  analytics-service:
  redis:
  postgres:
  rabbitmq:
  jaeger:      # distributed tracing
  prometheus:  # metrics
  grafana:     # dashboards
\`\`\`

That's 13 containers for what could be one process.

### Network Failure Modes

| Failure | Monolith | Microservices |
|---------|---------|---------------|
| Service down | App crashes | Cascading failures |
| Network latency | Zero | Added per call |
| Partial failure | Impossible | Inevitable |
| Debugging | Stack trace | Distributed tracing setup |

### Data Consistency

In a monolith, a transaction spans your entire operation:

\`\`\`typescript
async function placeOrder(userId: string, items: CartItem[]) {
  return db.transaction(async (tx) => {
    const order = await tx.orders.create({ userId, items });
    await tx.inventory.decrement(items);
    await tx.payments.create({ orderId: order.id, amount: order.total });
    return order;
  });
}
\`\`\`

In microservices, each service owns its database. You need saga patterns, outbox patterns, eventual consistency, and compensation logic. For a 5-person team, this is a tax with no benefit.

## What Small Teams Actually Need

### 1. A Well-Structured Monolith

\`\`\`
src/
  modules/
    users/
      routes.ts
      service.ts
      repository.ts
      types.ts
    orders/
      routes.ts
      service.ts
      repository.ts
      types.ts
    payments/
      routes.ts
      service.ts
      repository.ts
      types.ts
  shared/
    db.ts
    auth.ts
    logger.ts
  app.ts
\`\`\`

Modules, not microservices. Clear boundaries, shared infrastructure.

### 2. Deployment Pipelines

You don't need Kubernetes. You need:

\`\`\`yaml
# A single Dockerfile
FROM node:20-slim
COPY . .
RUN npm ci && npm run build
CMD ["node", "dist/server.js"]
\`\`\`

And a CI pipeline that builds, tests, and deploys. That's it.

### 3. Background Jobs

\`\`\`typescript
// Don't need a message broker for this
import { Queue } from './shared/queue';

const emailQueue = new Queue('emails');
emailQueue.process(async (job) => {
  await sendEmail(job.data.to, job.data.subject, job.data.body);
});
\`\`\`

Use Redis or even the database. You don't need Kafka.

## When to Actually Split

Split when:

1. **Team size > 8** per service boundary
2. **Deployment cadence differs** — one part needs 10 deploys/day, another needs 1/week
3. **Scaling profile differs** — one part needs 100x the resources
4. **Organizational boundaries exist** — different teams, different ownership

> If you're splitting for technical reasons but you're one team, you're creating the problems microservices are meant to solve.

## The Pragmatic Path

1. **Start monolith** — always
2. **Modularize** — clear internal boundaries
3. **Extract when forced** — not before
4. **Extract one at a time** — not all at once

## Conclusion

Microservices are a tool for organizational scaling. If you don't have the organization, you don't have the problem. Build a well-structured monolith, deploy it simply, and split only when the pain of not splitting exceeds the pain of splitting.`,
    category: 'development',
    tags: ['Architecture', 'Microservices', 'Monolith', 'Software Design'],
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-07-05T09:00:00Z',
    readingTime: 9,
    likes: 201,
    status: 'published',
  },
  {
    id: '9',
    slug: 'building-a-home-lab-with-proxmox',
    title: 'Building a Home Lab with Proxmox',
    excerpt: 'A practical guide to turning old hardware into a serious virtualization environment. From installation to VLANs to the services that make it worth doing.',
    content: `## Why a Home Lab?

Because cloud bills are stupid, learning in production is dangerous, and old hardware is free.

## The Hardware

You don't need enterprise gear. You need:

- **Any old PC** with 16GB+ RAM and a CPU that supports virtualization (most do after 2010)
- **A switch** — managed if you want VLANs ($30 used)
- **Storage** — an SSD for Proxmox, HDDs for data
- **A UPS** — optional but strongly recommended

## Installing Proxmox

1. Download the Proxmox VE ISO
2. Flash to a USB drive
3. Boot, install, done

\`\`\`bash
# After install, update and configure
apt update && apt full-upgrade -y

# Remove the "no subscription" nag
sed -i.bak "s/data.status !== 'Active'/false/g" /usr/share/javascript/proxmoxlib-toolkit/proxmoxlib.js
systemctl restart pveproxy
\`\`\`

## Network Architecture

| VLAN | Network | Purpose |
|------|---------|---------|
| 10 | 10.0.10.0/24 | Management (Proxmox host) |
| 20 | 10.0.20.0/24 | Services (Docker, databases) |
| 30 | 10.0.30.0/24 | Lab/Testing |
| 40 | 10.0.40.0/24 | IoT (untrusted devices) |

\`\`\`bash
# /etc/network/interfaces (simplified)
auto vmbr0
iface vmbr0 inet static
  address 10.0.10.2/24
  gateway 10.0.10.1
  bridge-ports eno1
  bridge-stp off
  bridge-fd 0

auto vmbr0.20
iface vmbr0.20 inet static
  address 10.0.20.1/24
\`\`\`

## Essential Services

### 1. Docker Host (LXC)

\`\`\`bash
# Create an LXC container with Docker
pct create 100 debian-12-template \
  --hostname docker \
  --memory 8192 \
  --rootfs local-lvm:32 \
  --features nesting=1

# Enter and install Docker
pct enter 100
curl -fsSL https://get.docker.com | sh
\`\`\`

### 2. Reverse Proxy (Nginx Proxy Manager or Traefik)

\`\`\`yaml
# docker-compose.yml
services:
  npm:
    image: jc21/nginx-proxy-manager:latest
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
\`\`\`

### 3. Ad Blocker (Pi-hole)

\`\`\`yaml
  pihole:
    image: pihole/pihole:latest
    environment:
      TZ: 'America/New_York'
      WEBPASSWORD: 'changeme'
    volumes:
      - ./pihole:/etc/pihole
      - ./dnsmasq:/etc/dnsmasq.d
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "80:80"
\`\`\`

### 4. Monitoring (Grafana + Prometheus)

\`\`\`yaml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
\`\`\`

## Backups

\`\`\`bash
# Proxmox backup job — run nightly
vzdump 100 --storage local --mode snapshot --compress zstd

# Or use Proxmox Backup Server (free, excellent)
pveum storage add pbs-local --type pbs --server 10.0.10.3 --datastore default
\`\`\`

> A home lab without backups is a hobby that will eventually hurt you.

## What Not to Do

1. **Don't expose services directly to the internet** — use a VPN (WireGuard) or Cloudflare Tunnel
2. **Don't skip VLANs** — IoT devices on your main network is asking for trouble
3. **Don't run everything in VMs** — LXC containers use 1/10th the resources
4. **Don't forget backups** — seriously

## Conclusion

A home lab is the cheapest way to learn enterprise-grade infrastructure. You'll make mistakes, break things, and learn more in a month than a year of tutorials. Start small, back up everything, and have fun.`,
    category: 'hardware',
    tags: ['Proxmox', 'Home Lab', 'Virtualization', 'Self-Hosting'],
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cb1977a?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-06-28T09:00:00Z',
    readingTime: 10,
    likes: 91,
    status: 'published',
  },
  {
    id: '10',
    slug: 'prompt-engineering-is-just-engineering',
    title: 'Prompt Engineering Is Just Engineering',
    excerpt: 'The term "prompt engineering" makes it sound like a new discipline. It is not. It is the same engineering principles applied to a new interface.',
    content: `## The Hype

"Prompt engineering is the most important skill of the 21st century."

No. It's debugging with extra steps and fewer stack traces.

## What Prompt Engineering Actually Is

1. **Understanding your system's constraints** — context window, token limits, temperature, system prompts
2. **Designing inputs that produce reliable outputs** — structured prompts, few-shot examples, chain-of-thought
3. **Testing and iterating** — evaluation sets, regression testing, edge cases
4. **Handling failure gracefully** — retries, fallbacks, output validation

This is just... engineering. With a weird I/O interface.

## The Patterns

### Structured Output

\`\`\`typescript
// Don't do this
const prompt = "Tell me about TypeScript";
const response = await llm.complete(prompt);
// response is unstructured text — you'll regex-parse it and suffer

// Do this
const prompt = \`
You are a technical writer. Output a JSON object with this schema:
{
  "title": string,
  "summary": string,
  "keyPoints": string[],
  "difficulty": "beginner" | "intermediate" | "advanced"
}

Topic: TypeScript
\`;

const response = await llm.complete(prompt, { format: 'json' });
const article = ArticleSchema.parse(response);
\`\`\`

### Few-Shot Learning

\`\`\`
Classify the sentiment of the following reviews:

Review: "This product is amazing!"
Sentiment: positive

Review: "Worst purchase ever."
Sentiment: negative

Review: "It's okay, nothing special."
Sentiment: neutral

Review: "I've had better but it works."
Sentiment:
\`\`\`

### Chain of Thought

\`\`\`
Question: A store sells apples at $2 each. If you buy 5, you get 20% off the total. How much for 7 apples?

Think step by step:
1. 7 apples at $2 each = $14
2. The discount applies to purchases of 5 or more
3. 20% off $14 = $14 × 0.8 = $11.20

Answer: $11.20
\`\`\`

## The Anti-Patterns

### Over-Prompting

\`\`\`
// Bad
"You are an expert software engineer with 20 years of experience in TypeScript,
React, Node.js, PostgreSQL, Docker, Kubernetes, AWS, and you graduated from MIT
with a 4.0 GPA and you love clean code and you always write tests and..."

// The model doesn't care about the persona. It cares about the task.
"Review this TypeScript code for bugs and security issues."
\`\`\`

### Treating LLMs Like Databases

\`\`\`typescript
// Bad — asking the model to "remember"
const prompt = "Based on our previous conversation about user authentication, ...";

// Good — providing the context explicitly
const prompt = \`Context: We are designing a user authentication system.
Requirements:
- Email/password
- JWT tokens
- Refresh token rotation

Question: How should we handle token storage on the client?\`;
\`\`\`

> The model has no memory. Every call is stateless. If you need state, you manage it.

## Evaluation

This is where "prompt engineering" becomes actual engineering:

\`\`\`typescript
interface EvalCase {
  input: string;
  expectedOutput: string;
  check: (output: string) => boolean;
}

const evalCases: EvalCase[] = [
  {
    input: "Summarize: [article about React 19]",
    expectedOutput: "A summary mentioning concurrent rendering and actions",
    check: (output) => output.includes('concurrent') && output.length < 500,
  },
  // ... 50 more cases
];

function runEval(cases: EvalCase[]): number {
  let passed = 0;
  for (const c of cases) {
    const output = await runPrompt(c.input);
    if (c.check(output)) passed++;
  }
  return passed / cases.length;
}
\`\`\`

| Metric | What It Measures | Good Score |
|--------|-----------------|------------|
| Pass rate | % of eval cases passed | > 90% |
| Latency | Time to first token | < 500ms |
| Cost | Tokens per request | Minimize |
| Consistency | Same input, same output | > 95% |

## Conclusion

"Prompt engineering" isn't a new discipline. It's systems engineering with a probabilistic component. The same principles apply: understand your system, design for reliability, test rigorously, handle failure. The only difference is that your system occasionally hallucinates and you have to be okay with that.`,
    category: 'ai',
    tags: ['LLM', 'Prompt Engineering', 'AI', 'Engineering'],
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-06-20T09:00:00Z',
    readingTime: 8,
    likes: 178,
    status: 'published',
  },
  {
    id: '11',
    slug: 'zero-trust-networking-for-normal-people',
    title: 'Zero Trust Networking for Normal People',
    excerpt: 'Zero Trust is not a product you buy. It is a model for thinking about network security that makes most of your existing assumptions wrong.',
    content: `## The Old Model: Castle and Moat

Traditional network security assumes a trusted internal network and an untrusted external network. You build a firewall (the moat) to keep attackers out. Everything inside the firewall is trusted.

The problem: once an attacker gets inside, they have free reign. Phishing, compromised credentials, a vulnerable internal service — any of these gives them a foothold, and the moat protects them from outside scrutiny.

## Zero Trust: Never Trust, Always Verify

Zero Trust throws away the concept of a trusted network. Every request is treated as if it comes from an untrusted network, regardless of source.

### The Three Principles

1. **Verify explicitly** — every access request is authenticated and authorized
2. **Least privilege** — access is granted minimally and just-in-time
3. **Assume breach** — design as if an attacker is already inside

## What This Looks Like in Practice

### Authentication at Every Layer

\`\`\`typescript
// Old: trust the internal network
app.get('/api/users', (req, res) => {
  // If you're here, you're inside the firewall — trusted
  return db.users.findAll();
});

// Zero Trust: verify every request
app.get('/api/users', async (req, res) => {
  const token = verifyToken(req.headers.authorization);
  if (!token) return res.status(401).end();

  const authorized = await checkPermission(token.userId, 'users:read');
  if (!authorized) return res.status(403).end();

  return db.users.findAll();
});
\`\`\`

### Network Segmentation

| Old Model | Zero Trust |
|----------|------------|
| One flat internal network | Micro-segmented networks |
| Firewall at the perimeter | Policy at every connection |
| VPN = trusted | VPN = encrypted transport, still verify identity |

### Identity-Based Access

\`\`\`yaml
# Access policy (simplified)
policies:
  - name: developers-prod-read
    effect: allow
    subjects: [role:developer]
    actions: [read]
    resources: [service:prod-api]
    conditions:
      time: business-hours
      mfa: required
      device: managed

  - name: contractors-no-prod
    effect: deny
    subjects: [role:contractor]
    resources: [service:prod-*]
\`\`\`

## The Hard Truth About Zero Trust

### It Is Not a Product

| Vendor Says | Reality |
|------------|---------|
| "Buy our Zero Trust appliance" | Zero Trust is a model, not a box |
| "VPN replacement" | It can replace VPNs, but that's a side effect |
| "Cloud-native Zero Trust" | Cloud helps, but the model applies on-prem too |

### It Requires Identity Maturity

You cannot do Zero Trust without a solid identity provider. If your identity system is a shared password in a spreadsheet, Zero Trust will not save you.

### It Is a Journey

1. **Inventory** — know what you have
2. **Classify** — know what matters
3. **Segment** — divide the network
4. **Enforce** — apply policies
5. **Monitor** — log and alert

> Zero Trust is not a project you complete. It is a posture you maintain.

## Practical Starting Points

### 1. MFA Everywhere

\`\`\`typescript
// Enforce MFA for all access
if (user.role !== 'service' && !user.mfaVerified) {
  throw new UnauthorizedError('MFA required');
}
\`\`\`

### 2. Service-to-Service Authentication

\`\`\`typescript
// Services authenticate to each other, not just users to services
async function callOrderService(userId: string, token: string) {
  const serviceToken = await getServiceToken('api-gateway', 'order-service');
  const response = await fetch('https://order-service/api/orders', {
    headers: {
      'Authorization': \`Bearer \${serviceToken}\`,
      'X-User-Id': userId,
      'X-User-Token': token,
    },
  });
  return response.json();
}
\`\`\`

### 3. Short-Lived Credentials

\`\`\`typescript
// Bad: long-lived API keys
const apiKey = 'sk_live_abc123forever';

// Good: short-lived tokens
const token = await exchangeCredentialsForToken(credentials);
// token expires in 1 hour
\`\`\`

## Conclusion

Zero Trust is not something you buy. It is something you become. Start with identity, add MFA, segment your network, and enforce policy at every connection. The goal is simple: make "I'm inside the network" mean nothing.`,
    category: 'cybersecurity',
    tags: ['Zero Trust', 'Security', 'Networking', 'Architecture'],
    coverImage: 'https://images.unsplash.com/photo-1563206773-9dce38e9e1c2?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-06-12T09:00:00Z',
    readingTime: 9,
    likes: 64,
    status: 'published',
  },
  {
    id: '12',
    slug: 'the-quiet-revolution-of-webgpu',
    title: 'The Quiet Revolution of WebGPU',
    excerpt: 'WebGL let us draw in the browser. WebGPU lets us compute. The difference is the difference between a canvas and a supercomputer.',
    content: `## From WebGL to WebGPU

WebGL gave browsers access to the GPU for rendering. It was a game-changer for 3D graphics, data visualization, and games. But WebGL was designed for one thing: drawing pixels.

WebGPU is the successor, and it brings something new: **general-purpose GPU computing**.

## What WebGPU Changes

### Compute Shaders

\`\`\`rust
// WGSL (WebGPU Shading Language) compute shader
@group(0) @binding(0)
var<storage, read_write> data: array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= arrayLength(&data)) { return; }
  data[i] = data[i] * 2.0;
}
\`\`\`

This runs on the GPU. Every element of \`data\` is processed in parallel. For an array of 1,000,000 elements, the GPU can do this in milliseconds.

### Comparison: CPU vs GPU

\`\`\`typescript
// CPU: sequential
function doubleArray(arr: Float32Array): Float32Array {
  for (let i = 0; i < arr.length; i++) {
    arr[i] *= 2;
  }
  return arr;
}

// GPU: parallel (WebGPU compute shader)
async function doubleArrayGPU(arr: Float32Array): Promise<Float32Array> {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  const buffer = device.createBuffer({
    size: arr.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(buffer, 0, arr);

  const computeModule = device.createShaderModule({ code: SHADER_CODE });
  const pipeline = device.createComputePipeline({
    layout: 'auto',
    compute: { module: computeModule, entryPoint: 'main' },
  });

  // Dispatch and read back...
  return result;
}
\`\`\`

| Operation | CPU (1M elements) | GPU (1M elements) |
|-----------|-----------------|-----------------|
| Double array | ~8ms | ~0.5ms |
| Matrix multiply | ~120ms | ~3ms |
| Image blur | ~45ms | ~1ms |
| Sort | ~50ms | ~8ms |

## Real-World Use Cases

### 1. On-Device AI Inference

\`\`\`typescript
// Running a small LLM entirely in the browser
const model = await loadModel('tinyllama.wgpu');
const output = await model.infer('Explain quantum computing');
// No server needed. Your GPU does the work.
\`\`\`

### 2. Real-Time Video Processing

\`\`\`typescript
// Background blur for video calls — on the GPU
const pipeline = createVideoPipeline({
  input: cameraStream,
  shader: backgroundBlurShader,
  output: canvasStream,
});
\`\`\`

### 3. Scientific Computing

\`\`\`typescript
// Fluid simulation in the browser
@compute @workgroup_size(8, 8)
fn simulateFluid(@builtin(global_invocation_id) id: vec3<u32>) {
  let x = id.x;
  let y = id.y;
  // Navier-Stokes equations on the GPU
  updateCell(x, y);
}
\`\`\`

## The API at a Glance

\`\`\`typescript
// 1. Get adapter and device
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

// 2. Create buffers
const vertexBuffer = device.createBuffer({
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertices);

// 3. Create pipeline
const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: { module, entryPoint: 'vertexMain', buffers: [vertexLayout] },
  fragment: { module, entryPoint: 'fragmentMain', targets: [{ format }] },
});

// 4. Render
const encoder = device.createCommandEncoder();
const pass = encoder.beginRenderPass({ /* ... */ });
pass.setPipeline(pipeline);
pass.setVertexBuffer(0, vertexBuffer);
pass.draw(vertices.length / 6);
pass.end();
device.queue.submit([encoder.finish()]);
\`\`\`

> WebGPU is not a faster WebGL. It is a fundamentally different API that treats the GPU as what it is: a massively parallel general-purpose processor.

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome | Shipping (113+) |
| Edge | Shipping |
| Safari | In development |
| Firefox | In development |

## Conclusion

WebGPU is the most important web platform change since WebAssembly. It brings GPU computing to every browser, enabling on-device AI, real-time media processing, and scientific computing — all without a server. The web is about to get a lot more powerful, and most people won't even notice.`,
    category: 'web',
    tags: ['WebGPU', 'GPU', 'Compute', 'Browser'],
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f07352734e67?w=1200&h630&fit=crop&q=80',
    author,
    publishedAt: '2026-06-05T09:00:00Z',
    readingTime: 8,
    likes: 112,
    status: 'published',
  },
  {
    id: '13',
    slug: 'draft-untitled-future-of-typescript',
    title: 'The Future of TypeScript: Decorators, Pipelines, and Beyond',
    excerpt: 'A draft exploring upcoming TypeScript features and what they mean for how we write code.',
    content: `## Draft — Work in Progress

This is a draft article exploring upcoming TypeScript features.

## Decorators (Stage 3)

\`\`\`typescript
function log(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(\`Calling \${key} with\`, args);
    return original.apply(this, args);
  };
}

class Service {
  @log
  fetchData(id: string) {
    return api.get(\`/data/\${id}\`);
  }
}
\`\`\`

## Pipeline Operator (Stage 2)

\`\`\`typescript
// Current
const result = format(parse(trim(input)));

// With pipeline operator
const result = input
  |> trim
  |> parse
  |> format;
\`\`\`

More content coming soon...`,
    category: 'development',
    tags: ['TypeScript', 'Future', 'Decorators'],
    coverImage: 'https://images.unsplash.com/photo-1516259762385-9070a5c9f8a2?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-08-08T09:00:00Z',
    updatedAt: '2026-08-08T16:00:00Z',
    readingTime: 5,
    likes: 0,
    status: 'draft',
  },
  {
    id: '14',
    slug: 'draft-rust-for-javascript-developers',
    title: 'Rust for JavaScript Developers: A Mental Model',
    excerpt: 'A draft guide to mapping JavaScript concepts to Rust, written for developers who already know JS.',
    content: `## Draft — Work in Progress

If you know JavaScript, you already know more about Rust than you think. The mental models overlap more than they differ.

## Ownership in JS Terms

In JavaScript, values are either primitives (copied) or objects (referenced). Rust has a similar distinction, but with rules.

\`\`\`rust
// This is like passing a primitive in JS — it's copied
let a = 5;
let b = a;
// Both a and b are valid

// This is like passing an object in JS — but Rust moves it
let s1 = String::from("hello");
let s2 = s1;
// s1 is no longer valid! Rust "moved" the value
\`\`\`

More content coming soon...`,
    category: 'development',
    tags: ['Rust', 'JavaScript', 'Programming'],
    coverImage: 'https://images.unsplash.com/photo-1605379399642-843269b9c9d6?w=1200&h=630&fit=crop&q=80',
    author,
    publishedAt: '2026-08-07T09:00:00Z',
    updatedAt: '2026-08-08T11:00:00Z',
    readingTime: 6,
    likes: 0,
    status: 'draft',
  },
];

export const mockComments: Comment[] = [
  {
    id: 'c1',
    articleId: '1',
    author: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces&q=80',
    content: 'The section on composing schemas is exactly what I needed. I had been manually nesting Zod objects and running into type inference issues. Using z.array and z.object together solved it cleanly.',
    createdAt: '2026-08-08T12:30:00Z',
    parentId: null,
  },
  {
    id: 'c2',
    articleId: '1',
    author: 'Marcus Webb',
    avatar: 'https://images.unsplash.com/photo-1500648767731-5ca545ace573?w=80&h=80&fit=crop&crop=faces&q=80',
    content: 'I have been using Yup for years and this article finally convinced me to try Zod. The type inference alone is worth the switch. The safeParse error format is so much cleaner than what I was dealing with before.',
    createdAt: '2026-08-08T14:15:00Z',
    parentId: null,
  },
  {
    id: 'c3',
    articleId: '1',
    author: 'Umer Farooq',
    avatar: 'https://images.unsplash.com/photo-1500648767731-5ca545ace573?w=80&h=80&fit=crop&crop=faces&q=80',
    content: 'Glad it helped! The Yup to Zod migration is pretty straightforward once you get used to the chaining syntax.',
    createdAt: '2026-08-08T15:00:00Z',
    parentId: 'c2',
  },
  {
    id: 'c4',
    articleId: '2',
    author: 'David Park',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces&q=80',
    content: 'The Rule of Three is something I wish someone had told me three years ago. I have been over-abstracting everything and creating maintenance nightmares. This article should be required reading for every junior dev.',
    createdAt: '2026-08-05T16:00:00Z',
    parentId: null,
  },
  {
    id: 'c5',
    articleId: '2',
    author: 'Lisa Tran',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces&q=80',
    content: 'That table of leaky abstractions is painfully accurate. I once spent three days debugging a timeout issue that turned out to be the fetch wrapper not forwarding the AbortController signal properly.',
    createdAt: '2026-08-06T09:30:00Z',
    parentId: null,
  },
  {
    id: 'c6',
    articleId: '3',
    author: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4f?w=80&h=80&fit=crop&crop=faces&q=80',
    content: 'The multilingual token cost comparison is eye-opening. I had no idea Arabic was 2.5x more expensive than English for the same content. This has real implications for internationalization of AI products.',
    createdAt: '2026-08-02T14:00:00Z',
    parentId: null,
  },
  {
    id: 'c7',
    articleId: '7',
    author: 'Nina Patel',
    avatar: 'https://images.unsplash.com/photo-1534528741775-5b1d3c8a8770?w=80&h=80&fit=crop&crop=faces&q=80',
    content: 'I went through the exact same journey. VS Code for a year, then back to Neovim with LSP and Telescope. The key difference is that coming back to Vim with modern tooling is nothing like the old Vim experience. It is genuinely better now.',
    createdAt: '2026-07-11T10:00:00Z',
    parentId: null,
  },
  {
    id: 'c8',
    articleId: '8',
    author: 'Tom Bradley',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=faces&q=80',
    content: 'I needed this article two startups ago. We split a 4-person team into 7 microservices and spent more time on infrastructure than product. The modular monolith approach would have saved us months.',
    createdAt: '2026-07-06T08:00:00Z',
    parentId: null,
  },
];
