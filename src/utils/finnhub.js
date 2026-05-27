const BASE = 'https://finnhub.io/api/v1'

async function get(path, apiKey) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${BASE}${path}${sep}token=${apiKey}`)
  if (!res.ok) throw new Error(`Finnhub ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function fetchAll(symbol, apiKey) {
  const [profile, quote, metrics, recommendations] = await Promise.all([
    get(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`, apiKey),
    get(`/quote?symbol=${encodeURIComponent(symbol)}`, apiKey),
    get(`/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`, apiKey),
    get(`/stock/recommendation?symbol=${encodeURIComponent(symbol)}`, apiKey),
  ])
  return { profile, quote, metrics, recommendations }
}

export async function searchSymbol(query, apiKey) {
  const data = await get(`/search?q=${encodeURIComponent(query)}`, apiKey)
  return (data.result || []).map(r => ({ symbol: r.symbol, description: r.description }))
}
