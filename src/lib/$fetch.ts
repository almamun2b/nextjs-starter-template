import { cookies } from 'next/headers'
import { createFetch } from './fetch'

const $fetch = createFetch({
  baseUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/server`,
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  onRequest: async (req) => {
    // 1. Get the cookies from the current incoming client request
    const cookieStore = await cookies()
    const cookieString = cookieStore.toString()

    console.log(cookieString, 'cookieString')

    if (cookieString) {
      const headers = new Headers(req.init.headers)
      // 2. Forward the Cookie header to the downstream backend API
      headers.set('Cookie', cookieString)
      req.init.headers = headers
    }

    return req
  },
  onResponse: async (res) => {
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) {
      const cookieStore = await cookies()
    }
    return res
  },
})

export { $fetch }
