# `$fetch`

A production-ready, type-safe fetch utility for **TypeScript + Next.js (App Router)**.

It extends the native `RequestInit` interface directly, so every current and future browser/Next.js fetch option (`cache`, `credentials`, `signal`, `next.revalidate`, `next.tags`, ...) works out of the box with **zero extra code** — plus `baseUrl`, automatic query/body serialization, timeouts, retries, lifecycle hooks, and a typed error class.

```ts
import { createFetch, FetchError, isHttpError } from '@/lib/fetch'
import { $fetch } from '@/lib/fetch/fetch' // the unconfigured core
```

> **In this app, use the configured client** — `import { $fetch } from '@/lib/$fetch'`. It adds the backend base URL, auth cookie forwarding, silent refresh, a 10s timeout, and one retry for idempotent reads. The unconfigured core is deliberately not re-exported from `@/lib/fetch` so the two can't be confused; the examples below that use it import it from `@/lib/fetch/fetch`.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Generics — Type Parameter Order](#generics--type-parameter-order)
- [Two Ways to Use It](#two-ways-to-use-it)
  - [1. `$fetch` directly](#1-fetch-directly)
  - [2. `createFetch()` — a preconfigured instance](#2-createfetch--a-preconfigured-instance)
- [HTTP Method Shorthands](#http-method-shorthands)
- [Query Parameters](#query-parameters)
- [Request Body](#request-body)
- [The Response Shape](#the-response-shape)
- [Error Handling — `FetchError`](#error-handling--fetcherror)
- [Timeouts, Retries & Response Types](#timeouts-retries--response-types)
- [Lifecycle Hooks](#lifecycle-hooks)
  - [`onRequest`](#onrequest)
  - [`onResponse`](#onresponse)
  - [`onSuccess`](#onsuccess)
  - [`onError`](#onerror)
  - [Hook Composition (instance + call level)](#hook-composition-instance--call-level)
- [Config Merge Rules](#config-merge-rules)
- [Next.js Caching (`next.revalidate` / `next.tags`)](#nextjs-caching-nextrevalidate--nexttags)
- [Authentication with httpOnly Cookies (Access + Refresh Tokens)](#authentication-with-httponly-cookies-access--refresh-tokens)
  - [Handling HttpOnly Cookie Authentication](#handling-httponly-cookie-authentication)
  - [Server Components, Server Actions & Route Handlers (Node.js) — cookies are NOT automatic](#server-components-server-actions--route-handlers-nodejs--cookies-are-not-automatic)
  - [CORS note for cross-origin APIs](#cors-note-for-cross-origin-apis)
- [Full Real-World Example](#full-real-world-example)
- [API Reference](#api-reference)

---

## Installation

Copy the `lib/fetch/` folder into your Next.js project:

```
lib/fetch/
├── types.ts
├── serialize-params.ts
├── serialize-body.ts
├── build-url.ts
├── fetch-error.ts
├── merge-config.ts
├── method-shorthands.ts
├── parse-response.ts
├── retry.ts
├── fetch.ts
├── create-fetch.ts
└── index.ts
```

No dependencies beyond TypeScript + the native `fetch`/`Headers`/`Response` types already available in Next.js.

---

## Quick Start

```ts
import { $fetch } from '@/lib/fetch/fetch'
import type { TLoginInput } from '@/types/auth.types'
import type { TUserResponse } from '@/types/user.types'

const { data, status, ok } = await $fetch<TUserResponse, TLoginInput>(
  '/auth/login',
  {
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
    method: 'POST',
    body: { email: 'alice@example.com', password: 'SecurePass1!' },
  }
)

console.log(data.data.email) // fully typed as `string`
```

---

## Generics — Type Parameter Order

Every generic call in this library follows the **same order, always**:

```ts
;(TResponse, TBody, TParams)
```

| Position    | Meaning                                          | Applies to                                     |
| ----------- | ------------------------------------------------ | ---------------------------------------------- |
| `TResponse` | Shape of the parsed response body (`data`)       | all calls                                      |
| `TBody`     | Shape of the request body (before serialization) | `$fetch`, `.post`, `.put`, `.patch`, `.delete` |
| `TParams`   | Shape of the query params (before serialization) | all calls                                      |

Bodyless methods (`.get`, `.head`) skip `TBody` and go straight from `TResponse` to `TParams`:

```ts
$fetch<TResponse, TBody, TParams>(url, init)
$fetch.get<TResponse, TParams>(url, init)
$fetch.post<TResponse, TBody, TParams>(url, init)
```

---

## Two Ways to Use It

### 1. `$fetch` directly

Use this when you don't need shared defaults — every call is fully self-contained.

```ts
import { $fetch } from '@/lib/fetch/fetch'
import type { TUsersResponse, TUserQueryOptions } from '@/types/user.types'

// NOTE: use `type`, not `interface`, for params types — see callout below
const { data } = await $fetch<TUsersResponse, unknown, TUserQueryOptions>(
  '/users',
  {
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
    method: 'GET',
    params: { page: 1, limit: 20 },
    next: { revalidate: 60 },
  }
)
```

> **`type` vs `interface` for params:** `TParams` is constrained to `extends QueryParams` (`Record<string, QueryParamValue>`). A plain `interface { page: number }` does **not** satisfy that constraint — TypeScript requires an explicit index signature on interfaces in this position and will error with `Index signature for type 'string' is missing`. A `type` alias with the same shape works fine, and so does `interface Foo extends QueryParams { page: number }`. Stick to `type` for any params shape you plan to pass as `TParams`.

You can also pass an **absolute** URL and skip `baseUrl` entirely:

```ts
const { data } = await $fetch<TUsersResponse>('https://api.example.com/users')
```

### 2. `createFetch()` — a preconfigured instance

Use this to create a reusable client with shared defaults — `baseUrl`, common headers, and shared lifecycle hooks — that every call can still override per-request.

```ts
// lib/api.ts
import { createFetch } from '@/lib/fetch'
import { getAuthToken } from '@/lib/auth'

export const api = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    Accept: 'application/json',
  },
  next: { revalidate: 60 },
  onRequest: (req) => {
    const token = getAuthToken()
    if (token) {
      const headers = new Headers(req.init.headers)
      headers.set('Authorization', `Bearer ${token}`)
      req.init.headers = headers
    }
    return req
  },
  onError: (error) => {
    console.error('[api] request failed:', error)
    throw error
  },
})
```

Then use `api` **exactly like `$fetch`** anywhere in your app — relative paths now resolve against the configured `baseUrl`:

```ts
import { api } from '@/lib/api'
import type { TUsersResponse, TUserQueryOptions } from '@/types/user.types'

const { data } = await api<TUsersResponse, unknown, TUserQueryOptions>(
  '/users',
  { params: { page: 1, limit: 20 } }
)
```

Passing any property in a call to `api` **overrides** the corresponding instance default for that call only (see [Config Merge Rules](#config-merge-rules)).

---

## HTTP Method Shorthands

Both `$fetch` and any `createFetch()`-created instance expose `.get`, `.post`, `.put`, `.patch`, `.delete`, and `.head`. `method` is fixed internally, so it's **omitted** from the options type — you never pass `method` yourself with these.

```ts
import type {
  TUsersResponse,
  TUserQueryOptions,
  TUserResponse,
  TCreateUserInput,
  TUpdateProfileInput,
} from '@/types/user.types'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL

// GET — bodyless, so only TResponse and TParams are generic
const { data: users } = await $fetch.get<TUsersResponse, TUserQueryOptions>(
  '/users',
  {
    baseUrl,
    params: { page: 1, limit: 20 },
  }
)

// POST — body-carrying, so TResponse, TBody, TParams
const { data: created } = await $fetch.post<TUserResponse, TCreateUserInput>(
  '/users',
  {
    baseUrl,
    body: { email: 'alice@example.com', password: 'SecurePass1!' },
  }
)

// PUT — full replacement
await $fetch.put<TUserResponse, TCreateUserInput>('/users/abc123', {
  baseUrl,
  body: { email: 'alice@example.com', password: 'SecurePass1!' },
})

// PATCH — partial update
await $fetch.patch<TUserResponse, TUpdateProfileInput>('/users/me', {
  baseUrl,
  body: { firstName: 'Alice', bio: 'Engineer' },
})

// DELETE
await $fetch.delete<TUserResponse>('/users/abc123', { baseUrl })

// HEAD
const { response } = await $fetch.head('/users/me', { baseUrl })
response.headers.get('Content-Length')
```

The same shorthands work on a `createFetch()` instance — `baseUrl` and other defaults are inherited automatically:

```ts
import { createFetch } from '@/lib/fetch'
import type {
  TUsersResponse,
  TUserResponse,
  TCreateUserInput,
} from '@/types/user.types'

export const api = createFetch({ baseUrl: process.env.NEXT_PUBLIC_SITE_URL })

const { data: users } = await api.get<TUsersResponse>('/users')
const { data: newUser } = await api.post<TUserResponse, TCreateUserInput>(
  '/users',
  { body: { email: 'bob@example.com', password: 'SecurePass2!' } }
)
```

---

## Query Parameters

Pass a plain object via `params` — it's serialized automatically:

```ts
import type { TUserQueryOptions } from '@/types/user.types'

await $fetch<unknown, unknown, TUserQueryOptions>('/users', {
  baseUrl,
  params: {
    page: 2, // number  -> "2"
    limit: 20, // number  -> "20"
    searchTerm: 'alice', // string -> "alice"
    role: undefined, // omitted entirely
    isVerified: null, // omitted entirely
  },
})
// -> /users?page=2&limit=20&searchTerm=alice
```

Serialization rules:

| Value type                      | Result                         |
| ------------------------------- | ------------------------------ |
| `string` / `number` / `boolean` | stringified as-is              |
| `Array<Primitive>`              | repeated keys (`?tag=a&tag=b`) |
| `null` / `undefined`            | key omitted                    |

If `input` already contains a query string, it's preserved and merged with `params`.

---

## Request Body

Pass `body` in whatever shape makes sense — it's serialized based on its type:

```ts
import type { TCreateUserInput } from '@/types/user.types'
import type { TLoginInput } from '@/types/auth.types'

// Plain object -> JSON.stringify'd automatically, Content-Type: application/json set
await $fetch.post<unknown, TLoginInput>('/auth/login', {
  baseUrl,
  body: { email: 'alice@example.com', password: 'SecurePass1!' },
})

// POST create user
await $fetch.post<unknown, TCreateUserInput>('/users', {
  baseUrl,
  body: { email: 'bob@example.com', password: 'SecurePass2!', role: 'USER' },
})

// FormData -> passed through untouched; any preset Content-Type is removed so the runtime sets the multipart boundary
const form = new FormData()
form.append('avatar', file)
await $fetch.patch('/users/me/avatar', { baseUrl, body: form })

// Blob / ArrayBuffer / URLSearchParams / ReadableStream / string -> all passed through untouched
await $fetch.post('/upload', { baseUrl, body: someBlob })
```

Rules:

- **Plain objects/arrays** → `JSON.stringify`-ed, and `Content-Type: application/json` is set **only if you haven't already set one**.
- **Native `BodyInit` values** (`FormData`, `Blob`, `ArrayBuffer`, typed arrays, `URLSearchParams`, `ReadableStream`, `string`) → passed through untouched, with no `Content-Type` added.
- **`FormData`** → any `Content-Type` you (or an instance default) set is **removed**. Only the runtime knows the multipart boundary; a preset `application/json` would make the upload unreadable by the server. Don't set a JSON `Content-Type` as an instance default — plain-object bodies get it automatically.
- **`null` / `undefined`** → no body sent.

---

## The Response Shape

Every successful (or hook-recovered) call resolves to a `FetchResponse<TResponse>`:

```ts
interface FetchResponse<TResponse> {
  data: TResponse // parsed body (JSON, text, or FormData depending on Content-Type)
  response: Response // the native Response; its body has already been read into `data`
  status: number
  statusText: string
  ok: boolean
  url: string
  message: string | null // data.message, if the body is an object with a string `message` field
}
```

```ts
// Non-2xx responses throw a FetchError, so a resolved call is always `ok`
const { data, status, message } = await $fetch<TUsersResponse>('/users', {
  baseUrl,
})
```

Response body parsing is automatic based on `Content-Type`:

| Content-Type                                                | Parsed as (`responseType: 'auto'`, the default)                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `application/json`, `application/*+json`                    | `JSON.parse`; malformed JSON on a 2xx throws a `parse` `FetchError`, on an error response it's kept as text |
| `text/*`                                                    | plain text                                                                                                  |
| `multipart/form-data` / `application/x-www-form-urlencoded` | `FormData`                                                                                                  |
| anything else / missing                                     | `JSON.parse` if it parses, otherwise raw text                                                               |
| `204` / `205` / `304`, `Content-Length: 0`, or no body      | `null`                                                                                                      |

For binary payloads pass an explicit `responseType` (`'blob'`, `'arrayBuffer'`, or `'stream'` for the raw `ReadableStream`) — `auto` decodes unknown types as text, which corrupts binary data.

---

## Error Handling — `FetchError`

Every failure `$fetch` detects throws a `FetchError`. Its `kind` says what happened:

| `kind`    | When                                                                  | `status` / `data`     |
| --------- | --------------------------------------------------------------------- | --------------------- |
| `http`    | a response arrived with `ok === false`                                | set from the response |
| `network` | no usable response — DNS failure, refused connection, reset socket, … | `0` / `null`          |
| `timeout` | the `timeout` option elapsed (covers reading the body too)            | `0` / `null`          |
| `abort`   | the caller's own `signal` aborted                                     | `0` / `null`          |
| `parse`   | a 2xx body couldn't be parsed as declared                             | set from the response |

```ts
import { FetchError, isHttpError, isTimeoutError } from '@/lib/fetch'

try {
  await api.get<TUserResponse>(`/users/${encodeURIComponent(id)}`)
} catch (error) {
  if (isHttpError<IErrorResponse>(error)) {
    console.log(error.status) // 404
    console.log(error.data) // parsed error body, e.g. { message: "Not Found" }
    console.log(error.message) // data.message, else statusText, else "Request failed with status 404"
  }
  if (isTimeoutError(error)) {
    // back off, show "service unavailable", ...
  }
  if (error instanceof FetchError) {
    console.log(error.kind, error.request.method, error.request.url)
    console.log(error.cause) // the native error, for network/timeout/abort/parse
  }
  throw error
}
```

The generic on `FetchError<TData>` / `isHttpError<TData>` is the **error** body type, which is usually different from the success type. `error.request` never includes headers or the body, so logging a `FetchError` doesn't leak cookies.

Errors thrown by your own `onRequest` / `onResponse` hooks are not wrapped — they propagate unchanged.

In this app, Server Actions turn a `FetchError` into an `IErrorResponse` value with `handleFetchError` (`src/lib/error.ts`) rather than throwing, because Next.js hides a thrown error's message in production.

---

## Timeouts, Retries & Response Types

```ts
const api = createFetch({
  baseUrl,
  timeout: 10_000, // per attempt, including reading the body
  retry: 1, // one extra attempt for idempotent requests
})

// Per call, everything is overridable
await api.get('/reports/export', {
  timeout: 60_000,
  retry: 0,
  responseType: 'blob',
})

await api.get('/users', {
  retry: {
    attempts: 2,
    methods: ['GET'], // default: GET, HEAD, OPTIONS
    statusCodes: [502, 503, 504], // default: 408, 429, 502, 503, 504
    baseDelayMs: 250, // exponential backoff with jitter
    maxDelayMs: 3_000, // a longer Retry-After stops retrying instead of waiting
  },
})
```

- **Timeouts** use `AbortSignal.timeout`, combined with your own `signal` via `AbortSignal.any`. A timeout throws `kind: 'timeout'`; your own abort throws `kind: 'abort'` and is never retried.
- **Retries** are off by default and only replay failures that are safe to replay: an allowed (idempotent) method, and a `network`/`timeout` error or one of `statusCodes`. `Retry-After` is honoured up to `maxDelayMs`. Retries run before `onError`, so a hook only sees the final failure. Don't add `POST`/`PATCH` to `methods` unless the endpoint is idempotent.

---

## Lifecycle Hooks

Four hooks are available on both `$fetch` calls and `createFetch()` defaults:

```ts
{
  onRequest: (req: RequestContext) => RequestContext | Promise<RequestContext>
  onResponse: (res: Response) => Response | Promise<Response>
  onSuccess: (res: FetchResponse<T>) =>
    FetchResponse<T> | Promise<FetchResponse<T>>
  onError: (error: unknown, context: ErrorContext) => unknown | Promise<unknown>
}
```

### `onRequest`

Runs right before the native `fetch` call, with the fully-built URL and `RequestInit`. Use it to inject headers (e.g. auth tokens), log outgoing requests, or mutate the URL.

```ts
const api = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  onRequest: (req) => {
    const headers = new Headers(req.init.headers)
    headers.set('Authorization', `Bearer ${getToken()}`)
    req.init.headers = headers
    console.log('->', req.init.method ?? 'GET', req.url)
    return req
  },
})
```

### `onResponse`

Runs right after the native `fetch` resolves, before the body is parsed. Useful for logging status codes or globally handling things like token refresh on `401`.

```ts
const api = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  onResponse: (res) => {
    console.log('<-', res.status, res.url)
    return res
  },
})
```

### `onSuccess`

Runs only when `response.ok === true`, after the body has been fully parsed into a `FetchResponse`. Use it to reshape or unwrap the result.

```ts
const { data } = await $fetch<{ result: TUsersResponse }>('/users', {
  baseUrl,
  onSuccess: (res) => {
    // unwrap an API envelope, e.g. { result: {...}, meta: {...} }
    return { ...res, data: res.data.result as unknown as TUsersResponse }
  },
})
```

### `onError`

Runs whenever a request fails, after any automatic retries — `error` is a `FetchError` (check `error.kind`), or whatever your own `onRequest`/`onResponse` hook threw. Return a value to have `$fetch` **resolve** with that value instead of throwing; return `undefined` (or just don't return) to let the error keep propagating.

```ts
// Recover from a 404 with a default value instead of throwing
const { data } = await $fetch<TUsersResponse>('/users', {
  baseUrl,
  onError: (error) => {
    if (error instanceof FetchError && error.status === 404) {
      return {
        data: {
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPage: 0 },
        },
        response: error.response,
        status: 404,
        statusText: error.statusText,
        ok: false,
        url: error.url,
        message: 'not found, using empty fallback',
      }
    }
    throw error // rethrow everything else
  },
})
```

```ts
// Global logging without recovery — just rethrow
const api = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  onError: (error) => {
    console.error('[api] request failed:', error)
    throw error
  },
})
```

#### Retrying from `onError`

`onError` also receives a second argument, `context`, with the request as it was sent (`context.request`) and a one-shot `context.retry(init?)`. `init` is merged over the original `RequestInit` (headers per-key). The retry runs `onResponse`, the automatic retry policy, and `onSuccess`, but never `onError` again, so it cannot loop; a failed retry throws. Bodies that can only be read once (e.g. a `ReadableStream`) can't be retried.

```ts
// Refresh auth, then re-send with the new cookie (see src/lib/$fetch.ts)
onError: async (error, context) => {
  if (!isHttpError(error) || error.status !== 401) {
    throw error
  }
  const cookie = await getFreshCookieHeader()
  return context.retry({ headers: { Cookie: cookie } })
}
```

### Hook Composition (instance + call level)

When using a `createFetch()` instance, `onRequest` / `onResponse` / `onSuccess` hooks **compose** — the instance-level hook runs first, and its output is passed into the call-level hook:

```ts
const api = createFetch({
  baseUrl,
  onRequest: (req) => {
    console.log('1. instance onRequest')
    return req
  },
})

await api('/users', {
  onRequest: (req) => {
    console.log('2. call-level onRequest')
    return req
  },
})
// logs: "1. instance onRequest" then "2. call-level onRequest"
```

`onError` composes in the **opposite** order — the call-level hook runs first. If it recovers (returns a value) or throws a _different_ error, that wins; if it returns `undefined` or rethrows the same error, the instance-level hook still runs. That keeps an instance-wide concern like silent token refresh working even when a call adds its own error handling:

```ts
const api = createFetch({
  baseUrl,
  onError: async (error, context) => refreshAndRetry(error, context), // instance-level
})

await api('/users', {
  onError: (error) => {
    console.warn('users request failed', error) // runs first
    // returns undefined → the instance-level refresh still gets its turn
  },
})
```

---

## Config Merge Rules

When calling through a `createFetch()` instance, per-call config is merged over the instance defaults as follows:

| Option                                                                                            | Merge behavior                                                                        |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `headers`                                                                                         | shallow-merged; call-level wins per-key                                               |
| `params`                                                                                          | shallow-merged; call-level wins per-key                                               |
| `next` (`revalidate`, `tags`)                                                                     | shallow-merged; call-level wins per-key                                               |
| `onRequest`, `onResponse`, `onSuccess`                                                            | composed — instance runs first, then call-level                                       |
| `onError`                                                                                         | composed — call-level runs first, instance-level unless the call-level hook recovered |
| everything else (`method`, `cache`, `signal`, `baseUrl`, `timeout`, `retry`, `responseType`, ...) | call-level overrides instance default                                                 |

---

## Next.js Caching (`next.revalidate` / `next.tags`)

Since `FetchConfig` extends the native `RequestInit`, Next.js's server-side `next` cache options work exactly as they do with the built-in `fetch`:

```ts
// Revalidate this cached response every 60 seconds
await $fetch('/users', { baseUrl, next: { revalidate: 60 } })

// Tag it for on-demand revalidation via revalidateTag('users')
await $fetch('/users', { baseUrl, next: { tags: ['users'] } })

// Opt out of caching entirely
await $fetch('/users', { baseUrl, cache: 'no-store' })
```

These options are server-only; on the client they're simply ignored, matching Next.js's own `fetch` behavior.

> **Next.js 16:** `fetch` is **not cached by default**, and reading `cookies()` (which the app client does on every call) makes the route dynamic. `next.tags` alone therefore creates no cache entry. In Server Actions, invalidate with `updateTag(tag)` so the user sees their own write on the next render; `revalidateTag(tag, 'max')` serves stale content while it revalidates.

---

## Authentication with httpOnly Cookies (Access + Refresh Tokens)

A common pattern: your backend issues an `accessToken` and `refreshToken` as **httpOnly cookies** on login (so client-side JS can never read or tamper with them). How you handle this differs completely depending on **where the code runs** — this is the part that trips people up in Next.js, so here's the split explicitly:

|                                             | Client Components (browser)                                                         | Server Components / Server Actions / Route Handlers (Node.js)                                                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cookies attached to outgoing requests?      | **Yes, automatically** — the browser does it, you just set `credentials: 'include'` | **No.** There's no browser cookie jar on the server. You must manually read the incoming request's cookies and forward them as a `Cookie` header.             |
| `Set-Cookie` response stored automatically? | **Yes, automatically** — the browser stores it                                      | **No.** You must manually read `response.headers.getSetCookie()` and write each cookie back with Next's `cookies().set(...)`.                                 |
| Where can cookies be written?               | N/A (browser handles it)                                                            | Only inside a **Server Action** or **Route Handler** — a Server Component's render is read-only and will throw if you try to call `cookies().set(...)` there. |

> **Next.js version note:** `cookies()` from `next/headers` returns an **async** cookie store in Next.js 15+ (this project uses **Next.js 16**), so all examples below use `await cookies()`. See Examples below for the full cookie-forwarding pattern.

## Handling HttpOnly Cookie Authentication

If your backend issues `accessToken` and `refreshToken` via **HttpOnly cookies**, you must handle this differently depending on whether the request is made from the **Client** (Browser) or the **Server** (Server Components / Server Actions).

### 1. Client-Side (Browser) Requests

On the client side, the browser automatically sends and receives cookies. You only need to set `credentials: 'include'` so that cross-origin requests include the cookies:

```ts
import { createFetch } from '@/lib/fetch'

export const clientApi = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include', // Ensure browser cookies are sent and Set-Cookie is honored
})
```

### 2. Server-Side (Next.js Server Components / Actions)

When Next.js renders a Server Component or executes a Server Action, it runs on the Node.js server. The native `fetch` on the server **does not automatically forward** the client's browser cookies to your backend API.

You must manually forward the incoming cookies using `next/headers`:

The configured client in [`src/lib/$fetch.ts`](../$fetch.ts) does this for the whole app:

- `onRequest` forwards **only the auth cookies** (`accessToken`, `refreshToken`) as a `Cookie` header.
- `onResponse` mirrors **only auth** `Set-Cookie` headers back with `cookies().set()`, dropping `Domain` (the cookie is re-issued by the Next.js origin).
- `onError` handles a 401 from a non-`/auth/*` endpoint: `refreshSession()` (`src/lib/auth/refresh.ts`), then `context.retry()` with the new `Cookie` header.
- `timeout: 10_000` and `retry: 1` for idempotent reads.

Read that file rather than copying a snapshot of it from here.

> **Note:** `cookies().set()` from `next/headers` throws when called inside a Server Component's render (read-only context). The `onResponse` cookie-write logic is silently ignored there — it only takes effect inside Server Actions and Route Handlers.

---

#### 1. Login — server sets the cookies

The backend's login response includes `Set-Cookie` headers; the browser stores them automatically as long as the request was made with `credentials: 'include'` (or `'same-origin'` if the API shares the same domain):

```ts
// lib/api.ts
import { createFetch } from '@/lib/fetch'

export const api = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include', // always send + accept cookies for every request
  headers: { Accept: 'application/json' },
})
```

```ts
// features/auth/api.ts
import { api } from '@/lib/api'

export interface LoginBody {
  email: string
  password: string
}

export interface LoginResponse {
  user: { id: string; name: string }
  // no tokens in the JSON body — they arrive as httpOnly Set-Cookie headers instead
}

export function login(body: LoginBody) {
  return api.post<LoginResponse, LoginBody>('/auth/login', { body })
}
```

Example backend response headers (for reference — this is server-side, not something you write in `$fetch`):

```
Set-Cookie: accessToken=eyJhbGciOi...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900
Set-Cookie: refreshToken=dGhpc2lzYX...; HttpOnly; Secure; SameSite=Lax; Path=/auth/refresh; Max-Age=2592000
```

Because these are `HttpOnly`, `document.cookie` never sees them and neither does your JS — that's the point. You don't (and can't) manually attach an `Authorization` header for them; the browser attaches the cookies to matching requests on its own.

```tsx
// features/auth/login-form.tsx
'use client'

import { login } from '@/features/auth/api'
import { useState, useTransition } from 'react'

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      action={(form) =>
        startTransition(async () => {
          try {
            await login({
              email: String(form.get('email')),
              password: String(form.get('password')),
            })
            window.location.assign('/dashboard') // full navigation so Server Components re-read the new cookies
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign-in failed')
          }
        })
      }
    >
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
      {error && <p>{error}</p>}
    </form>
  )
}
```

#### 2. Every request sends the cookies automatically

Once `credentials: 'include'` is set (either as an instance default, as above, or per-call), every subsequent request automatically includes the cookies — no manual token handling required:

```ts
// the browser attaches accessToken/refreshToken cookies automatically
const { data } = await api.get<TUsersResponse>('/users')
```

If you're calling `$fetch` directly instead of through a `createFetch()` instance, just pass it per-call:

```ts
await $fetch('/users', { baseUrl, credentials: 'include' })
```

#### 3. Silent refresh on a `401` (client-side)

When the `accessToken` cookie expires, the API returns `401`. Refresh it by calling a refresh endpoint (also with `credentials: 'include'`, so the `refreshToken` cookie is sent), which responds with a new `Set-Cookie: accessToken=...` — then retry the original request once.

> **Note:** `onError` only receives the `error`, not the original request, so it can't transparently retry the failed call by itself. The clean way to get "refresh-then-retry" behavior is a small wrapper around the call site, shown below.

```ts
// lib/auth-refresh.ts
import { api } from '@/lib/api'
import { FetchError } from '@/lib/fetch'

let refreshPromise: Promise<void> | null = null

function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', {}) // sends the refreshToken cookie; backend responds with a new accessToken cookie
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export async function withAuthRetry<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request()
  } catch (error) {
    if (error instanceof FetchError && error.status === 401) {
      await refreshAccessToken() // throws if the refresh token is also invalid/expired
      return request() // retry exactly once with the freshly-set accessToken cookie
    }
    throw error
  }
}
```

```ts
// features/users/api.ts
import { api } from '@/lib/api'
import { withAuthRetry } from '@/lib/auth-refresh'
import type { TUsersResponse, TUserQueryOptions } from '@/types/user.types'

export function getUsers(params: TUserQueryOptions) {
  return withAuthRetry(() =>
    api.get<TUsersResponse, TUserQueryOptions>('/users', { params })
  )
}
```

If the refresh call itself fails (refresh token expired/invalid too), `withAuthRetry` rethrows — handle that at a higher level (e.g. redirect to `/login`):

```ts
try {
  const { data } = await getUsers({ page: 1 })
} catch (error) {
  if (error instanceof FetchError && error.status === 401) {
    router.push('/login')
    return
  }
  throw error
}
```

For centralized logging (without swallowing the error, since it still needs to reach `withAuthRetry`/the caller), an instance-level `onError` is a good place to just observe and rethrow:

```ts
export const api = createFetch({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  onError: (error) => {
    if (error instanceof FetchError && error.status === 401) {
      console.warn('[api] access token expired')
    }
    throw error
  },
})
```

#### 4. Logout

Logout is just another cookie-sending request — the backend clears the cookies (typically by re-setting them with `Max-Age=0`):

```ts
export function logout() {
  return api.post('/auth/logout', {})
}
```

### Server Components, Server Actions & Route Handlers (Node.js) — cookies are NOT automatic

This is the part worth double-checking: code in a Server Component, Server Action, or Route Handler runs on the server, in Node.js — there is no browser, so there's no automatic cookie jar. Setting `credentials: 'include'` here has **no effect at all**; the underlying `fetch` (undici) simply doesn't have any cookies to attach unless you put them on the request yourself, and it won't store anything from `Set-Cookie` unless you write it back to the Next.js response yourself.

Concretely, this means two things you have to do by hand:

1. **Forward the incoming request's cookies** onto the outgoing `fetch` call to your backend, as a plain `Cookie` header.
2. **Read the backend's `Set-Cookie` header(s)** off the response and write them onto your own response via `cookies().set(...)` from `next/headers` — and this can only happen inside a **Server Action** or **Route Handler**, never inside a Server Component's render.

#### 1. Forwarding incoming cookies to the backend

```ts
// lib/api-server.ts
import { cookies } from 'next/headers'
import { createFetch } from '@/lib/fetch'

export function createServerApi() {
  const incomingCookies = cookies() // read-only snapshot of the current request's cookies

  const cookieHeader = incomingCookies
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')

  return createFetch({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      Accept: 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    // credentials: 'include' is meaningless here — there's no browser cookie jar to opt into.
  })
}
```

`createServerApi()` is called **per-request** (once per Server Component render, Server Action invocation, or Route Handler call) since `cookies()` is tied to the current request context — don't hoist it to a module-level singleton.

#### 2. Fetching data in a Server Component

Server Components can only **read** cookies (via the helper above), never write them:

```tsx
// app/users/page.tsx
import { redirect } from 'next/navigation'
import { createServerApi } from '@/lib/api-server'
import { FetchError } from '@/lib/fetch'
import type { TUsersResponse, TUserQueryOptions } from '@/types/user.types'

export default async function UsersPage() {
  const api = createServerApi()

  try {
    const { data } = await api.get<TUsersResponse, TUserQueryOptions>(
      '/users',
      {
        params: { page: 1 },
      }
    )

    return (
      <ul>
        {data.data.map((u) => (
          <li key={u.id}>
            {u.email} — {u.role}
          </li>
        ))}
      </ul>
    )
  } catch (error) {
    if (error instanceof FetchError && error.status === 401) {
      redirect('/login')
    }
    throw error
  }
}
```

#### 3. Login via a Server Action — writing `Set-Cookie` back to the browser

Node's `fetch` (undici) exposes every individual `Set-Cookie` header via `response.headers.getSetCookie()` (requires Node 18.14+ / a matching Next.js version) — a plain `.get('set-cookie')` folds multiple cookies into one comma-joined string per the Fetch spec and loses the ability to set them individually, so `getSetCookie()` is what you want here.

```ts
// features/auth/actions.ts
'use server'

import { cookies } from 'next/headers'
import { $fetch } from '@/lib/fetch/fetch'
import { FetchError } from '@/lib/fetch'

export interface LoginBody {
  email: string
  password: string
}

export interface LoginResponse {
  user: { id: string; name: string }
}

interface ParsedCookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  path?: string
  maxAge?: number
}

export function applySetCookies(response: Response): void {
  const setCookieHeaders = response.headers.getSetCookie?.() ?? []
  const cookieStore = cookies()

  for (const raw of setCookieHeaders) {
    const [pair, ...attrs] = raw.split(';').map((part) => part.trim())
    const eqIndex = pair.indexOf('=')
    const name = pair.slice(0, eqIndex)
    const value = pair.slice(eqIndex + 1)

    const options: ParsedCookieOptions = {}
    for (const attr of attrs) {
      const [key, val] = attr.split('=')
      switch (key.toLowerCase()) {
        case 'httponly':
          options.httpOnly = true
          break
        case 'secure':
          options.secure = true
          break
        case 'samesite':
          options.sameSite =
            val?.toLowerCase() as ParsedCookieOptions['sameSite']
          break
        case 'path':
          options.path = val
          break
        case 'max-age':
          options.maxAge = Number(val)
          break
      }
    }

    cookieStore.set(name, value, options)
  }
}

export async function loginAction(body: LoginBody) {
  try {
    const { data, response } = await $fetch.post<LoginResponse, LoginBody>(
      '/auth/login',
      {
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        body,
      }
    )

    applySetCookies(response) // writes accessToken + refreshToken as httpOnly cookies onto the Next.js response

    return { success: true as const, user: data.user }
  } catch (error) {
    if (error instanceof FetchError) {
      return { success: false as const, message: error.message }
    }
    throw error
  }
}
```

> If parsing `Set-Cookie` attributes by hand feels fragile for your setup, swap the loop above for a small dependency like [`set-cookie-parser`](https://www.npmjs.com/package/set-cookie-parser) — `applySetCookies` is the only place that would need to change. Alternatively, if you control the backend, having it return the token values in the JSON body **for server-to-server calls only** (while still setting httpOnly cookies for direct browser calls) lets you skip header parsing entirely and just call `cookies().set('accessToken', data.accessToken, { httpOnly: true, secure: true, sameSite: 'lax' })` directly.

```tsx
// features/auth/login-form.tsx (Server Action version)
'use client'

import { useTransition } from 'react'
import { loginAction } from '@/features/auth/actions'

export function LoginForm() {
  const [isPending, startTransition] = useTransition()

  return (
    <form
      action={(formData: FormData) => {
        startTransition(async () => {
          const result = await loginAction({
            email: String(formData.get('email')),
            password: String(formData.get('password')),
          })
          if (result.success) {
            window.location.assign('/dashboard')
          }
        })
      }}
    >
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
```

#### 4. Silent refresh on a `401` (server-side)

Unlike the client-side `withAuthRetry`, a Server Component can't retry itself mid-render the way a client hook can — refresh-and-retry needs to happen in a Server Action or Route Handler that can both read and write cookies.

```ts
// features/auth/refresh-server.ts
'use server'

import { cookies } from 'next/headers'
import { $fetch } from '@/lib/fetch/fetch'
import { applySetCookies } from '@/features/auth/actions'

export async function refreshAccessTokenServer(): Promise<void> {
  const incomingCookies = cookies()
  const cookieHeader = incomingCookies
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')

  const { response } = await $fetch.post('/auth/refresh', {
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    headers: { Cookie: cookieHeader }, // manually forward the refreshToken cookie
  })

  applySetCookies(response) // backend responds with a new accessToken Set-Cookie; write it onto our response
}
```

```ts
// features/users/server-api.ts
import { createServerApi } from '@/lib/api-server'
import { refreshAccessTokenServer } from '@/features/auth/refresh-server'
import { FetchError } from '@/lib/fetch'
import type { TUsersResponse, TUserQueryOptions } from '@/types/user.types'

export async function getUsersServer(params: TUserQueryOptions) {
  try {
    return await createServerApi().get<TUsersResponse, TUserQueryOptions>(
      '/users',
      { params }
    )
  } catch (error) {
    if (error instanceof FetchError && error.status === 401) {
      await refreshAccessTokenServer()
      // re-read cookies() now that refreshAccessTokenServer() has updated them
      return await createServerApi().get<TUsersResponse, TUserQueryOptions>(
        '/users',
        { params }
      )
    }
    throw error
  }
}
```

This has to be called from something that can write cookies (a Server Action, or a Route Handler), since `refreshAccessTokenServer()` calls `cookies().set(...)` internally — calling `getUsersServer` directly from a Server Component's render will throw when the refresh path is hit. Wrap Server Component data-fetching in a Route Handler or Server Action if a 401 refresh needs to happen during that page's render, or catch the 401 in the Server Component and `redirect('/login')` instead of attempting a refresh there.

#### 5. Logout via a Server Action

```ts
// features/auth/actions.ts (continued)
'use server'

import { cookies } from 'next/headers'
import { $fetch } from '@/lib/fetch/fetch'

export async function logoutAction(): Promise<void> {
  const incomingCookies = cookies()
  const cookieHeader = incomingCookies
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')

  await $fetch.post('/auth/logout', {
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    headers: { Cookie: cookieHeader },
  })

  // clear locally too, in case the backend's Set-Cookie response is delayed or dropped
  incomingCookies.delete('accessToken')
  incomingCookies.delete('refreshToken')
}
```

### CORS note for cross-origin APIs

This only applies to **Client Component** (browser) calls — server-to-server calls from a Server Component/Action/Route Handler aren't subject to CORS at all, since CORS is a browser security mechanism.

If your Next.js app and API are on different origins, `credentials: 'include'` requires the backend to respond with:

```
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: https://your-app.com   (must be the exact origin, never "*")
```

and cookies need `SameSite=None; Secure` instead of `Lax`/`Strict` for cross-site requests to actually be sent. This is entirely backend/CORS configuration — no change needed on the `$fetch` side beyond `credentials: 'include'`.

---

## Full Real-World Example

A complete, end-to-end setup showing the **actual pattern used in this project** — HttpOnly cookie-based auth via `src/lib/$fetch.ts` + server actions:

```ts
// src/lib/$fetch.ts — the pre-configured server-side instance (abridged; read the file)
import 'server-only'
import { API_BASE_URL } from '@/env'
import { createFetch, isHttpError } from '@/lib/fetch'

export const $fetch = createFetch({
  baseUrl: API_BASE_URL,
  timeout: 10_000,
  retry: 1,
  onRequest: forwardAuthCookies, // only accessToken/refreshToken
  onResponse: mirrorAuthSetCookies, // only auth cookies, Domain dropped
  onError: refreshOn401AndRetry, // skips /auth/*, retries once
})
```

```ts
// src/app/actions/auth.ts — Server Actions using $fetch
'use server'

import { $fetch } from '@/lib/$fetch'
import type { TLoginInput } from '@/types/auth.types'
import type { TUserResponse } from '@/types/user.types'

export const loginUser = async (data: TLoginInput) => {
  const { data: response } = await $fetch.post<TUserResponse, TLoginInput>(
    '/auth/login',
    { body: data }
  )
  return response
}
```

```ts
// src/app/actions/user.ts — Server Actions using $fetch
'use server'

import { $fetch } from '@/lib/$fetch'
import type {
  TUsersResponse,
  TUserResponse,
  TUserQueryOptions,
} from '@/types/user.types'

export const getAllUsers = async (params: TUserQueryOptions) => {
  const { data: response } = await $fetch.get<
    TUsersResponse,
    TUserQueryOptions
  >('/users', { params })
  return response
}

export const getMyProfile = async () => {
  const { data: response } = await $fetch.get<TUserResponse>('/users/me')
  return response
}
```

```tsx
// src/app/(dashboard)/users/page.tsx — Server Component consuming the actions
import { getAllUsers } from '@/app/actions/user'
import { FetchError } from '@/lib/fetch'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  try {
    const users = await getAllUsers({ page: 1, limit: 20 })
    return (
      <ul>
        {users.data.map((u) => (
          <li key={u.id}>
            {u.email} — {u.role}
          </li>
        ))}
      </ul>
    )
  } catch (error) {
    if (error instanceof FetchError && error.status === 401) {
      redirect('/login')
    }
    throw error
  }
}
```

```tsx
// src/components/modules/auth/login-form.tsx — Client Component + Server Action (abridged)
'use client'

import { loginUser } from '@/app/actions/auth'
import type { TLoginInput } from '@/types/auth.types'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function LoginForm() {
  const [isPending, startTransition] = useTransition()

  const onSubmit = (data: TLoginInput) => {
    startTransition(async () => {
      // Expected failures (bad credentials, validation, outage) come back as
      // an IErrorResponse value — the action never throws for them.
      const result = await loginUser(data)
      if (result.success) {
        window.location.assign('/dashboard')
        return
      }
      toast.error(result.message)
    })
  }

  return (
    <form /* react-hook-form handleSubmit(onSubmit) */>
      {/* form fields */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
```

---

## API Reference

### `$fetch<TResponse, TBody, TParams>(input, init?)`

The core fetch wrapper. Also exposes `.get`, `.post`, `.put`, `.patch`, `.delete`, `.head`.

- `input: string` — absolute URL, or relative path (requires `baseUrl` in `init`).
- `init?: FetchConfig<TResponse, TBody, TParams>` — extends native `RequestInit` (minus `body`, re-typed) plus:
  - `baseUrl?: string`
  - `params?: TParams`
  - `body?: TBody | BodyInit | null`
  - `next?: { revalidate?: number | false; tags?: string[] }`
  - `timeout?: number` — ms per attempt
  - `retry?: number | RetryOptions`
  - `responseType?: 'auto' | 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'`
  - `onRequest? / onResponse? / onSuccess? / onError?`
- Returns: `Promise<FetchResponse<TResponse>>`
- Throws: `FetchError` for every HTTP and transport failure (see `kind`), unless recovered by `onError`.

### `createFetch(defaults?)`

Creates a preconfigured, callable instance with the same signature (and method shorthands) as `$fetch`, merging `defaults` under every call per the [Config Merge Rules](#config-merge-rules).

### `FetchError<TData>`

Extends `Error`. Properties: `kind`, `request` (`{ method, url }`), `response` (or `null`), `status` (`0` without a response), `statusText`, `ok`, `url`, `data` (the parsed **error** body), plus `message` and `cause`. Guards: `isFetchError`, `isHttpError`, `isTimeoutError`, `isNetworkError`.

### Types

`FetchConfig`, `FetchResponse`, `FetchHooks`, `CreateFetchConfig`, `RequestContext`, `QueryParams`, `QueryParamValue`, `Primitive`, `FetchBody`, `NextFetchRequestConfig`, `FetchFn`, `FetchMethods`, `OnRequestHook`, `OnResponseHook`, `OnSuccessHook`, `OnErrorHook`, `ErrorContext`, `ResponseType`, `RetryOptions`, `FetchErrorKind`, `FetchErrorRequest`, `FetchErrorInit` — all exported from `@/lib/fetch`.
