# Lallu Syndrome — Complete Project Documentation

> A single, self-contained reference for humans and LLMs. It describes what the project is, how it is architected, and how every major subsystem works, based on the full repository snapshot.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Repository Layout](#4-repository-layout)
5. [Database Design](#5-database-design)
6. [Authentication & User Model](#6-authentication--user-model)
7. [Authorization Model (RLS + Admin)](#7-authorization-model)
8. [Publications](#8-publications)
9. [Articles & the Editor](#9-articles--the-editor)
10. [Interactions: Likes & Comments](#10-interactions-likes--comments)
11. [Media & Storage Pipeline](#11-media--storage-pipeline)
12. [Edge Functions](#12-edge-functions)
13. [Search (Algolia)](#13-search-algolia)
14. [Frontend Application Structure](#14-frontend-application-structure)
15. [Design System & Theming](#15-design-system--theming)
16. [UI Component Kit](#16-ui-component-kit)
17. [Pages Reference](#17-pages-reference)
18. [Data Fetching & State Patterns](#18-data-fetching--state-patterns)
19. [Configuration & Environment](#19-configuration--environment)
20. [Local Development & Deployment](#20-local-development--deployment)
21. [Security Model Summary](#21-security-model-summary)
22. [Codebase Conventions](#22-codebase-conventions)
23. [Project History & Notable Observations](#23-project-history--notable-observations)

---

## 1. Project Overview

**Lallu Syndrome** is a personal technology blog / publication platform built by **Umer Farooq**. It is a Medium-style writing platform with a dark, editorial aesthetic (serif headlines, monospace metadata, red accent).

- **Tagline:** “Notes, experiments, and deep dives into technology.”
- **Favicon/monogram:** `LS` (black rounded square, Georgia serif).
- **Concept:** “Lallu” describes someone aimless who settles for mediocrity; “Lallu Syndrome” is the gradual erosion of standards. The publication’s stated mission: *“Never settle for anything less than your very best.”*
- It is **multi-user**: anyone can sign up, write articles in their own “publication”, comment, and like. The owner is the admin.
- Core principles displayed on the About page:
  1. *Refuse the comfort of half-measures*
  2. *Premature confidence is the root of all evil*
  3. *Stay independent*

Functionally it provides: article CRUD with drafts/publishing, a rich-text editor with slash commands, categories, cover images, reading time, table of contents, related articles, nested comments, likes, share, full-text search, user profiles with avatars (crop + compress), publications, an admin panel, account deletion, and dark/light themes.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + TypeScript (strict), Vite 5 |
| Routing | `react-router-dom` v7 |
| Styling | Tailwind CSS 3 (`darkMode: 'class'`) + CSS-variable design tokens |
| Backend | Supabase: Postgres, Auth (GoTrue), Storage, Row Level Security |
| Serverless | Supabase Edge Functions (Deno), service-role client |
| Data fetching | TanStack Query (React Query) v5 |
| DB client | `@supabase/supabase-js` typed with generated `Database` types |
| Rich-text editor | Tiptap v3 (ProseMirror) + `tippy.js` |
| Forms/validation | `react-hook-form` + `zod` (+ `@hookform/resolvers`) |
| Search | Algolia — `algoliasearch` lite client + `react-instantsearch` |
| Modals/avatars | Radix UI (`react-dialog`, `react-avatar`) |
| Image cropping | `react-advanced-cropper` |
| Sanitization | `dompurify` |
| Dates | `dayjs` |
| Toasts | `sonner` |
| Icons | `lucide-react` |
| Canvas effects | `ogl` (Strands/ParticleText hero effects) |
| Analytics | `@vercel/analytics`, `@vercel/speed-insights` |
| Hosting | Vercel (SPA rewrites), Supabase cloud |

Key scripts (`package.json`): `dev`, `build`, `lint`, `preview`, `typecheck` (`tsc --noEmit -p tsconfig.app.json`).

---

## 3. High-Level Architecture

```
┌────────────────────────────┐
│  React SPA (Vercel)        │
│  Vite + React + Tailwind   │
└──────┬───────────┬─────────┘
       │           │
 supabase-js    fetch (Edge Functions)
 (anon key,        │  Bearer JWT re-validated
 RLS-enforced)     │  server-side
       ▼           ▼
┌────────────────────────────────────────────┐
│ Supabase                                   │
│ • Postgres + RLS policies                  │
│ • Auth (email/password, recovery emails)   │
│ • Storage buckets: media, avatars          │
│ • Edge Functions (Deno, service role):     │
│   delete-article, delete-user,             │
│   get-users-admin, sync-to-algolia        │
└──────┬─────────────────────────────────────┘
       │ DB webhooks (article INSERT/UPDATE/DELETE)
       ▼
┌─────────────┐        ┌──────────────────────┐
│ Algolia     │◄───────│ InstantSearch modal  │
│ index:      │  read  │ (Cmd/Ctrl+K)         │
│ "articles"  │        └──────────────────────┘
└─────────────┘
```

**Guiding principle:** the browser never holds privileged credentials. All normal reads/writes go through PostgREST guarded by RLS. Privileged or multi-step operations (deleting a user + their media, listing auth users, syncing search) run in Edge Functions using the service-role key, and each function re-authenticates the caller from the `Authorization` header.

---

## 4. Repository Layout

```
public/
  favicon.svg                     # "LS" monogram
src/
  components/
    articles/                     # ArticleCard, ArticleContent, ArticleProgress,
                                  # ArticleView, FeaturedArticle, RelatedArticles,
                                  # TableOfContents
    editor/                       # Tiptap editor + extensions:
                                  # TiptapEditor, SlashCommand(+Menu), CodeBlock(+Component),
                                  # YouTube(+Component), AlignedImage, processPastedHtml
    interactions/                 # CommentSection, LikeButton, ShareButton
    layout/                       # Navbar(+Search), Footer, AuthLayout, SettingsLayout, UserMenu
    ui/                           # Avatar, Badge, Button, CategoryButton, ConfirmationModal,
                                  # CropModal, Input, Skeleton, Textarea, Strands*, ParticleText*
    ErrorBoundary.tsx
  config/site.ts                  # site name/description/creator links
  contexts/                       # AuthContext, ThemeContext
  lib/                            # supabase client, queryClient
  pages/
    auth/                         # Login, Signup, ForgotPassword, ResetPassword, UsernameSetup
    settings/                     # ProfileSettings, PasswordSettings
    About, Admin, ArticleEditor, Article, Articles, Category, Creator,
    Dashboard, Home, NotFound, Publication, Publications, WriterProfile
  services/                       # one module per domain:
                                  # adminService, articleDeletionService, articleService,
                                  # authService, categoryService, profileService,
                                  # publicationService, storageService
  types/                          # domain types (index.ts) + generated database.ts
  utils/                          # cn, compression, crop, date, image, slugify
  App.tsx                         # providers + routes + guards
  index.css                       # tokens, prose styles, animations
supabase/
  functions/
    _shared/mediaStorage.ts       # shared storage-deletion helpers
    delete-article/  delete-user/  get-users-admin/  sync-to-algolia/
  migrations/                     # schema → triggers → RLS → storage → seed → fixes
                                  # → role reversal → admin rework → publications
  config.toml
vite.config.ts, tailwind.config.js, tsconfig*, eslint.config.js, vercel.json
```

\* `Strands.tsx` and `ParticleText.tsx` are excluded from the packed snapshot via repomix config (along with `.env`, `package-lock.json`, `.bolt/**`, `supabase/.temp/**`). They are `ogl`-based canvas effects used on the home hero and the editor header.

Path alias: `@/*` → `./src/*` (configured in both `tsconfig.app.json` and `vite.config.ts`).

---

## 5. Database Design

All tables live in the `public` schema. Enum: `article_status ('draft' | 'published')`.

### 5.1 Tables

**`profiles`** — extends `auth.users` 1:1
| column | type | notes |
|---|---|---|
| id | uuid PK | FK → `auth.users(id)` ON DELETE CASCADE |
| display_name | text | NOT NULL, 1–100 chars |
| username | text | UNIQUE, nullable, 3–30 chars |
| avatar_url, bio, website_url, github_url, linkedin_url | text | bio ≤ 500 |
| is_admin | boolean | NOT NULL default false |
| created_at / updated_at | timestamptz | auto-managed |

**`categories`** — id (bigint identity PK), slug (unique, 1–100), name (1–100), created_at.

**`articles`**
| column | type | notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| author_id | uuid | FK → profiles |
| category_id | bigint | FK → categories |
| publication_id | uuid | FK → publications, NOT NULL |
| title | text | 1–300 chars |
| slug | text | UNIQUE, 1–200 chars |
| content | text | Tiptap HTML |
| cover_image | text | nullable |
| status | article_status | default 'draft' |
| reading_time | integer | ≥ 0 |
| published_at | timestamptz | managed by trigger |
| created_at / updated_at | timestamptz | |

**`comments`** — id uuid PK, article_id (FK, cascade), parent_id (self-FK, nullable → nesting, cascade), author_id (FK profiles, cascade), content (1–1000 chars), created_at.

**`article_likes`** — composite PK `(article_id, user_id)`, both FKs cascade, created_at. One like per user per article.

**`publications`** — id uuid PK, owner_id (FK profiles, cascade), name (default `'The Journal'`, 1–100), slug (unique, 1–100), description (≤500), logo_url, is_default boolean, created_at/updated_at. Partial unique index guarantees **one default publication per owner**.

### 5.2 Functions & Triggers

- `set_updated_at()` — BEFORE UPDATE on `profiles`, `articles`, `publications`.
- `handle_new_user()` — AFTER INSERT on `auth.users`: creates the profile (display_name from metadata `name`, else email, else `'User'`) and calls `create_default_publication(new.id)`.
- `handle_article_publication()` — BEFORE INSERT **and** UPDATE on `articles`: when status becomes `published` and `published_at` is null, sets it to `now()`; when status becomes `draft`, clears `published_at`.
- `generate_publication_slug(owner_id)` — SECURITY DEFINER; base slug from the user’s username or `journal-{uuid8}`; loops with `-1`, `-2`… suffixes until unique.
- `create_default_publication(owner_id)` — inserts “The Journal” if no default exists.
- `is_admin(user_id)` — SECURITY DEFINER boolean helper used by RLS.

### 5.3 Seed data

Categories: `development`, `ai`, `cybersecurity`, `web`, `hardware`, `software`, `other`.

### 5.4 Storage buckets & policies (`004_storage.sql`)

- **`media`** (public): article images. SELECT/INSERT/DELETE policies require the requester to be the author of the article encoded in the path `articles/{articleId}/…` (checked via `split_part` + existence query against `articles`). Public bucket means images are directly servable by URL; policies only govern API listing/writes.
- **`avatars`** (public): SELECT open to all; INSERT/UPDATE/DELETE restricted to paths whose first segment equals `auth.uid()::text`.

---

## 6. Authentication & User Model

Built on Supabase Auth (email/password).

- **Signup** (`authService.signup`): `signUp` with `options.data.name`. If a session is returned immediately → go to dashboard; otherwise the UI shows a “Confirm your email” screen (email confirmation is enabled).
- **Login**: `signInWithPassword` → `/dashboard`.
- **Forgot password**: `resetPasswordForEmail` with `redirectTo: ${origin}/reset-password`; success screen shows the emailed address.
- **Reset password**: `updateUser({ password })` with confirm-password validation (zod refine), then redirect to login.
- **Logout**: `signOut`.
- **`AuthContext`** exposes: `user`, `isLoading`, `profile`, `isProfileLoading`, `logout`, `refreshProfile`, `updateProfile(values)`. It subscribes to `onAuthStateChange` and fetches the profile whenever the user id changes.

### Username setup flow

- `UsernameSetupPage` (`/setup/username`) is an optional post-signup step. Username rules (zod): trimmed + lowercased, 3–30 chars, `[a-z0-9_-]`.
- Uniqueness is pre-checked via `getProfileByUsername`, with a fallback catch of Postgres error `23505`.
- “Skip for now” stores `ls_username_setup_skipped = '1'` in localStorage.
- `ProtectedRoute` enforces: if the profile has no username, hasn’t skipped, and isn’t already on `/setup/username` or `/settings*`, redirect to setup (remembering `from` in router state).
- A dashboard banner reminds users without a username that readers can’t find their other articles, linking to settings.

---

## 7. Authorization Model

There are **no roles**. The design settled on a single `is_admin` boolean (a `user_role` enum experiment was added and reverted twice — see history).

**RLS policy matrix:**

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | everyone | self | self — **with `is_admin` preservation check** — + admins may update any | — |
| categories | everyone | — | — | — |
| articles | published rows (public) ∪ own ∪ all-if-admin | self as author **and** owner of target publication | own **and** publication owner | own ∪ admin |
| comments | everyone | authenticated, self as author, article must be published | own | own ∪ admin |
| article_likes | everyone | self, article must be published | — | own |
| publications | everyone | owner | owner | owner and **not** default |

**Privilege-escalation guard:** the self-update policy on `profiles` includes

```sql
with check (auth.uid() = id
  AND is_admin = (select p.is_admin from profiles p where p.id = auth.uid()))
```

so a user cannot set `is_admin = true` on themselves; only an existing admin (via the separate admin update policy) can grant/revoke it. The first admin is seeded by migration: `1d571977-83a0-4cf0-a573-7fe1e92fea8b`.

Edge functions independently re-verify ownership/admin status with the service-role client — RLS is not their only line of defense.

---

## 8. Publications

A lightweight multi-publication layer (like Medium publications):

- Every user automatically gets a default publication named **“The Journal”** (trigger on signup; backfilled for existing users; articles backfilled to their owner’s default).
- `articles.publication_id` is NOT NULL; article insert/update policies require the author to own the publication.
- `publicationService`: `getMyPublications`, `getPublicationBySlug`, `getDefaultPublication` (with race-safe retry on `23505`), `createPublication` (slugify + up to 3 retries on collision), `updatePublication`, `deletePublication`.
- Public pages at `/p/:slug` (`PublicationPage`); writers list their publications on `WriterProfilePage`; the editor has a publication selector.

---

## 9. Articles & the Editor

### 9.1 Domain model (`types/index.ts`)

`Article`: `id, slug, title, content, category, coverImage, author{name, username?, avatar?, bio?}, publicationId, publication{id, slug, name}, publishedAt?, createdAt, updatedAt?, readingTime, likes, status`.

### 9.2 Service layer (`articleService.ts`)

One shared `ARTICLE_SELECT` joins categories, publications, author profile, and like counts; `mapSupabaseArticle` converts rows to the domain type (throwing if a join is missing). Functions:

- `getArticles` (published, newest first), `getAllArticles`, `getArticleBySlug` / `getArticleById` (PostgREST `PGRST116` → `null`), `getArticlesByCategory`, `getPublishedArticlesByAuthor`, `getLatestArticle(s)`, `getRelatedArticles` (same category first, backfilled with other categories), `getMyArticles`, `getArticlesByPublication`.
- `createArticle` / `updateArticle`: category slug → id resolution, default-publication fallback, `calculateReadingTime` (220 wpm over DOMParser-stripped text, min 1), slug generation.
- `deleteArticle` delegates to the `delete-article` edge function via `articleDeletionService` (which parses `FunctionsHttpError` bodies for server messages).
- Slugs: `slugify` (NFD-normalize, strip diacritics, lowercase, hyphenate, strip non-alphanumerics, collapse hyphens) plus a 6-char random base36 suffix for uniqueness; `slugifyHeading` produces collision-safe TOC ids.

### 9.3 Reading experience (`ArticleView`, `ArticleContent`, `ArticlePage`)

- Reading progress bar (`ArticleProgress`) fixed at top, scroll-driven.
- Centered header: publication link, serif title, category badge, date (`dayjs`), reading time; cover image with deterministic fallback and per-article error-state reset.
- **`ArticleContent`** renders editor HTML safely:
  - `DOMPurify` with HTML profile, allowing `iframe` plus style/data attributes;
  - an `afterSanitizeAttributes` hook **removes any iframe that is not a YouTube embed URL** and adds `referrerpolicy="strict-origin-when-cross-origin"`;
  - external links get `target="_blank" rel="noopener noreferrer"`;
  - `h1–h3` get stable ids (`slugifyHeading`) + `scroll-mt-20` for the TOC.
- **Table of contents**: headings extracted from content; shown when ≥ 3 headings; sticky sidebar on desktop (`lg`), collapsible `<details>` on mobile; active heading tracked with a rAF-throttled scroll handler (120px threshold).
- Sidebar author card links to `/writers/{username}` when available.
- `ArticlePage` wires related articles and per-user like state via React Query.

### 9.4 The Tiptap editor (`TiptapEditor.tsx` + extensions)

Extensions registered: `StarterKit` (codeBlock/link disabled in favor of custom ones), `Placeholder` (“Type '/' for commands…”), `Link` (openOnClick off, autolink on), `TextAlign` with **all keyboard shortcuts removed**, `SlashCommand`, `AlignedImage`, custom `CodeBlock`, custom `YouTube`.

- **Slash commands** (`@tiptap/suggestion` + tippy + `ReactRenderer`): items for H1/H2/H3, Image (triggers upload callback), YouTube, bullet/numbered lists, quote, code block, divider. Filtering matches title/description/keywords; menu supports ArrowUp/Down/Enter/Escape.
- **CodeBlock**: React node view with a language selector (16 languages), copy-to-clipboard with “Copied” check state, and delete.
- **YouTube node**: atom block node; empty state shows URL input; extracts video id from `watch?v=`, `embed/`, `shorts/`, `youtu.be/`, or a bare 11-char id; renders responsive 16:9 iframe with hover delete.
- **AlignedImage**: image extension with `width` (`25/50/75/100%`) and `alignment` (`left/center/right`) attributes persisted as `data-width` / `data-alignment` and rendered via inline styles.
- **Bubble menus**: text selection → bold/italic/strike/H1–H3/justify/quote/inline code/link (prompt-based, empty string unlinks); image selection → alignment buttons + S/M/L/F width presets.
- **Paste handling** (`processPastedHtml` + editor `handlePaste`):
  - clipboard image files upload immediately at the caret;
  - direct image URLs pasted as text become images and are then re-hosted;
  - pasted HTML is decoded (up to 3 entity-decode passes), stripped of `srcset`/`sizes`, and any `<img>` pointing at storage media belonging to *another* article (or external URLs) is queued for re-upload to the current article — preventing cross-article media references.
  - dropped image files are uploaded too.

### 9.5 Editor page (`ArticleEditorPage.tsx`)

- **Autosave**: 1-second debounce on content/settings changes; states `idle → saving → saved` with a timestamp; a content-version counter prevents stale “saved” indicators; `beforeunload` guard while dirty; `flushPendingSaves` retries up to 3 times before navigation.
- **Lazy creation**: new articles aren’t created until there is content or an image upload (`ensureArticleId`), then the URL is replaced to `/dashboard/articles/{id}`.
- **Publish**: blocks future `publishedAt`, halts autosave, flushes saves, creates/updates with `status: 'published'`, runs `cleanupArticleContentMedia` (orphan removal), invalidates article/dashboard queries, returns to dashboard.
- **Cover image**: file → object URL → `CropModal` (fixed **16:9**) → if needed, create the article → delete previous cover from storage → upload → set URL. Manual URL entry is also supported in settings.
- **Settings panel**: cover URL, publication selector, category, slug override, status, `datetime-local` publication date capped at “now”.
- **Preview mode** renders the real `ArticleView` with interactions/related/back-link disabled.
- The sticky header plays an `ogl` “Strands” canvas animation that intensifies while saving.

---

## 10. Interactions: Likes & Comments

**Likes** (`article_likes`)
- `toggleLike(articleId)` server-side determines current state then inserts/deletes, returning `{ liked, likes }` (count via head query).
- `LikeButton`: unauthenticated users get a tooltip “Sign in to like articles”; liking pulses the heart once; per-user state cached under query key `['liked', articleId, userId]`.

**Comments** (nested)
- `CommentSection` shows a top-level form (avatar + textarea, Enter submits, Shift+Enter newline, 1000-char cap) and recursive `CommentItem`s; replies render indented under a left border.
- Reply forms inline; deletion is owner-only and confirmed via `ConfirmationModal`.
- Mutations patch the React Query cache directly (`setQueryData` append/filter) rather than refetching.
- RLS restricts commenting to published articles.

**Share** (`ShareButton`) uses `navigator.share` where available, else clipboard copy with a 2-second “Link copied” state.

---

## 11. Media & Storage Pipeline

### 11.1 Client-side optimization (`utils/compression.ts`)

Tunable constants at the top of the file:

| Constant | Value | Meaning |
|---|---|---|
| `OPTIMIZABLE_MIME_TYPES` | jpeg, png | GIF excluded (animation), WebP/AVIF already modern |
| `MAX_OUTPUT_EDGE_PX` | 2000 | ~2× retina for the 1000px content column |
| `MIN_SIZE_BEFORE_COMPRESS_BYTES` | 200 KB | small + unresized files are left alone |
| `WEBP_QUALITY` | 0.80 | canvas `toBlob` quality |
| Output | `image/webp`, `.webp` extension | |

Flow: decode via `createImageBitmap` (fallback: `<img>` + object URL, Firefox-safe), compute downscale, draw to canvas with `imageSmoothingQuality: 'high'`, encode WebP, and **never return a file larger than the original**. Any failure falls back to the original file — optimization can never break an upload.

### 11.2 Upload rules (`storageService.upload`)

Allowed types: jpeg/png/webp/gif/avif; max 5 MB. Paths:
- cover → `articles/{articleId}/cover.{ext}`
- content → `articles/{articleId}/content/{uuid}.{ext}`

`cleanupArticleContentMedia(articleId, html)` lists the content folder and deletes anything not referenced in the HTML (`extractStorageImagePaths`). `deleteCoverImage` verifies the public-URL prefix before removing.

### 11.3 Avatars (`profileService.uploadAvatar` + `CropModal`)

Uploaded to `avatars/{userId}/avatar.{ext}` with `upsert: true`; the returned URL gets a `?t={timestamp}` cache buster. `CropModal` (react-advanced-cropper inside a Radix dialog) provides zoom (1×–4×, converted to relative `zoomImage` factors), uses `ImageRestriction.fitArea`, and exports JPEG 0.95 via `utils/crop.ts` (which the compressor then converts to WebP).

### 11.4 Fallback covers (`utils/image.ts`)

Articles without a cover (or with a broken one) get a deterministic image: hash of `articleId` → `defaults/sample-{1..8}.webp` from the media bucket.

### 11.5 Server-side deletion (`_shared/mediaStorage.ts`)

Shared by edge functions: paginated listing (1000/page), recursive folder BFS (file vs folder inferred from extension), batched `remove` with per-item retry that ignores “not found” errors (idempotent), and UUID validation before touching paths. Exposes `deleteArticleMedia` (`media/articles/{id}`) and `deleteUserAvatarMedia` (`avatars/{userId}`).

---

## 12. Edge Functions

All functions: manual CORS (`Access-Control-Allow-Origin: *`), `OPTIONS` preflight handling, JSON responses, UUID validation, and service-role Supabase clients. They authenticate callers by re-resolving the `Authorization: Bearer` token via `auth.getUser`.

### `delete-article` (POST `{ articleId }`)
1. Authenticate caller.
2. Load article. **If missing → idempotent success**; admins additionally get leftover media cleanup for that id prefix.
3. Authorization: author or admin.
4. **Delete media first**, then the DB row (no orphaned storage).

### `delete-user` (POST `{ userId }`)
1. Authenticate caller; **self-delete allowed**, deleting someone else requires admin.
2. Delete every article’s media, then the articles.
3. Delete the avatar folder.
4. `auth.admin.deleteUser(userId)` — profile, publications, comments, likes cascade.

### `get-users-admin` (POST)
Admin-only. Returns all profiles (newest first) merged with `last_sign_in_at` gathered by paginating `auth.admin.listUsers` (1000/page) into a map. Powers the admin Users tab.

### `sync-to-algolia`
Invoked by Supabase **database webhooks** (`Authorization: Bearer ${ALGOLIA_SYNC_WEBHOOK_SECRET}`):
- `DELETE` records → remove object from index.
- `INSERT`/`UPDATE` → if not published, remove from index (handles unpublish); otherwise fetch the article with category + author joins and save a record: `objectID, title, slug, excerpt (HTML-stripped, 300 chars), category, author, authorAvatar, publishedAt, readingTime`.
- `{ action: "reindex_all" }` → replace the whole index from all published articles.
- Uses `algoliasearch@4` with `ALGOLIA_APP_ID` / `ALGOLIA_ADMIN_KEY` / `ALGOLIA_INDEX_NAME`.

---

## 13. Search (Algolia)

- `NavbarSearch` renders a search icon that opens a modal (`InstantSearch` over index **`articles`**, lite client from `VITE_ALGOLIA_APP_ID` + `VITE_ALGOLIA_SEARCH_KEY`, `hitsPerPage: 8`).
- Global shortcuts: **Cmd/Ctrl+K** toggles, **Escape** closes; the query resets on close.
- Results show highlighted title/excerpt, author avatar/name, category, and reading time; clicking navigates to `/articles/{slug}`.
- Empty/loading/no-results states are handled explicitly.

---

## 14. Frontend Application Structure

### Providers (`App.tsx`)

`ThemeProvider` → `Toaster` (sonner, theme-aware) → `AuthProvider` → `QueryClientProvider` → `BrowserRouter` → `ErrorBoundary` → routes. `<SpeedInsights />` and `<Analytics />` are mounted at the root. `ScrollToTop` resets scroll on route change.

### Layouts & guards

- **AppLayout**: Navbar + content + Footer.
- **EditorLayout**: bare full-screen shell (no navbar/footer) for the editor.
- **AuthLayoutShell**: Navbar only, for auth pages; `AuthLayout` centers a card with title/subtitle/footer.
- **SettingsLayout**: “Settings” header + Profile/Password tabs via nested routes.
- **ProtectedRoute**: spinner while auth/profile load → redirect to `/login` if unauthenticated → username-setup enforcement (see §6).
- **AdminRoute**: requires `profile.is_admin`, else redirects home.

### Key context: `ThemeContext`

Theme is `'dark' | 'light'`, default **dark**, persisted under localStorage key **`ls_theme`**, applied by toggling `.dark` / `.light` classes on `<html>`. `useTheme()` exposes `theme` and `toggleTheme`.

---

## 15. Design System & Theming

### Color tokens (CSS variables)

| Token | Dark | Light |
|---|---|---|
| `--color-bg` | `#090909` | `#F7F7F5` |
| `--color-surface` | `#111111` | `#F0F0ED` |
| `--color-elevated` | `#171717` | `#FFFFFF` |
| `--color-border` | `#292929` | `#D9D9D5` |
| `--color-border-subtle` | `#1e1e1e` | `#E8E8E4` |
| `--color-text-primary` | `#F4F4F4` | `#181818` |
| `--color-text-secondary` | `#A0A0A0` | `#626262` |
| `--color-text-muted` | `#707070` | `#8A8A8A` |
| `--color-accent` | `#B00000` | `#9E0000` |
| `--color-accent-hover` | `#C20A0A` | `#B00000` |

### Tailwind extensions

- Fonts: serif **Newsreader**, sans **Inter**, mono **JetBrains Mono** (Google Fonts in `index.html`).
- Radii: default `6px`, `card` `8px`; default transition `200ms`.
- Max widths: `article: 680px`, `content: 1080px`, `wide: 1200px`.
- Animations: `fade-in`, `slide-up`, `pulse-once` (like-button heart).

### Bespoke CSS (`index.css`)

- `.article-prose`: full article typography system — serif headings with tight tracking, accent-underlined links, styled lists/tables/quotes/code, `iframe.youtube-embed` responsive styling, code-block chrome classes.
- About/Creator page effects: film-grain overlay (`.grain`), `fadeUp`/`wipe`/`blink`/marquee animations, conic-gradient rotating avatar ring, underline-sweep links, arrow micro-interactions.
- `prefers-reduced-motion` disables animations globally.
- Algolia highlight styling overrides.

---

## 16. UI Component Kit

| Component | Notes |
|---|---|
| `Button` | forwardRef; variants `primary/secondary/ghost/danger`; sizes `sm/md/lg`; `loading` spinner; disabled states |
| `Input` | label + error wiring (`aria-invalid`/`aria-describedby`), optional password visibility toggle |
| `Textarea` | same label/error pattern, resize-y |
| `Badge` | `default/accent/muted`, mono uppercase |
| `Avatar` | Radix avatar with initial-letter fallback |
| `CategoryButton` | pill filter button for category bars |
| `Skeleton` | plus `ArticleCardSkeleton`, `FeaturedArticleSkeleton`, `ArticlePageSkeleton`, `PageSpinner` |
| `ConfirmationModal` | Radix Dialog confirm/cancel with loading state |
| `CropModal` | image cropper dialog (optional fixed aspect) |
| `ErrorBoundary` | class boundary, logs to console, friendly fallback with reset link |

---

## 17. Pages Reference

| Route | Page | Guard | Purpose |
|---|---|---|---|
| `/` | HomePage | public | ParticleText hero (“Lallu Syndrome”, lazy, reduced-motion fallback), featured = latest published article, next 3 latest |
| `/articles` | ArticlesPage | public | All published, category filter bar, 3-col grid |
| `/articles/:slug` | ArticlePage | public | Full reading view (§9.3) |
| `/categories/:category` | CategoryPage | public | Filtered grid by category slug |
| `/about` | AboutPage | public | Mission, topics marquee (categories), 3 principles |
| `/creator` | CreatorPage | public | Umer Farooq profile, links, “I build in public” |
| `/writers/:username` | WriterProfilePage | public | Avatar, bio, links, stats (articles, total likes), publications, latest 3 articles; not-found state |
| `/p/:slug` | PublicationPage | public | Publication header + its published articles |
| `/login`, `/signup` | auth pages | public | RHF+zod forms; signup handles email-confirmation state |
| `/forgot-password`, `/reset-password` | auth pages | public | Reset-link flow |
| `/dashboard` | DashboardPage | protected | Published/Drafts tabs, counts, view/edit/delete rows, new-article + publications buttons, username banner |
| `/dashboard/articles/:id` | ArticleEditorPage | protected | Editor (§9.5); `new` = create |
| `/dashboard/publications` | PublicationsPage | protected | Create/list/delete (non-default) publications |
| `/setup/username` | UsernameSetupPage | protected | Optional username with skip |
| `/settings/profile` | ProfileSettingsPage | protected | Name, username, avatar (URL or upload+crop), bio (counter), links with URL normalization; **danger zone: two-step account deletion** |
| `/settings/password` | PasswordSettingsPage | protected | Change password via `updateUser` |
| `/admin` | AdminPage | admin | Tabs: Users (role select, last sign-in, delete), Comments (moderation), Articles (status, delete) |
| `*` | NotFoundPage | public | 404 |

---

## 18. Data Fetching & State Patterns

- **`queryClient`** defaults: `retry: 1`, `refetchOnWindowFocus: false`, `staleTime: 0`.
- Query keys: `['articles']`, `['article', slug|id]`, `['articles', 'category', slug]`, `['articles', 'author', id]`, `['articles', 'related', id]`, `['articles', 'publication', slug]`, `['my-articles', userId]`, `['my-publications', userId]`, `['comments', articleId]`, `['liked', articleId, userId]`, `['admin-profiles']`, `['admin-comments']`, `['admin-articles']`, `['categories']`, `['category', slug]`, `['profile', username]`.
- **Services own all Supabase access**; components never call `supabase` directly except `ProfileSettingsPage` (password update) and `lib/supabase.ts` setup.
- Mutations invalidate the relevant keys; comment/like mutations also patch caches optimistically.
- Loading UX: skeleton components everywhere; `PageSpinner` for full-page waits; toasts (`sonner`) for success/error feedback.

---

## 19. Configuration & Environment

### Client env (`.env`, Vite-prefixed)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=   # anon/public key
VITE_ALGOLIA_APP_ID=
VITE_ALGOLIA_SEARCH_KEY=         # search-only key
```

### Edge function secrets (Supabase dashboard)

```
ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY, ALGOLIA_INDEX_NAME
ALGOLIA_SYNC_WEBHOOK_SECRET      # bearer token for DB webhook
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   # auto-injected
```

### Other config

- `vercel.json`: SPA rewrite `/(.*) → /index.html`.
- `supabase/config.toml`: registers all four functions (entrypoints + import maps).
- `vite.config.ts`: `@` alias, `server.host: true`, an ngrok dev host in `allowedHosts`, `optimizeDeps.include: ['lucide-react']`.
- `index.html`: dark class by default, fonts, SEO/OG meta (OG image served from the media bucket), `theme-color #090909`.
- `repomix.config.json`: XML snapshot output; excludes Strands/ParticleText, `.bolt`, `.env`, lockfile.

---

## 20. Local Development & Deployment

**Setup**
1. `npm install`
2. Create a Supabase project; run the migrations in `supabase/migrations/` in order (schema → functions/triggers → RLS → storage → seed → fixes → admin rework → publications).
3. Create storage buckets `media` and `avatars` (public) — the storage migration handles policies.
4. Deploy functions: `supabase functions deploy delete-article delete-user get-users-admin sync-to-algolia`.
5. Configure Algolia: create index `articles`, set DB webhook on the `articles` table pointing at `sync-to-algolia` with the shared secret.
6. Fill `.env` (§19) and optionally seed an admin via the profiles table (`is_admin = true`).
7. `npm run dev`.

**Deployment**: push to Git → Vercel builds the SPA (`npm run build`); Supabase hosts DB/auth/storage/functions. Vercel Analytics + Speed Insights are bundled in `App.tsx`.

---

## 21. Security Model Summary

- RLS on **every** table; anonymous users only ever see published articles, public comments/likes/profiles/publications.
- No role system — single `is_admin` flag with a WITH CHECK guard preventing self-promotion.
- Privileged operations live in edge functions that re-authenticate the JWT and re-check ownership/admin with the service role; article/user ids are UUID-validated.
- Article deletions remove storage media **before** the row; deletions are idempotent and tolerate already-missing objects.
- Rendered article HTML passes through DOMPurify; iframes are whitelisted to YouTube embed URLs only; external links get `noopener noreferrer`.
- Storage paths encode ownership (`articles/{authorArticle}/…`, `avatars/{userId}/…`) enforced by policies.
- Uploads are type- and size-limited (5 MB; avatars 2 MB) and re-encoded client-side.
- The `delete-user` function supports self-service account deletion (GDPR-style) as well as admin removal.

---

## 22. Codebase Conventions

- Components take `Readonly<Props>`; function components, no default exports except editor node views.
- `cn()` (clsx + tailwind-merge) for class composition.
- Typed Supabase: generated `Database` type drives `createClient<Database>`; row mapping happens in services.
- Zod schemas colocated with pages; RHF for all forms; errors surfaced inline + via `setError('root', …)`.
- Domain types in `src/types/index.ts`; generated DB types kept separate in `types/database.ts`.
- Date handling centralized in `utils/date.ts` (dayjs: `formatDate`, `formatDateLong`, `relativeTime`).
- Every async user action has loading state (button spinner/skeleton) and toast feedback.
- Tailwind tokens only (no hex in components); theme switches purely via CSS variables.
- Migrations are numbered and narrative — they document the project’s evolution (see below).

---

## 23. Project History & Notable Observations

**Migration timeline (August 19–20, 2026):**
1. `20260819121429` — core schema (profiles, categories, articles, comments, likes).
2. `20260819121432` — updated_at triggers, new-user profile trigger, publication-date trigger.
3. `20260819121436` — RLS + grants.
4. `20260819121440` — storage buckets/policies.
5. `20260819121445` — category seed.
6. `20260820033358` — fixes (insert-time publication trigger; like policy requires published articles) **and** introduced a `user_role` enum (`reader/writer/admin`).
7. `20260820072952` + `20260820083616` — **reverted the role system twice**, landing on the final `is_admin` boolean model with admin read/delete policies and the seeded admin user.
8. `20260820114326` — publications layer with default-publication backfill and article reassignment.

**Observations for future work / LLM context:**
- `Strands.tsx` and `ParticleText.tsx` (ogl effects) are intentionally excluded from the packed snapshot; they’re used on the home hero and editor header.
- `@tiptap/extension-underline` is a dependency but isn’t registered in the editor configuration — likely removable.
- `react-intersection-observer` is listed in dependencies (used for lazy-loading behaviors outside this snapshot’s detail).
- The Algolia index name is hardcoded to `"articles"` in both the webhook function and the InstantSearch UI.
- CORS on edge functions is `*`; security relies on JWT verification + RLS rather than origin restriction.
- Reading time is stored on the article row and recomputed on every save.
- The username-setup skip is client-side only (localStorage), which is acceptable since it’s a UX nudge, not a security control.

---

*This document was generated from the complete repository snapshot (`repomix-output.xml`, XML style) and reflects the codebase as of the migrations dated 2026-08-20.*