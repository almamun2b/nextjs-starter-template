import createFetch from '@/lib/fetch'

const $fetch = createFetch({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export { $fetch }
