const BASE = 'https://finnhub.io/api/v1'

async function get(path, apiKey) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${BASE}${path}${sep}token=${apiKey}`, {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) {
    if (res.status === 403) throw new Error('FINNHUB_403')
    if (res.status === 401) throw new Error('API anahtarı geçersiz.')
    throw new Error(`Finnhub ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

async function fetchFromFinnhub(symbol, apiKey) {
  const [profile, quote, metrics, recommendations] = await Promise.all([
    get(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`, apiKey),
    get(`/quote?symbol=${encodeURIComponent(symbol)}`, apiKey),
    get(`/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`, apiKey),
    get(`/stock/recommendation?symbol=${encodeURIComponent(symbol)}`, apiKey),
  ])
  return { profile, quote, metrics, recommendations, source: 'finnhub' }
}

// BIST için Yahoo Finance fallback — temel finansallar olmadan fiyat+teknik
async function fetchBistFromYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`BIST verisi alınamadı (Yahoo ${res.status}). Yahoo Finance bu bölgede CORS kısıtlaması uygulayabilir.`)

  const data = await res.json()
  const result = data.chart?.result?.[0]
  if (!result) throw new Error('Hisse verisi bulunamadı.')

  const meta   = result.meta
  const closes = result.indicators?.quote?.[0]?.close?.filter(Boolean) ?? []
  const current = meta.regularMarketPrice ?? closes.at(-1)
  const prev    = meta.previousClose ?? meta.chartPreviousClose ?? current

  const ret = (a, b) => (a && b) ? ((a - b) / b) * 100 : null

  const quote = {
    c:  current,
    pc: prev,
    dp: ret(current, prev),
    h:  meta.regularMarketDayHigh,
    l:  meta.regularMarketDayLow,
    o:  meta.regularMarketOpen,
  }

  const metric = {
    '52WeekHigh': meta.fiftyTwoWeekHigh,
    '52WeekLow':  meta.fiftyTwoWeekLow,
    '52WeekPriceReturnDaily': closes.length >= 250 ? ret(closes.at(-1), closes.at(-250)) : null,
    '13WeekPriceReturnDaily': closes.length >= 65  ? ret(closes.at(-1), closes.at(-65))  : null,
    '5DayPriceReturnDaily':   closes.length >= 5   ? ret(closes.at(-1), closes.at(-5))   : null,
  }

  const profile = {
    name:     meta.longName || meta.shortName || symbol,
    ticker:   symbol,
    currency: meta.currency || 'TRY',
    logo:     null,
  }

  return { profile, quote, metrics: { metric }, recommendations: [], source: 'yahoo' }
}

export async function fetchAll(symbol, apiKey) {
  const isBist = symbol.toUpperCase().endsWith('.IS')

  if (!isBist) {
    return fetchFromFinnhub(symbol, apiKey)
  }

  // BIST: Finnhub dene (premium kullanıcılar için), 403'te Yahoo'ya geç
  try {
    return await fetchFromFinnhub(symbol, apiKey)
  } catch (err) {
    if (err.message === 'FINNHUB_403') {
      return await fetchBistFromYahoo(symbol)
    }
    throw err
  }
}

export async function searchSymbol(query, apiKey) {
  const data = await get(`/search?q=${encodeURIComponent(query)}`, apiKey)
  return (data.result || []).map(r => ({ symbol: r.symbol, description: r.description }))
}
