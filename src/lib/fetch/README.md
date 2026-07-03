# `$fetch` — Axios-style Fetch Wrapper for Next.js

A production-ready, type-safe fetch utility for Next.js (App Router) and any TypeScript project. Extends the native `RequestInit` interface so every current and future browser fetch option works out of the box — with zero extra code.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [$fetch vs createFetch — Which to Use](#fetch-vs-createfetch--which-to-use)
- [Quick Start](#quick-start)
- [Creating a Shared Instance](#creating-a-shared-instance)
- [HTTP Methods](#http-methods)
  - [GET](#get)
  - [POST](#post)
  - [PUT](#put)
  - [PATCH](#patch)
  - [DELETE](#delete)
  - [HEAD](#head)
  - [OPTIONS](#options)
  - [request (escape hatch)](#request-escape-hatch)
- [Request Options](#request-options)
  - [Query Parameters](#query-parameters)
  - [Request Body](#request-body)
  - [Custom Headers](#custom-headers)
  - [Timeout](#timeout)
  - [Base URL Override](#base-url-override)
  - [Native RequestInit Options](#native-requestinit-options)
- [Next.js Caching](#nextjs-caching)
  - [ISR — Time-based Revalidation](#isr--time-based-revalidation)
  - [Tag-based On-demand Revalidation](#tag-based-on-demand-revalidation)
  - [Opt out of Caching](#opt-out-of-caching)
  - [Explicit Cache Mode](#explicit-cache-mode)
- [Lifecycle Hooks](#lifecycle-hooks)
  - [onRequest](#onrequest)
  - [onResponse](#onresponse)
  - [onSuccess](#onsuccess)
  - [onError](#onerror)
- [Response Shape](#response-shape)
- [Error Handling](#error-handling)
  - [FetchError](#fetcherror)
  - [Error Guards](#error-guards)
- [Cancellation](#cancellation)
- [TypeScript API](#typescript-api)
  - [Exported Types](#exported-types)
  - [Generic Type Parameters](#generic-type-parameters)
- [Real-World Recipes](#real-world-recipes)
  - [Auth API Client](#auth-api-client)
  - [File Upload](#file-upload)
  - [Server Component with ISR](#server-component-with-isr)
  - [Server Action with Tag Revalidation](#server-action-with-tag-revalidation)
  - [Token Refresh on 401](#token-refresh-on-401)

---

## Features

- **Axios-style API** — `.get()`, `.post()`, `.put()`, `.patch()`, `.delete()`, `.head()`, `.options()`, `.request()`
- **Extends `RequestInit`** — all native fetch options (`credentials`, `mode`, `redirect`, `keepalive`, `integrity`, etc.) work automatically
- **Strict TypeScript** — fully generic request/response types, zero `any`
- **Next.js App Router** — first-class `revalidate`, `tags`, and `cache` support
- **4 focused lifecycle hooks** — `onRequest`, `onResponse`, `onSuccess`, `onError`
- **Smart body serialisation** — plain objects → JSON, `FormData` → multipart, passthrough for `Blob`/`ArrayBuffer`/`string`
- **Automatic Content-Type** — set only when needed, never overriding what you pass
- **Timeout + AbortSignal** — built-in timeout with optional external signal merging
- **Typed `FetchError`** — `.isHttpError`, `.isNetworkError`, `.isTimeout` guards
- **Content-type-aware parsing** — JSON, text, or Blob based on the `Content-Type` header

---

## Installation

Copy `$fetch.ts` into your project (e.g. `src/lib/$fetch.ts`). No dependencies required — only the native `fetch` API.

```
src/
└── lib/
    └── $fetch.ts
```

---

## `$fetch` vs `createFetch` — Which to Use

This is the most important decision. Both expose the same HTTP methods — the difference is configuration scope.

|                                 | `$fetch` (direct)                                      | `createFetch` (instance)                       |
| ------------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| **Setup**                       | None — import and use                                  | Call once, export the instance                 |
| **Base URL**                    | Must pass full URL every time                          | Set once, use relative paths                   |
| **Default headers**             | Must pass every request                                | Set once on the instance                       |
| **Default timeout**             | Must pass every request                                | Set once on the instance                       |
| **Lifecycle hooks**             | Not configurable (no interceptors set)                 | Configurable via `interceptors` option         |
| **Per-request Next.js caching** | ✅ Pass `next` on any call                             | ✅ Pass `next` on any call                     |
| **Default Next.js caching**     | ❌ No instance-level default                           | ✅ Set once, applied to every request          |
| **Best for**                    | One-off requests, scripts, utilities, third-party APIs | Your main API, any service you call repeatedly |

**Use `$fetch` directly when:**

- Making a single one-off request to any URL
- Calling a third-party API you don't own (no shared config needed)
- Writing a quick utility or script
- You don't need auth headers, interceptors, a base URL, or instance-level cache defaults

**Use `createFetch` when:**

- You're building against your own backend API
- You need to attach auth tokens on every request
- You want centralised error handling (Sentry, 401 redirects)
- You want to set a base URL, default timeout, or default Next.js caching (`revalidate`, `tags`) once for all requests

---

## Quick Start

### Using `$fetch` directly

Import and call immediately — no setup required. Pass the full URL every time.

```ts
import { $fetch } from '@/lib/$fetch'

// GET
const { data: user } = await $fetch.get<User>('https://api.example.com/users/1')

// POST
const { data: created } = await $fetch.post<User, CreateUserDto>(
  'https://api.example.com/users',
  { name: 'Mamun', email: 'mamun@example.com', role: 'admin' }
)

// With options — headers, params, timeout, etc.
const { data: results } = await $fetch.get<SearchResult[]>(
  'https://api.example.com/search',
  {
    params: { q: 'typescript', limit: 10 },
    headers: { 'X-Api-Key': process.env.SEARCH_API_KEY! },
    timeout: 5_000,
  }
)
```

### Using `createFetch` for a shared instance

Create once, import everywhere. Use relative paths after `baseURL` is set.

```ts
// src/lib/api.ts
import { createFetch } from '@/lib/$fetch'

export const api = createFetch({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  headers: {
    Accept: 'application/json',
    'X-App-Version': '1.0.0',
  },
  timeout: 10_000,
  next: { revalidate: 60 },
})
```

```ts
// anywhere in your app
import { api } from '@/lib/api'

const { data: user } = await api.get<User>('/users/1')
const { data: created } = await api.post<User, CreateUserDto>('/users', {
  name: 'Mamun',
  email: 'mamun@example.com',
  role: 'admin',
})
```

### `createFetch` options

| Option         | Type                     | Description                                                          |
| -------------- | ------------------------ | -------------------------------------------------------------------- |
| `baseURL`      | `string`                 | Prepended to every relative path. Trailing slashes normalised.       |
| `headers`      | `Record<string, string>` | Default headers merged into every request (per-request headers win). |
| `timeout`      | `number`                 | Default timeout in milliseconds. Overridable per-request.            |
| `interceptors` | `Interceptors`           | Lifecycle hooks — see [Lifecycle Hooks](#lifecycle-hooks).           |
| `next`         | `NextOptions`            | Default Next.js caching options. Per-request `next` merged on top.   |

---

## HTTP Methods

All methods work identically on both `$fetch` and a `createFetch` instance. The only difference is whether you pass a full URL or a relative path.

### GET

Use for reading data. Safe and idempotent — no body is sent.

```ts
// $fetch — full URL required
const { data: user } = await $fetch.get<User>('https://api.example.com/users/1')

const { data: users } = await $fetch.get<User[]>(
  'https://api.example.com/users',
  {
    params: { page: 1, limit: 20 },
  }
)

// createFetch instance — relative path, base URL from instance config
const { data: user } = await api.get<User>('/users/1')

const { data: users } = await api.get<User[]>('/users', {
  params: { page: 1, limit: 20 },
})
```

### POST

Use for creating resources or submitting data.

```ts
interface CreateUserDto {
  name: string
  email: string
  role: 'admin' | 'user'
}

interface UserResponse {
  id: string
  name: string
  email: string
}

// $fetch — full URL
const { data } = await $fetch.post<UserResponse, CreateUserDto>(
  'https://api.example.com/users',
  { name: 'Mamun', email: 'mamun@example.com', role: 'admin' }
)

// createFetch instance — relative path
const { data } = await api.post<UserResponse, CreateUserDto>('/users', {
  name: 'Mamun',
  email: 'mamun@example.com',
  role: 'admin',
})
```

### PUT

Use for full resource replacement — the body replaces the entire resource.

```ts
// $fetch
const { data } = await $fetch.put<UserResponse, CreateUserDto>(
  'https://api.example.com/users/123',
  { name: 'Mamun Updated', email: 'mamun@example.com', role: 'user' }
)

// createFetch instance
const { data } = await api.put<UserResponse, CreateUserDto>('/users/123', {
  name: 'Mamun Updated',
  email: 'mamun@example.com',
  role: 'user',
})
```

### PATCH

Use for partial updates — only send the fields you want to change.

```ts
// $fetch
const { data } = await $fetch.patch<UserResponse, Partial<CreateUserDto>>(
  'https://api.example.com/users/123',
  { role: 'admin' }
)

// createFetch instance
const { data } = await api.patch<UserResponse, Partial<CreateUserDto>>(
  '/users/123',
  { role: 'admin' }
)
```

**When to use PUT vs PATCH:**

- `PUT` — you are sending the complete replacement object
- `PATCH` — you are sending only the changed fields

### DELETE

Use for removing resources.

```ts
// $fetch — no response body
await $fetch.delete('https://api.example.com/users/123')

// $fetch — with typed response body
const { data } = await $fetch.delete<{ success: boolean }>(
  'https://api.example.com/users/123'
)

// createFetch instance
await api.delete('/users/123')
const { data } = await api.delete<{ success: boolean }>('/users/123')
```

### HEAD

Identical to GET but the server returns only headers — no body. Use to check if a resource exists or probe ETag/cache headers without transferring data.

```ts
// $fetch
const { status, headers } = await $fetch.head(
  'https://api.example.com/users/123'
)

// createFetch instance
const { status, headers } = await api.head('/users/123')

const exists = status === 200
const etag = headers.get('etag')
```

### OPTIONS

Use for CORS preflight or to discover which methods an endpoint accepts.

```ts
// $fetch
const { headers } = await $fetch.options('https://api.example.com/users')

// createFetch instance
const { headers } = await api.options('/users')

const allowed = headers.get('allow') // e.g. "GET, POST, PUT"
```

### `request` (escape hatch)

Use when you need a method not covered by the named shortcuts, or when the method is determined at runtime.

```ts
// $fetch
const { data } = await $fetch.request<ReportData>(
  'REPORT',
  'https://api.example.com/calendar',
  { body: { start: '2024-01-01', end: '2024-12-31' } }
)

// createFetch instance
const { data } = await api.request<ReportData>('REPORT', '/calendar', {
  body: { start: '2024-01-01', end: '2024-12-31' },
})
```

---

## Request Options

Every method accepts a `FetchOptions` object. It extends `Omit<RequestInit, 'body' | 'method'>`, so all native fetch options are available alongside our additions.

### Query Parameters

Pass `params` and the utility serialises them into the URL automatically. Arrays become repeated keys. `null` and `undefined` values are silently skipped.

```ts
// $fetch
await $fetch.get('https://api.example.com/users', {
  params: {
    page: 1,
    limit: 20,
    status: 'active',
    role: ['admin', 'editor'], // → &role=admin&role=editor
    search: undefined, // → omitted automatically
  },
})
// → GET https://api.example.com/users?page=1&limit=20&status=active&role=admin&role=editor

// createFetch instance — same options, relative path
await api.get('/users', {
  params: {
    page: 1,
    limit: 20,
    role: ['admin', 'editor'],
  },
})
// → GET {baseURL}/users?page=1&limit=20&role=admin&role=editor
```

### Request Body

The body is serialised automatically based on its type:

| Body type            | What `$fetch` does     | `Content-Type` set                  |
| -------------------- | ---------------------- | ----------------------------------- |
| Plain object / array | `JSON.stringify(body)` | `application/json` (auto)           |
| `FormData`           | Sent as-is             | Set by runtime (includes boundary)  |
| `URLSearchParams`    | Sent as-is             | `application/x-www-form-urlencoded` |
| `Blob`               | Sent as-is             | Not set — you set it                |
| `ArrayBuffer` / view | Sent as-is             | Not set — you set it                |
| `string`             | Sent as-is             | Not set — you set it                |

> `Content-Type` is only auto-set for plain objects and only if you haven't already provided it.

### Custom Headers

Per-request headers are merged on top of instance defaults. Header names are compared case-insensitively — `Content-Type` and `content-type` are treated as the same key.

```ts
// $fetch — you must pass every header yourself
await $fetch.get('https://api.example.com/admin/report', {
  headers: {
    Authorization: `Bearer ${token}`,
    'X-Admin-Token': process.env.ADMIN_SECRET!,
    'Accept-Language': 'en-US',
  },
})

// createFetch instance — instance headers (e.g. Authorization) are added automatically.
// Per-request headers are merged on top and win on conflict.
await api.get('/admin/report', {
  headers: {
    'X-Admin-Token': process.env.ADMIN_SECRET!, // merged with instance headers
    'Accept-Language': 'en-US',
  },
})
```

### Timeout

Aborts the request and throws a `FetchError` with `isTimeout === true` when exceeded.

```ts
// $fetch — pass timeout on every request that needs it
const { data } = await $fetch.get('https://api.example.com/health', {
  timeout: 2_000,
})

// createFetch instance — set a default, override per-request
const api = createFetch({ timeout: 10_000 }) // 10 s default

const { data } = await api.get('/health', { timeout: 2_000 }) // override to 2 s
const { data: big } = await api.get('/export', { timeout: 60_000 }) // override to 60 s
```

### Base URL Override

Override the `baseURL` for a single request. Works on both `$fetch` (sets a one-off base) and an instance (overrides for that request only).

```ts
// $fetch — useful when most of your requests go to one host
// but one request goes elsewhere
const { data } = await $fetch.get('/v2/rates', {
  baseURL: 'https://currency.example.com',
})
// → GET https://currency.example.com/v2/rates

// createFetch instance — hit a different microservice from a shared instance
const { data } = await api.get('/v2/rates', {
  baseURL: 'https://currency.example.com', // overrides instance baseURL for this request
})
```

### Native `RequestInit` Options

Because `FetchOptions` extends `RequestInit`, every native fetch option works directly on both `$fetch` and instances:

```ts
// $fetch
await $fetch.get('https://api.example.com/me', {
  credentials: 'include', // send cookies cross-origin
  mode: 'cors',
  redirect: 'follow',
  referrerPolicy: 'strict-origin-when-cross-origin',
  keepalive: true, // keep request alive after page unload
  integrity: 'sha256-abc123=', // subresource integrity check
  cache: 'no-store', // native cache control
})

// createFetch instance — same options available
await api.get('/me', {
  credentials: 'include',
  mode: 'cors',
  cache: 'no-store',
})
```

---

## Next.js Caching

`$fetch` has first-class support for Next.js App Router caching via the `next` option. This maps directly to the `next` property that Next.js injects into `fetch()`.

Both `$fetch` and instances support per-request `next` options. Instances additionally support instance-level defaults.

### ISR — Time-based Revalidation

Cache the response and revalidate it in the background after `n` seconds.

```ts
// $fetch — set revalidate on each request
const { data } = await $fetch.get<Product[]>(
  'https://api.example.com/products',
  {
    next: { revalidate: 300 }, // cache for 5 minutes
  }
)

// createFetch instance — set a project-wide default, override per-request
const api = createFetch({
  next: { revalidate: 60 }, // 1 minute default for all requests
})

const { data: products } = await api.get<Product[]>('/products')
// ↑ inherits revalidate: 60 from instance

const { data: config } = await api.get('/static-config', {
  next: { revalidate: 3600 }, // override to 1 hour for this request
})
```

### Tag-based On-demand Revalidation

Tag the cached response so it can be invalidated programmatically with `revalidateTag()`.

```ts
// $fetch
const { data: post } = await $fetch.get<Post>(
  `https://api.example.com/posts/${slug}`,
  {
    next: { tags: [`post-${slug}`, 'posts'] },
  }
)

// createFetch instance
const { data: post } = await api.get<Post>(`/posts/${slug}`, {
  next: { tags: [`post-${slug}`, 'posts'] },
})
```

```ts
// Server Action — invalidate tagged caches (same regardless of which you used above)
'use server'
import { revalidateTag } from 'next/cache'

export async function publishPost(slug: string) {
  await api.patch(`/posts/${slug}`, { published: true })
  revalidateTag(`post-${slug}`)
  revalidateTag('posts')
}
```

### Opt out of Caching

Use `revalidate: false` to tell Next.js never to cache this response. Ideal for real-time or user-specific data.

```ts
// $fetch
const { data } = await $fetch.get('https://api.example.com/prices/btc', {
  next: { revalidate: false },
})

// createFetch instance — override the instance default for this request
const { data } = await api.get('/prices/btc', {
  next: { revalidate: false },
})
```

### Explicit Cache Mode

Use `cache` directly when you need the full native `RequestCache` vocabulary.

```ts
// $fetch
await $fetch.get('https://api.example.com/session', { cache: 'no-store' })
await $fetch.get('https://api.example.com/config', { cache: 'force-cache' })

// createFetch instance
await api.get('/session', { cache: 'no-store' })
await api.get('/config', { cache: 'force-cache' })
```

**Priority order when both `cache` and `next.revalidate` are set:**

`cache` (explicit) **>** `next.revalidate: false` → `no-store` **>** `next.revalidate: number` → `force-cache`

---

## Lifecycle Hooks

`$fetch` is itself a `createFetch()` call with no options — the same hook engine runs underneath both. The difference is that hooks are **configured at creation time** via `createFetch({ interceptors: { ... } })`. Since `$fetch` is pre-built with no interceptors, you cannot add hooks to it after the fact.

> **If you need hooks, call `createFetch({ interceptors: { ... } })`** to create your own instance with interceptors configured upfront.

```ts
const api = createFetch({
  interceptors: {
    onRequest: (req) => {
      /* ... */ return req
    },
    onResponse: (res) => {
      /* ... */ return res
    },
    onSuccess: (res) => {
      /* ... */ return res
    },
    onError: (err) => {
      /* ... */ throw err
    },
  },
})
```

### Execution order

```
onRequest → fetch() → onResponse → onSuccess
                           │ (non-2xx)
                        onError → throw
                ↓ (network / timeout)
             onError → throw
```

### `onRequest`

Runs immediately before `fetch()`, after all options are merged and the URL is built. This is the **only stage** where the outgoing request can still be mutated.

**Use for:** attaching auth tokens, injecting trace IDs, logging outgoing requests.

```ts
const api = createFetch({
  interceptors: {
    onRequest: (req) => {
      const token = getToken()
      if (token) {
        ;(req.init.headers as Record<string, string>)['Authorization'] =
          `Bearer ${token}`
      }

      ;(req.init.headers as Record<string, string>)['X-Request-Id'] =
        crypto.randomUUID()

      console.log(`→ ${req.method} ${req.url}`)

      return req // must return the request
    },
  },
})
```

> `$fetch` runs the same engine but was created with no `onRequest` configured. To attach auth headers globally, create your own instance via `createFetch({ interceptors: { onRequest: ... } })`. For a one-off request, pass `headers` directly on the call.

### `onResponse`

Runs after `fetch()` resolves and the body is parsed, **before the 2xx check**. Receives every response regardless of status — including 4xx and 5xx.

**Use for:** logging all responses, metrics, reading headers that are only present on error responses.

```ts
const api = createFetch({
  interceptors: {
    onResponse: (res) => {
      console.log(`← ${res.status} ${res.statusText}`)
      metrics.histogram('http.status', res.status)

      // Returning ok: true suppresses the error for this status
      if (res.status === 404) {
        return { ...res, ok: true, data: null }
      }

      return res // must return the response
    },
  },
})
```

> `$fetch` runs the same engine but was created with no `onResponse` configured. To observe every response globally, create your own instance via `createFetch({ interceptors: { onResponse: ... } })`.

### `onSuccess`

Runs only for **successful (2xx) responses**, after `onResponse`. The right place to transform or unwrap data before it reaches the caller.

**Use for:** unwrapping API envelope shapes, normalising response structure, camelCase conversion.

```ts
interface ApiEnvelope<T> {
  payload: T
  meta: { requestId: string }
}

const api = createFetch({
  interceptors: {
    onSuccess: (res) => {
      const enveloped = res.data as ApiEnvelope<unknown>
      return { ...res, data: enveloped.payload }
    },
  },
})

// Caller receives the unwrapped T directly — not ApiEnvelope<User>
const { data } = await api.get<User>('/users/1')
```

> `$fetch` runs the same engine but was created with no `onSuccess` configured. If you find yourself unwrapping envelopes after every call, create an instance via `createFetch({ interceptors: { onSuccess: ... } })` to do it once globally.

### `onError`

Runs just before a `FetchError` is thrown — covers non-2xx HTTP errors, network failures, and timeouts in one unified place. **Must re-throw** the error or throw a new one.

**Use for:** centralised error logging, Sentry reporting, token refresh, 401 redirects.

```ts
const api = createFetch({
  interceptors: {
    onError: (err) => {
      Sentry.captureException(err, {
        extra: { status: err.status, response: err.response?.data },
      })

      if (err.status === 401) {
        router.push('/login')
        throw err
      }

      if (err.status >= 500) {
        toast.error('Something went wrong. Please try again.')
      }

      throw err // must always re-throw
    },
  },
})
```

> `$fetch` runs the same engine but was created with no `onError` configured. For one-off error handling, use `try/catch` at the call site. For centralised handling across all requests, create an instance via `createFetch({ interceptors: { onError: ... } })`.

---

## Response Shape

Every method on both `$fetch` and instances returns `Promise<FetchResponse<TData>>`:

```ts
interface FetchResponse<TData> {
  data: TData // parsed response body
  status: number // HTTP status code (e.g. 200, 404)
  statusText: string // HTTP status text (e.g. "OK", "Not Found")
  headers: Headers // raw response Headers object
  ok: boolean // true when status is 200–299
}
```

**Body parsing** is automatic based on `Content-Type`:

| `Content-Type`     | Parsed as    |
| ------------------ | ------------ |
| `application/json` | `res.json()` |
| `text/*`           | `res.text()` |
| anything else      | `res.blob()` |
| 204 / empty body   | `undefined`  |

```ts
// $fetch
const { data, status, headers, ok } = await $fetch.get<User>(
  'https://api.example.com/users/1'
)

// createFetch instance
const { data, status, headers, ok } = await api.get<User>('/users/1')

// Read a response header — same on both
const rateLimit = headers.get('x-ratelimit-remaining')
```

---

## Error Handling

Non-2xx responses, network failures, and timeouts all throw a `FetchError`.

Handle errors per-call with `try/catch` (works with both `$fetch` and instances), or handle them globally with the `onError` hook on a `createFetch` instance.

### `FetchError`

```ts
class FetchError extends Error {
  status: number // HTTP code, 0 = network error, -1 = timeout
  statusText: string // "Not Found" | "Network Error" | "Timeout"
  response?: FetchResponse<unknown> // parsed response (only when server responded)

  get isHttpError(): boolean // status > 0 — server responded with non-2xx
  get isNetworkError(): boolean // status === 0 — no server response at all
  get isTimeout(): boolean // status === -1 — request exceeded timeout
}
```

### Error Guards

```ts
import { $fetch, FetchError } from '@/lib/$fetch'

// With $fetch directly — handle per-call
try {
  const { data } = await $fetch.get<User>('https://api.example.com/users/1')
} catch (err) {
  if (err instanceof FetchError) {
    if (err.isTimeout) {
      console.error('Request timed out')
    } else if (err.isNetworkError) {
      console.error('No internet connection')
    } else if (err.isHttpError) {
      console.error(`HTTP ${err.status}: ${err.statusText}`)

      // Access the parsed error body returned by the server
      const errorBody = err.response?.data as { message: string }
      console.error(errorBody.message)

      if (err.status === 401) {
        /* unauthorised */
      }
      if (err.status === 403) {
        /* forbidden */
      }
      if (err.status === 404) {
        /* not found */
      }
      if (err.status === 422) {
        /* validation error */
      }
    }
  }
}

// With createFetch instance — handle globally in onError, locally in try/catch, or both
try {
  const { data } = await api.get<User>('/users/1')
} catch (err) {
  if (err instanceof FetchError) {
    // onError already ran at this point (logging, redirects, etc.)
    // Handle anything you want to do at the call site
  }
}
```

---

## Cancellation

Pass an `AbortSignal` to cancel a request. If a `timeout` is also set, either source can abort the request — whichever fires first.

```ts
const controller = new AbortController()

setTimeout(() => controller.abort(), 3_000) // cancel after 3 s

// $fetch
try {
  const { data } = await $fetch.get('https://api.example.com/slow', {
    signal: controller.signal,
  })
} catch (err) {
  if (err instanceof FetchError && err.isNetworkError) {
    console.log('Request was cancelled')
  }
}

// createFetch instance — same signal option
try {
  const { data } = await api.get('/slow', { signal: controller.signal })
} catch (err) {
  if (err instanceof FetchError && err.isNetworkError) {
    console.log('Request was cancelled')
  }
}
```

**In React — cancel on unmount:**

```ts
import { $fetch, FetchError } from '@/lib/$fetch'

useEffect(() => {
  const controller = new AbortController()

  // Works with $fetch directly
  $fetch
    .get<User[]>('https://api.example.com/users', { signal: controller.signal })
    .then(({ data }) => setUsers(data))
    .catch((err) => {
      if (!(err instanceof FetchError && err.isNetworkError)) throw err
    })

  // Or with an instance
  api
    .get<User[]>('/users', { signal: controller.signal })
    .then(({ data }) => setUsers(data))
    .catch((err) => {
      if (!(err instanceof FetchError && err.isNetworkError)) throw err
    })

  return () => controller.abort()
}, [])
```

---

## TypeScript API

### Exported Types

| Export                 | Kind        | Description                                 |
| ---------------------- | ----------- | ------------------------------------------- |
| `$fetch`               | `const`     | Default zero-config instance                |
| `createFetch`          | `function`  | Factory to create a configured instance     |
| `FetchError`           | `class`     | Error thrown on all failures                |
| `HttpMethod`           | `type`      | `'GET' \| 'POST' \| 'PUT' \| ...`           |
| `QueryParams`          | `type`      | `Record<string, Primitive \| Primitive[]>`  |
| `QueryParamValue`      | `type`      | `Primitive \| Primitive[]`                  |
| `FetchOptions<TBody>`  | `interface` | Per-request options (extends `RequestInit`) |
| `FetchResponse<TData>` | `interface` | Normalised response shape                   |
| `ResolvedRequest`      | `interface` | Shape received by `onRequest` hook          |
| `Interceptors`         | `interface` | All four lifecycle hooks                    |
| `CreateFetchOptions`   | `interface` | Options for `createFetch()`                 |
| `NextOptions`          | `interface` | `{ revalidate?, tags? }`                    |

### Generic Type Parameters

Most methods accept two type parameters:

```ts
// $fetch
$fetch.post<TData, TBody>(url, body, options)
//          ↑      ↑
//          response body

// createFetch instance — same signature
api.post<TData, TBody>(url, body, options)
```

You can pass just the response type and let TypeScript infer `TBody`:

```ts
// $fetch
const { data } = await $fetch.post<User>(
  'https://api.example.com/users',
  { name: 'Mamun' } // ← TBody inferred as { name: string }
)

// createFetch instance
const { data } = await api.post<User>(
  '/users',
  { name: 'Mamun' } // ← TBody inferred as { name: string }
)
```

---

## Real-World Recipes

### Auth API Client

Use `createFetch` — hooks must be configured at creation time. Since `$fetch` is pre-built with no interceptors, you need your own instance to attach `onRequest` for the token and `onError` for the 401 redirect.

```ts
// src/lib/api.ts
import { createFetch } from '@/lib/$fetch'
import { getSession, clearSession } from '@/lib/session'

export const api = createFetch({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    'X-Client': 'web',
  },
  interceptors: {
    onRequest: async (req) => {
      const session = await getSession()
      if (session?.accessToken) {
        ;(req.init.headers as Record<string, string>)['Authorization'] =
          `Bearer ${session.accessToken}`
      }
      return req
    },
    onError: async (err) => {
      if (err.status === 401) {
        await clearSession()
        window.location.href = '/login'
      }
      throw err
    },
  },
})
```

### File Upload

Works with both `$fetch` and instances. Do **not** set `Content-Type` manually — the runtime sets it with the correct multipart boundary when the body is `FormData`.

```ts
// With $fetch directly
async function uploadAvatar(file: File, userId: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('userId', userId)

  const { data } = await $fetch.post<{ url: string }, FormData>(
    'https://api.example.com/upload/avatar',
    form
  )

  return data.url
}

// With createFetch instance
async function uploadAvatar(file: File, userId: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('userId', userId)

  const { data } = await api.post<{ url: string }, FormData>(
    '/upload/avatar',
    form
  )

  return data.url
}
```

### Server Component with ISR

Both `$fetch` and instances work in Server Components. Use `createFetch` if you need a shared `baseURL` or auth headers server-side.

```ts
// app/products/page.tsx

// With $fetch directly — good for a one-off fetch with no shared config
import { $fetch } from '@/lib/$fetch'

export default async function ProductsPage() {
  const { data: products } = await $fetch.get<Product[]>(
    `${process.env.API_URL}/products`,
    {
      next: { revalidate: 600, tags: ['products'] },
    },
  )

  return <ul>{products.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
}

// With createFetch instance — preferred when you have a shared api instance
import { api } from '@/lib/api'

export default async function ProductsPage() {
  const { data: products } = await api.get<Product[]>('/products', {
    next: { revalidate: 600, tags: ['products'] },
  })

  return <ul>{products.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
}
```

### Server Action with Tag Revalidation

```ts
// app/actions/product.ts
'use server'
import { revalidateTag } from 'next/cache'

// With $fetch directly
import { $fetch } from '@/lib/$fetch'

export async function deleteProduct(id: string) {
  await $fetch.delete(`${process.env.API_URL}/products/${id}`)
  revalidateTag('products')
}

// With createFetch instance — cleaner with no repeated base URL
import { api } from '@/lib/api'

export async function deleteProduct(id: string) {
  await api.delete(`/products/${id}`)
  revalidateTag('products')
}

export async function updateProduct(id: string, data: Partial<Product>) {
  await api.patch(`/products/${id}`, data)
  revalidateTag('products')
  revalidateTag(`product-${id}`)
}
```

### Token Refresh on 401

Use `createFetch` — the `onError` hook is required for this pattern.

```ts
// src/lib/api.ts
import { createFetch } from '@/lib/$fetch'

let isRefreshing = false

export const api = createFetch({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  interceptors: {
    onRequest: (req) => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        ;(req.init.headers as Record<string, string>)['Authorization'] =
          `Bearer ${token}`
      }
      return req
    },
    onError: async (err) => {
      if (err.status === 401 && !isRefreshing) {
        isRefreshing = true
        try {
          const { data } = await api.post<{ accessToken: string }>(
            '/auth/refresh',
            { token: localStorage.getItem('refreshToken') }
          )
          localStorage.setItem('accessToken', data.accessToken)
          isRefreshing = false
        } catch {
          isRefreshing = false
          localStorage.clear()
          window.location.href = '/login'
        }
      }
      throw err
    },
  },
})
```

# useFetch

A lightweight, reusable, type-safe React hook for executing asynchronous functions (including Next.js Server Actions) with built-in state management.

It provides a simple API for handling:

- ✅ Loading state
- ✅ Success state
- ✅ Error state
- ✅ Returned data
- ✅ Manual execution
- ✅ Optional automatic execution
- ✅ Success & error callbacks
- ✅ Fully typed with TypeScript

---

## Features

- 🚀 Fully type-safe
- ⚛️ Built for React Hooks
- 🔥 Works with Next.js Server Actions
- 📦 Works with any async function returning a Promise
- 🛡 Prevents state updates after component unmount
- 🎯 Generic argument support
- 🎯 Generic return type support
- ♻️ Stable `execute()` function
- 🧹 Reset API
- ⚡ Minimal API
- ❤️ No external dependencies

---

## Installation

Simply copy the hook into your project.

```
src/
└── lib/
    └── fetch/
        └── useFetch.ts
```

Import it whenever needed.

```ts
import { useFetch } from '@/lib/fetch/useFetch'
```

---

# API

```ts
const { data, error, status, isLoading, isSuccess, isError, execute, reset } =
  useFetch(options)
```

---

# Options

```ts
interface UseFetchOptions<TData, TArgs extends unknown[]> {
  action: (...args: TArgs) => Promise<TData>

  immediate?: boolean

  args?: TArgs

  onSuccess?: (data: TData) => void | Promise<void>

  onError?: (error: Error) => void | Promise<void>
}
```

| Option    | Required | Description                               |
| --------- | -------- | ----------------------------------------- |
| action    | ✅       | Async function or Server Action           |
| immediate | ❌       | Execute automatically after mount         |
| args      | ❌       | Default arguments for automatic execution |
| onSuccess | ❌       | Callback after successful execution       |
| onError   | ❌       | Callback after failed execution           |

---

# Returned Values

```ts
interface UseFetchResult<TData, TArgs extends unknown[]> {
  data: TData | null

  error: Error | null

  status: 'idle' | 'loading' | 'success' | 'error'

  isLoading: boolean

  isSuccess: boolean

  isError: boolean

  execute(...args)

  reset()
}
```

---

# Status Flow

```
idle
  │
  ▼
loading
  │
  ├────► success
  │
  └────► error
```

---

# Basic Example

Suppose you have a Server Action.

```ts
'use server'

export async function getUser(id: string) {
  const user = await db.user.findUnique({
    where: { id },
  })

  return user
}
```

Use it inside your component.

```tsx
'use client'

const { data, isLoading, execute } = useFetch({
  action: getUser,
})

const handleClick = async () => {
  await execute('123')
}
```

---

# Automatic Fetch

Fetch immediately after mounting.

```tsx
const { data, isLoading } = useFetch({
  action: getUsers,
  immediate: true,
})
```

---

# Automatic Fetch with Arguments

```tsx
const { data } = useFetch({
  action: getUser,
  immediate: true,
  args: ['123'],
})
```

---

# Manual Fetch

```tsx
const { execute } = useFetch({
  action: getUser,
})

await execute('123')
```

---

# Error Handling

```tsx
const { execute, error } = useFetch({
  action: getUser,
})

try {
  await execute('123')
} catch (err) {
  console.log(err)
}
```

---

# Using onSuccess

```tsx
const { execute } = useFetch({
  action: getUser,

  onSuccess(data) {
    console.log(data)
  },
})
```

---

# Using onError

```tsx
const { execute } = useFetch({
  action: getUser,

  onError(error) {
    console.error(error)
  },
})
```

---

# Using Both

```tsx
const { execute } = useFetch({
  action: getUser,

  onSuccess(data) {
    toast.success('Loaded')
  },

  onError(error) {
    toast.error(error.message)
  },
})
```

---

# Reset State

```tsx
const { reset } = useFetch({
  action: getUser,
})

reset()
```

State becomes

```ts
{
    data: null,
    error: null,
    status: 'idle'
}
```

---

# Delete Example

```tsx
const { execute, isLoading } = useFetch({
  action: deleteUser,
})

const handleDelete = async () => {
  try {
    const result = await execute(userId)

    toast.success('Deleted')
  } catch (error) {
    toast.error('Delete failed')
  }
}
```

---

# Form Submit Example

```tsx
const { execute, isLoading } = useFetch({
  action: createPost,
})

const onSubmit = async (values) => {
  await execute(values)
}
```

---

# Status Example

```tsx
if (status === 'idle') {
  return <>Idle</>
}

if (status === 'loading') {
  return <>Loading...</>
}

if (status === 'success') {
  return <>Success</>
}

if (status === 'error') {
  return <>Something went wrong</>
}
```

---

# Type Inference

The hook automatically infers:

- Function arguments
- Return type

Example

```ts
async function getUser(id: string) {
  return {
    id,
    name: 'John',
  }
}

const { execute, data } = useFetch({
  action: getUser,
})
```

TypeScript automatically knows

```ts
execute(id: string)

data?.name
```

without writing any generic types manually.

---

# Works With

- React
- Next.js
- Next.js Server Actions
- REST APIs
- GraphQL
- Prisma
- Firebase
- Supabase
- Any Promise-based async function

---

# Notes

- `execute()` is memoized and remains stable across renders.
- State updates are skipped automatically after the component unmounts.
- Supports both manual and automatic execution.
- Errors are re-thrown after internal state updates, allowing callers to handle them with `try/catch`.
- Designed to be framework-agnostic for any Promise-returning function.

---

# Example

```tsx
const { data, error, status, isLoading, execute, reset } = useFetch({
  action: getUsers,
  immediate: true,
})
```

---

# License

MITs
