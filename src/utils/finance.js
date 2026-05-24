const ER_API     = 'https://open.er-api.com/v6/latest/USD'
const METALS_API  = 'https://api.metals.live/v1/spot/gold'
const TROY_TO_GRAM = 31.1035

async function fetchForex() {
  const res = await fetch(ER_API)
  if (!res.ok) throw new Error(`ExchangeRate API hatası: ${res.status}`)
  const data = await res.json()
  if (data.result !== 'success') throw new Error('ExchangeRate API başarısız yanıt')
  return data.rates // { TRY: 38.42, EUR: 0.92, ... }
}

async function fetchGoldUsd() {
  const res = await fetch(METALS_API)
  if (!res.ok) throw new Error(`Metals API hatası: ${res.status}`)
  const data = await res.json()
  // metals.live yanıt formatı: { gold: 2350.50 } ya da [{ gold: 2350.50 }]
  const price = Array.isArray(data) ? (data[0]?.price ?? data[0]?.gold) : (data.price ?? data.gold)
  if (!price) throw new Error('Altın fiyatı ayrıştırılamadı')
  return price // USD per troy oz
}

export async function fetchAllPrices() {
  const [forexResult, goldResult] = await Promise.allSettled([
    fetchForex(),
    fetchGoldUsd(),
  ])

  const rates = forexResult.status === 'fulfilled' ? forexResult.value : null
  const goldUsd = goldResult.status === 'fulfilled' ? goldResult.value : null

  const usdTry = rates?.TRY ?? null
  const eurTry = (rates?.TRY && rates?.EUR) ? rates.TRY / rates.EUR : null
  const gramAltin = (goldUsd && usdTry) ? (goldUsd * usdTry) / TROY_TO_GRAM : null

  const errors = [
    forexResult.status === 'rejected' && `Kur verisi: ${forexResult.reason?.message}`,
    goldResult.status  === 'rejected' && `Altın: ${goldResult.reason?.message}`,
  ].filter(Boolean)

  return {
    prices: {
      'Gram Altın': gramAltin != null ? { current: gramAltin, change: null } : null,
      'Dolar/TL':   usdTry   != null ? { current: usdTry,    change: null } : null,
      'Euro/TL':    eurTry   != null ? { current: eurTry,    change: null } : null,
      'BIST 100':   null, // ücretsiz CORS-friendly kaynak yok
    },
    errors,
  }
}

export function formatPrice(name, value) {
  if (value == null) return '—'
  if (name === 'BIST 100')   return value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })
  if (name === 'Gram Altın') return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
  return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}
