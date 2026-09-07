const base = import.meta.env.BASE_URL.replace(/\/$/, '')

export function siteUrl(path = '') {
  return `${base}/${path.replace(/^\/+/, '')}`
}

export function routePath(pathname: string) {
  if (base && pathname !== base && !pathname.startsWith(`${base}/`)) return null
  return pathname.slice(base.length).replace(/\/+$/, '') || '/'
}
