import { buildUrl } from './build-url'
import { FetchError, type FetchErrorKind } from './fetch-error'
import { createMethodShorthands, type FetchMethods } from './method-shorthands'
import { extractMessage, parseResponseData } from './parse-response'
import { getRetryDelay, resolveRetry, sleep } from './retry'
import { serializeBody } from './serialize-body'
import type {
  ErrorContext,
  FetchConfig,
  FetchResponse,
  OnResponseHook,
  QueryParams,
  RequestContext,
  ResponseType,
} from './types'

/** Per-request settings that stay fixed across retries. */
interface SendOptions {
  timeout?: number
  responseType?: ResponseType
  onResponse?: OnResponseHook
  retry: ReturnType<typeof resolveRetry>
}

/**
 * Creates the signal for one attempt: the caller's `signal`, the timeout, both
 * combined, or neither.
 */
function attemptSignals(init: RequestInit, timeout?: number) {
  const caller = init.signal ?? undefined
  const timer = timeout ? AbortSignal.timeout(timeout) : undefined
  const signal =
    caller && timer ? AbortSignal.any([caller, timer]) : (caller ?? timer)
  return { caller, timer, signal }
}

/** One attempt: send, run `onResponse`, parse, and throw on `!ok`. */
async function sendAttempt<T>(
  ctx: RequestContext,
  options: SendOptions
): Promise<FetchResponse<T>> {
  const request = {
    method: (ctx.init.method ?? 'GET').toUpperCase(),
    url: ctx.url,
  }
  const { caller, timer, signal } = attemptSignals(ctx.init, options.timeout)

  const fail = (cause: unknown, response?: Response): FetchError => {
    const kind: FetchErrorKind = caller?.aborted
      ? 'abort'
      : timer?.aborted
        ? 'timeout'
        : cause instanceof SyntaxError
          ? 'parse'
          : 'network'
    return new FetchError({ kind, request, response, cause })
  }

  let response: Response
  try {
    response = await fetch(ctx.url, { ...ctx.init, signal })
  } catch (cause) {
    throw fail(cause)
  }

  // Hook errors are the hook author's to handle; they propagate unchanged.
  if (options.onResponse) {
    response = await options.onResponse(response)
  }

  let data: unknown
  try {
    data = await parseResponseData(response, options.responseType)
  } catch (cause) {
    throw fail(cause, response)
  }

  const message = extractMessage(data)
  if (!response.ok) {
    throw new FetchError({ kind: 'http', request, response, data, message })
  }

  return {
    data: data as T,
    response,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url || ctx.url,
    message,
  }
}

/** Runs {@link sendAttempt}, retrying per the resolved retry policy. */
async function send<T>(
  ctx: RequestContext,
  options: SendOptions
): Promise<FetchResponse<T>> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await sendAttempt<T>(ctx, options)
    } catch (error) {
      if (!(error instanceof FetchError)) throw error
      const delay = getRetryDelay(
        error,
        attempt,
        error.request.method,
        options.retry
      )
      if (delay === null) throw error
      await sleep(delay)
    }
  }
}

/**
 * The base `$fetch` implementation. Generic parameter order is always
 * `TResponse, TBody, TParams`.
 *
 * @returns The normalized {@link FetchResponse}, or a hook-provided fallback if `onError` recovers.
 * @throws {FetchError} On any HTTP or transport failure that `onError` does not recover — see `FetchError.kind`.
 */
async function baseFetch<
  TResponse = unknown,
  TBody = unknown,
  TParams extends QueryParams = QueryParams,
>(
  input: string,
  init: FetchConfig<TResponse, TBody, TParams> = {}
): Promise<FetchResponse<TResponse>> {
  const {
    baseUrl,
    params,
    body,
    headers: initHeaders,
    onRequest,
    onResponse,
    onSuccess,
    onError,
    next,
    timeout,
    retry,
    responseType,
    ...nativeInit
  } = init

  const url = buildUrl(input, baseUrl, params)
  const { body: serializedBody, headers } = serializeBody(
    body,
    new Headers(initHeaders)
  )

  let requestContext: RequestContext = {
    url,
    init: {
      ...nativeInit,
      headers,
      body: serializedBody,
      ...(next ? { next } : {}),
    } as RequestInit,
  }

  if (onRequest) {
    requestContext = await onRequest(requestContext)
  }

  const sendOptions: SendOptions = {
    timeout,
    responseType,
    onResponse,
    retry: resolveRetry(retry),
  }

  const finish = async <T>(
    result: FetchResponse<T>
  ): Promise<FetchResponse<T>> =>
    onSuccess
      ? ((await onSuccess(
          result as unknown as FetchResponse<TResponse>
        )) as unknown as FetchResponse<T>)
      : result

  const sentContext = requestContext
  const errorContext: ErrorContext = {
    request: sentContext,
    retry: async <T>(retryInit: RequestInit = {}) => {
      const retryHeaders = new Headers(sentContext.init.headers)
      new Headers(retryInit.headers).forEach((value, key) =>
        retryHeaders.set(key, value)
      )
      const retryContext: RequestContext = {
        url: sentContext.url,
        init: { ...sentContext.init, ...retryInit, headers: retryHeaders },
      }
      return finish(await send<T>(retryContext, sendOptions))
    },
  }

  let result: FetchResponse<TResponse>
  try {
    result = await send<TResponse>(requestContext, sendOptions)
  } catch (error) {
    if (onError) {
      const handled = await onError(error, errorContext)
      if (handled !== undefined) return handled as FetchResponse<TResponse>
    }
    throw error
  }

  return finish(result)
}

/**
 * Type-safe fetch utility for Next.js (App Router). Extends the native
 * `RequestInit`, and adds `baseUrl`, query/body serialization, `timeout`,
 * `retry`, `responseType`, and `onRequest`/`onResponse`/`onSuccess`/`onError`
 * lifecycle hooks, plus `.get`/`.post`/`.put`/`.patch`/`.delete`/`.head`
 * shorthands.
 *
 * This is the unconfigured core. Application code should use the configured
 * backend client in `src/lib/$fetch.ts`, which adds the base URL, auth cookie
 * forwarding, silent refresh, and default timeouts.
 *
 * @example
 * ```ts
 * import type { TUsersResponse, TUserQueryOptions } from '@/types/user.types'
 *
 * const { data } = await $fetch.get<TUsersResponse, TUserQueryOptions>('/users', {
 *   baseUrl: 'https://api.example.com/api/v1',
 *   params: { page: 1, limit: 20 },
 *   timeout: 5_000,
 *   retry: 1,
 * })
 * ```
 */
export const $fetch: typeof baseFetch & FetchMethods = Object.assign(
  baseFetch,
  createMethodShorthands(baseFetch)
)
