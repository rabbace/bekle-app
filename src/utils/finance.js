const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

async function fetchQuote(symbol) {
  const res = await fetch(`${YF_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=5d`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status} (${symbol})`)
  const json = await res.json()
  const result = json.chart?.result?.[0]
  if (!result) throw new Error(`Veri bulunamadı: ${symbol}`)
  const meta = result.meta
  const closes = result.indicators?.quote?.[0]?.close?.filter(Boolean) ?? []
  const current = meta.regularMarketPrice ?? closes.at(-1)
  const previous = closes.at(-2) ?? meta.previousClose ?? current
  const change = previous ? ((current - previous) / previous) * 100 : 0
  return { current, previous, change, closes }
}

// Troy ons → gram
const TROY_TO_GRAM = 31.1035

export async function fetchAllPrices() {
  const [usdTry, eurTry, bist, xauUsd] = await Promise.allSettled([
    fetchQuote('USDTRY=X'),
    fetchQuote('EURTRY=X'),
    fetchQuote('XU100.IS'),
    fetchQuote('GC=F'),
  ])

  const usd = usdTry.status === 'fulfilled' ? usdTry.value : null
  const eur = eurTry.status === 'fulfilled' ? eurTry.value : null
  const bis = bist.status === 'fulfilled' ? bist.value : null
  const xau = xauUsd.status === 'fulfilled' ? xauUsd.value : null

  let gramAltin = null
  if (xau && usd) {
    const current = (xau.current * usd.current) / TROY_TO_GRAM
    const previous = (xau.previous * usd.previous) / TROY_TO_GRAM
    const change = previous ? ((current - previous) / previous) * 100 : 0
    gramAltin = { current, previous, change, closes: [] }
  }

  const errors = [
    usdTry.status === 'rejected' && `USD/TRY: ${usdTry.reason?.message}`,
    eurTry.status === 'rejected' && `EUR/TRY: ${eurTry.reason?.message}`,
    bist.status === 'rejected'  && `BIST: ${bist.reason?.message}`,
    xauUsd.status === 'rejected' && `Altın: ${xauUsd.reason?.message}`,
  ].filter(Boolean)

  return {
    prices: {
      'Gram Altın': gramAltin,
      'Dolar/TL': usd,
      'Euro/TL': eur,
      'BIST 100': bis,
    },
    errors,
  }
}

export function formatPrice(name, value) {
  if (value == null) return '—'
  if (name === 'BIST 100') return value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })
  if (name === 'Gram Altın') return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
  return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}
