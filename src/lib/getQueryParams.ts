const getQueryParams = <T extends Record<string, unknown>>(
  params: T
): string => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined && item !== '') {
          searchParams.append(key, String(item))
        }
      })
    } else {
      searchParams.append(key, String(value))
    }
  })

  return searchParams.toString()
}

export { getQueryParams }
