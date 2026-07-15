# `$fetch`

A production-ready, type-safe fetch utility for **TypeScript + Next.js (App Router)**.

It extends the native `RequestInit` interface directly, so every current and future browser/Next.js fetch option (`cache`, `credentials`, `signal`, `next.revalidate`, `next.tags`, ...) works out of the box with **zero extra code** — plus `baseUrl`, automatic query/body serialization, lifecycle hooks, and a typed error class.

```ts
import { $fetch, createFetch, FetchError } from '@/lib/fetch'
```

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
- [Lifecycle Hooks](#lifecycle-hooks)
  - [`onRequest`](#onrequest)
  - [`onResponse`](#onresponse)
  - [`onSuccess`](#onsuccess)
  - [`onError`](#onerror)
  - [Hook Composition (instance + call level)](#hook-composition-instance--call-level)
- [Config Merge Rules](#config-merge-rules)
- [Next.js Caching (`next.revalidate` / `next.tags`)](#nextjs-caching-nextrevalidate--nexttags)
- [`useFetch` — React Hook for Actions & Client Calls](#usefetch--react-hook-for-actions--client-calls)
  - [Manual trigger](#manual-trigger)
  - [Run immediately on mount](#run-immediately-on-mount)
  - [Passing arguments](#passing-arguments)
  - [`onSuccess` / `onError` callbacks](#onsuccess--onerror-callbacks)
  - [Resetting state](#resetting-state)
  - [Using `useFetch` with the `api` client (not just Server Actions)](#using-usefetch-with-the-api-client-not-just-server-actions)
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
├── fetch.ts
├── create-fetch.ts
├── use-fetch.ts
└── index.ts
```

No dependencies beyond TypeScript + the native `fetch`/`Headers`/`Response` types already available in Next.js.

---

## Quick Start

```ts
import { $fetch } from '@/lib/fetch'
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
import { $fetch } from '@/lib/fetch'
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
const { headers } = await $fetch.head('/users/me', { baseUrl })
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

// FormData -> passed through untouched, Content-Type left alone (correct multipart boundary)
const form = new FormData()
form.append('avatar', file)
await $fetch.patch('/users/me/avatar', { baseUrl, body: form })

// Blob / ArrayBuffer / URLSearchParams / ReadableStream / string -> all passed through untouched
await $fetch.post('/upload', { baseUrl, body: someBlob })
```

Rules:

- **Plain objects/arrays** → `JSON.stringify`-ed, and `Content-Type: application/json` is set **only if you haven't already set one**.
- **Native `BodyInit` values** (`FormData`, `Blob`, `ArrayBuffer`, typed arrays, `URLSearchParams`, `ReadableStream`, `string`) → passed through completely untouched, with no `Content-Type` override — this matters for correct `multipart/form-data` boundaries.
- **`null` / `undefined`** → no body sent.

---

## The Response Shape

Every successful (or hook-recovered) call resolves to a `FetchResponse<TResponse>`:

```ts
interface FetchResponse<TResponse> {
  data: TResponse // parsed body (JSON, text, or FormData depending on Content-Type)
  response: Response // the raw, untouched Response object
  status: number
  statusText: string
  ok: boolean
  url: string
  headers: Headers
  message: string | null // data.message, if the body is an object with a string `message` field
}
```

```ts
const { data, status, ok, message } = await $fetch<TUsersResponse>('/users', {
  baseUrl,
})

if (ok) {
  console.log(data.data)
} else {
  console.log(status, message)
}
```

Response body parsing is automatic based on `Content-Type`:

| Content-Type                                                | Parsed as                                             |
| ----------------------------------------------------------- | ----------------------------------------------------- |
| `application/json` (or unknown/missing)                     | `JSON.parse`, falls back to raw text if parsing fails |
| `text/*`                                                    | plain text                                            |
| `multipart/form-data` / `application/x-www-form-urlencoded` | `FormData`                                            |
| `204` / `205` status, or `Content-Length: 0`                | `null`                                                |

---

## Error Handling — `FetchError`

When the response resolves with `ok === false`, `$fetch` throws a `FetchError` carrying the full parsed response as direct properties:

```ts
import { $fetch, FetchError } from '@/lib/fetch'

try {
  await $fetch('/users/999', { baseUrl })
} catch (error) {
  if (error instanceof FetchError) {
    console.log(error.status) // 404
    console.log(error.statusText) // "Not Found"
    console.log(error.data) // parsed body, e.g. { message: "Not Found" }
    console.log(error.message) // "Not Found" (Error.message, from data.message)
    console.log(error.headers) // response Headers
    console.log(error.response) // raw Response
  }
  throw error
}
```

**Network-level failures** (DNS errors, aborted requests, offline, etc.) are **not** wrapped — they propagate as the exact same native error the underlying `fetch` would throw, unmodified:

```ts
try {
  await $fetch('/users', { baseUrl, signal: controller.signal })
} catch (error) {
  // error here could be a raw DOMException('AbortError') or TypeError — untouched
}
```

---

## Lifecycle Hooks

Four hooks are available on both `$fetch` calls and `createFetch()` defaults:

```ts
{
  onRequest: (req: RequestContext) => RequestContext | Promise<RequestContext>
  onResponse: (res: Response) => Response | Promise<Response>
  onSuccess: (res: FetchResponse<T>) =>
    FetchResponse<T> | Promise<FetchResponse<T>>
  onError: (error: unknown) => unknown | Promise<unknown>
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

Runs whenever a request fails — either an HTTP-level failure (`error` is a `FetchError`) or a network-level failure (`error` is the raw native error). Return a value to have `$fetch` **resolve** with that value instead of throwing; return `undefined` (or just don't return) to let the error keep propagating.

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
        headers: error.headers,
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

`onError` is the exception — a call-level `onError` **fully replaces** the instance-level one (control-flow hooks like throw/recover don't compose meaningfully):

```ts
const api = createFetch({
  baseUrl,
  onError: (error) => {
    console.error('instance-level logging')
    throw error
  },
})

await api('/users', {
  onError: (error) => {
    // this REPLACES the instance-level onError above for this call
    return fallbackValue
  },
})
```

---

## Config Merge Rules

When calling through a `createFetch()` instance, per-call config is merged over the instance defaults as follows:

| Option                                                                               | Merge behavior                                        |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `headers`                                                                            | shallow-merged; call-level wins per-key               |
| `params`                                                                             | shallow-merged; call-level wins per-key               |
| `next` (`revalidate`, `tags`)                                                        | shallow-merged; call-level wins per-key               |
| `onRequest`, `onResponse`, `onSuccess`                                               | composed — instance runs first, then call-level       |
| `onError`                                                                            | call-level fully replaces instance-level, if provided |
| everything else (`method`, `cache`, `credentials`, `mode`, `signal`, `baseUrl`, ...) | call-level overrides instance default                 |

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

---

## `useFetch` — React Hook for Actions & Client Calls

`use-fetch.ts` is a small **Client Component** hook (`'use client'`) that wraps any async function — a Next.js **Server Action**, or a plain client call through `$fetch`/a `createFetch()` instance — with `loading` / `error` / `success` state, so components don't need to hand-roll `useState`/`useEffect` boilerplate around every call.

```ts
import { useFetch } from '@/lib/fetch'
```

```ts
function useFetch<TData, TArgs extends unknown[]>(
  options: UseFetchOptions<TData, TArgs>
): UseFetchResult<TData, TArgs>
```

**Options (`UseFetchOptions<TData, TArgs>`):**

| Option      | Type                                      | Description                                                                                                |
| ----------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `action`    | `(...args: TArgs) => Promise<TData>`      | The async function to run.                                                                                 |
| `immediate` | `boolean` (default `false`)               | Auto-run `action` once on mount, using `args` if provided.                                                 |
| `args`      | `TArgs`                                   | Default arguments — used for the `immediate` call, and as a fallback when `execute()` is called with none. |
| `onSuccess` | `(data: TData) => void \| Promise<void>`  | Called after a successful resolution.                                                                      |
| `onError`   | `(error: Error) => void \| Promise<void>` | Called after a rejection (error is normalized to an `Error`).                                              |

**Result (`UseFetchResult<TData, TArgs>`):**

| Field                                 | Type                                          | Description                                                                                                                                  |
| ------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                                | `TData \| null`                               | Last successful result.                                                                                                                      |
| `error`                               | `Error \| null`                               | Last error, if any.                                                                                                                          |
| `status`                              | `'idle' \| 'loading' \| 'success' \| 'error'` | Current lifecycle status.                                                                                                                    |
| `isLoading` / `isSuccess` / `isError` | `boolean`                                     | Convenience flags derived from `status`.                                                                                                     |
| `execute`                             | `(...args: TArgs \| []) => Promise<TData>`    | Manually triggers `action`. Throws on failure — wrap in `try/catch` if you need to swallow it (state is already updated for you either way). |
| `reset`                               | `() => void`                                  | Resets `data`/`error`/`status` back to their initial values.                                                                                 |

### Manual trigger

```tsx
'use client'

import { useFetch } from '@/lib/fetch'
import { loginUser } from '@/app/actions/auth'
import type { TLoginInput } from '@/types/auth.types'

export function LoginButton({ data }: { data: TLoginInput }) {
  const { execute, isLoading, isError, error } = useFetch({
    action: (input: TLoginInput) => loginUser(input),
    onSuccess: () => {
      window.location.assign('/dashboard')
    },
  })

  return (
    <div>
      <button
        onClick={() => execute(data).catch(() => {})}
        disabled={isLoading}
      >
        {isLoading ? 'Signing in…' : 'Sign in'}
      </button>
      {isError && <p>Failed: {error?.message}</p>}
    </div>
  )
}
```

### Run immediately on mount

Set `immediate: true` and provide `args` (or none, if `action` takes no arguments) to fetch as soon as the component renders — similar to a typical `useEffect`-driven data fetch, but with state already managed for you.

```tsx
'use client'

import { useFetch } from '@/lib/fetch'
import { getAllUsers } from '@/app/actions/user'
import type { TUsersResponse, TUserQueryOptions } from '@/types/user.types'

export function UsersList() {
  const { data, isLoading, isError, error } = useFetch<
    TUsersResponse,
    [TUserQueryOptions]
  >({
    action: (params) => getAllUsers(params),
    immediate: true,
    args: [{ page: 1, limit: 20 }],
  })

  if (isLoading) return <p>Loading…</p>
  if (isError) return <p>Failed: {error?.message}</p>

  return (
    <ul>
      {data?.data.map((u) => (
        <li key={u.id}>{u.email}</li>
      ))}
    </ul>
  )
}
```

### Passing arguments

`execute(...)` accepts arguments matching `action`'s signature. If called with no arguments, it falls back to the `args` option (useful for "refresh with the same params" buttons):

```tsx
import { getAllUsers } from '@/app/actions/user'
import type { TUsersResponse, TUserQueryOptions } from '@/types/user.types'

const { execute } = useFetch<TUsersResponse, [TUserQueryOptions]>({
  action: (params) => getAllUsers(params),
  args: [{ page: 1, limit: 20 }],
})

// explicit params
await execute({ page: 2, limit: 10 })

// falls back to `args` -> page 1, limit 20
await execute()
```

### `onSuccess` / `onError` callbacks

Useful for side effects like toasts, redirects, or cache invalidation, alongside the returned `data`/`error` state:

```tsx
import { updateMyProfile } from '@/app/actions/user'
import type { TUserResponse, TUpdateProfileInput } from '@/types/user.types'

const { execute } = useFetch<TUserResponse, [TUpdateProfileInput]>({
  action: (data) => updateMyProfile(data),
  onSuccess: (updated) => {
    toast.success(`Profile updated: ${updated.data.email}`)
  },
  onError: (error) => {
    toast.error(error.message)
  },
})
```

### Resetting state

```tsx
import { updateMyProfile } from '@/app/actions/user'

const { execute, reset, status } = useFetch({ action: updateMyProfile })

// e.g. clear a success/error banner when a modal closes
useEffect(() => {
  if (!isModalOpen) reset()
}, [isModalOpen, reset])
```

### Using `useFetch` with the `api` client (not just Server Actions)

Since `action` is just `(...args) => Promise<TData>`, it composes naturally with the `$fetch`/`createFetch` client from this same package — just unwrap `.data` (or pass through the whole `FetchResponse` if you'd rather keep `status`/`headers` too):

```tsx
'use client'

import { useFetch } from '@/lib/fetch'
import { $fetch } from '@/lib/$fetch'
import type { TUsersResponse, TUserQueryOptions } from '@/types/user.types'

export function UsersList() {
  const { data, isLoading, isError } = useFetch<
    TUsersResponse,
    [TUserQueryOptions]
  >({
    action: (params) =>
      $fetch
        .get<TUsersResponse, TUserQueryOptions>('/users', { params })
        .then((r) => r.data),
    immediate: true,
    args: [{ page: 1, limit: 20 }],
  })

  // ...
}
```

> **Note:** `use-fetch.ts` has a `'use client'` directive. Re-exporting it from the shared `index.ts` barrel alongside `$fetch`/`createFetch` is fine — Next.js only draws the client boundary at components that actually _use_ the hook — but if you'd rather keep server and client exports fully separate, import it directly from `@/lib/fetch/use-fetch` instead of the barrel.

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

```ts
import { cookies } from 'next/headers'
import { parseSetCookie } from 'set-cookie-parser'
import { createFetch } from './fetch'
import { FetchError } from './fetch/fetch-error'

type SameSite = 'lax' | 'strict' | 'none' | undefined

// Deduplication promise for concurrent 401 errors
let refreshPromise: Promise<void> | null = null
const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1` // `${process.env.NEXT_PUBLIC_SITE_URL}/server`, //While using rewrites
const refreshUrl = `${baseUrl}/auth/refresh-token`

const $fetch = createFetch({
  baseUrl: baseUrl,
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',

  onRequest: async (req) => {
    // Forward the client's HttpOnly cookies to the downstream backend.
    const cookieStore = await cookies()
    const cookieString = cookieStore.toString()

    if (cookieString) {
      const headers = new Headers(req.init.headers)
      headers.set('Cookie', cookieString)
      req.init.headers = headers
    }

    return req
  },

  onResponse: async (res) => {
    // Forward any Set-Cookie headers from the backend back to the browser.
    const setCookieHeaders = res.headers.getSetCookie?.() ?? []

    if (setCookieHeaders.length > 0) {
      const parsedCookies = parseSetCookie(setCookieHeaders, {
        decodeValues: true,
      })
      const cookieStore = await cookies()

      for (const cookie of parsedCookies) {
        const { name, value, ...rest } = cookie
        const options: Parameters<typeof cookieStore.set>[2] = {
          ...rest,
          sameSite: rest.sameSite as SameSite,
        }
        try {
          cookieStore.set(name, value, options)
        } catch {
          // Silently ignore — cookies().set() throws when called inside a
          // Server Component render (read-only context). It works fine in
          // Server Actions and Route Handlers.
        }
      }
    }

    return res
  },

  onError: async (error: unknown) => {
    // Auto-refresh on 401 errors
    if (error instanceof FetchError && error.status === 401) {
      // Deduplicate refresh calls to prevent multiple concurrent refreshes
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            // Call refresh endpoint directly using native fetch to avoid circular dependency
            const cookieStore = await cookies()
            const cookieString = cookieStore.toString()

            const headers = new Headers({
              'Content-Type': 'application/json',
            })

            if (cookieString) {
              headers.set('Cookie', cookieString)
            }

            const response = await fetch(refreshUrl, {
              method: 'POST',
              headers,
              credentials: 'include',
            })

            // Forward Set-Cookie headers from refresh response using robust parser
            const setCookieHeaders = response.headers.getSetCookie?.() ?? []
            if (setCookieHeaders.length > 0) {
              const parsedCookies = parseSetCookie(setCookieHeaders, {
                decodeValues: true,
              })

              for (const cookie of parsedCookies) {
                const { name, value, ...rest } = cookie
                const options: Parameters<typeof cookieStore.set>[2] = {
                  ...rest,
                  sameSite: rest.sameSite as SameSite,
                }
                try {
                  cookieStore.set(name, value, options)
                } catch {
                  // Silently ignore
                }
              }
            }

            if (!response.ok) {
              throw new Error(`Token refresh failed: ${response.status}`)
            }

            console.log('[fetch] Token refreshed successfully')
          } catch (refreshError) {
            console.error('[fetch] Token refresh failed:', refreshError)
            throw refreshError
          }
        })().finally(() => {
          refreshPromise = null
        })
      }

      try {
        await refreshPromise
      } catch {
        // Refresh failed - rethrow the original 401 error
        throw error
      }

      // Refresh succeeded - rethrow the original 401 error so caller can retry
      throw error
    }

    console.error('Fetch error:', error)
    throw error
  },
})

export { $fetch }
```

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

import { useFetch } from '@/lib/fetch'
import { login } from '@/features/auth/api'

export function LoginForm() {
  const { execute, isLoading, isError, error } = useFetch({
    action: (email: string, password: string) =>
      login({ email, password }).then((r) => r.data),
    onSuccess: () => {
      window.location.assign('/dashboard') // full navigation so Server Components re-read the new cookies
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        void execute(
          String(form.get('email')),
          String(form.get('password'))
        ).catch(() => {})
      }}
    >
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in…' : 'Sign in'}
      </button>
      {isError && <p>{error?.message}</p>}
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

#### 5. Wiring it into `useFetch`

`withAuthRetry` composes with `useFetch` exactly like any other async function:

```tsx
'use client'

import { useFetch } from '@/lib/fetch'
import { getUsers } from '@/features/users/api'
import type { TUsersResponse, TUserQueryOptions } from '@/types/user.types'

export function UsersList() {
  const { data, isLoading, isError, error } = useFetch<
    TUsersResponse,
    [TUserQueryOptions]
  >({
    action: (params) => getUsers(params).then((r) => r.data),
    immediate: true,
    args: [{ page: 1 }],
    onError: (err) => {
      // e.g. redirect on final auth failure after the retry already happened inside getUsers
      if (err.message.includes('401')) router.push('/login')
    },
  })

  // ...
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
import { $fetch, FetchError } from '@/lib/fetch'

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
import { $fetch } from '@/lib/fetch'
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
import { $fetch } from '@/lib/fetch'

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
// src/lib/$fetch.ts — the pre-configured server-side instance
import { cookies } from 'next/headers'
import { createFetch } from '@/lib/fetch'

export const $fetch = createFetch({
  baseUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/server`,
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',

  onRequest: async (req) => {
    // Forward the client's HttpOnly cookies to the downstream backend
    const cookieStore = await cookies()
    const cookieString = cookieStore.toString()
    if (cookieString) {
      const headers = new Headers(req.init.headers)
      headers.set('Cookie', cookieString)
      req.init.headers = headers
    }
    return req
  },

  onResponse: async (res) => {
    // Forward any Set-Cookie headers back to the browser (e.g. token rotation)
    const setCookieHeaders = res.headers.getSetCookie?.() ?? []
    if (setCookieHeaders.length > 0) {
      const cookieStore = await cookies()
      for (const raw of setCookieHeaders) {
        // ... parse and set (see src/lib/$fetch.ts for full implementation)
        ;(void raw, cookieStore)
      }
    }
    return res
  },
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
// src/components/modules/auth/login-form.tsx — Client Component using useFetch + Server Action
'use client'

import { useFetch } from '@/lib/fetch'
import { loginUser } from '@/app/actions/auth'
import type { TLoginInput } from '@/types/auth.types'

export function LoginForm() {
  const { execute, isLoading, isError, error } = useFetch({
    action: (data: TLoginInput) => loginUser(data),
    onSuccess: () => {
      window.location.assign('/dashboard')
    },
  })

  const onSubmit = (data: TLoginInput) => {
    void execute(data).catch(() => {})
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault() /* ... call onSubmit */
      }}
    >
      {/* form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in…' : 'Sign in'}
      </button>
      {isError && <p>{error?.message}</p>}
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
  - `onRequest? / onResponse? / onSuccess? / onError?`
- Returns: `Promise<FetchResponse<TResponse>>`
- Throws: `FetchError` on HTTP failure, or the original native error on network failure (unless recovered by `onError`).

### `createFetch(defaults?)`

Creates a preconfigured, callable instance with the same signature (and method shorthands) as `$fetch`, merging `defaults` under every call per the [Config Merge Rules](#config-merge-rules).

### `FetchError<TResponse>`

Extends `Error`. Properties: `response`, `status`, `statusText`, `ok`, `url`, `headers`, `data`, plus the standard `message` (and `cause`, when a network error is wrapped internally).

### `useFetch<TData, TArgs>(options)`

Client Component hook (`'use client'`) that wraps any async function — a Server Action, or a `$fetch`/`createFetch()` call — with `idle`/`loading`/`success`/`error` state. See [`useFetch` — React Hook for Actions & Client Calls](#usefetch--react-hook-for-actions--client-calls).

- `options: UseFetchOptions<TData, TArgs>` — `action`, `immediate?`, `args?`, `onSuccess?`, `onError?`.
- Returns: `UseFetchResult<TData, TArgs>` — `data`, `error`, `status`, `isLoading`, `isSuccess`, `isError`, `execute`, `reset`.

### Types

`FetchConfig`, `FetchResponse`, `FetchHooks`, `CreateFetchConfig`, `RequestContext`, `QueryParams`, `QueryParamValue`, `Primitive`, `FetchBody`, `NextFetchRequestConfig`, `FetchFn`, `FetchMethods`, `OnRequestHook`, `OnResponseHook`, `OnSuccessHook`, `OnErrorHook`, `FetchStatus`, `UseFetchOptions`, `UseFetchResult` — all exported from `@/lib/fetch`.
