// Forex: open.er-api.com — ücretsiz, CORS destekli, API key yok
const ER_API = 'https://open.er-api.com/v6/latest/USD'
const TROY_TO_GRAM = 31.1035

// Altın kaynakları — sırayla denenir, ilk başarılı kullanılır
const GOLD_SOURCES = [
  {
    name: 'metals.live',
    url: 'https://api.metals.live/v1/spot',
    parse: (data) => {
      // [{gold: 2350}, {silver: 28}, ...] ya da {gold: 2350, ...}
      if (Array.isArray(data)) {
        const g = data.find(i => i.gold != null)
        return g?.gold ?? null
      }
      return data.gold ?? null
    },
  },
  {
    name: 'goldprice.org',
    url: 'https://data-asg.goldprice.org/dbXRates/USD',
    parse: (data) => data?.items?.[0]?.xauPrice ?? null,
  },
]

async function fetchForex() {
  const res = await fetch(ER_API, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.result !== 'success') throw new Error('API başarısız yanıt')
  return data.rates
}

async function fetchGoldUsd(rates) {
  // Önce open.er-api'nin XAU'sunu dene (bazı bölgelerde mevcut)
  if (rates?.XAU && rates.XAU > 0) {
    return 1 / rates.XAU // 1 USD = rates.XAU oz → oz başına USD
  }

  // Sırayla altın kaynaklarını dene
  for (const src of GOLD_SOURCES) {
    try {
      const res = await fetch(src.url, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) continue
      const data = await res.json()
      const price = src.parse(data)
      if (price && price > 100) return price // Makul değer kontrolü
    } catch {
      // Sonraki kaynağa geç
    }
  }
  return null // Hiçbiri çalışmadı
}

export async function fetchAllPrices() {
  let rates = null
  let forexError = null

  try {
    rates = await fetchForex()
  } catch (e) {
    forexError = e.message
  }

  const goldUsd = await fetchGoldUsd(rates)

  const usdTry   = rates?.TRY   ?? null
  const eurTry   = (rates?.TRY && rates?.EUR) ? rates.TRY / rates.EUR : null
  const gramAltin = (goldUsd && usdTry) ? (goldUsd * usdTry) / TROY_TO_GRAM : null

  const errors = [
    forexError && `Kur verisi: ${forexError}`,
    !goldUsd  && 'Altın fiyatı alınamadı (tüm kaynaklar denendi)',
    !usdTry   && !forexError && 'TRY kuru eksik',
  ].filter(Boolean)

  return {
    prices: {
      'Gram Altın': gramAltin != null ? { current: gramAltin, change: null } : null,
      'Dolar/TL':   usdTry   != null ? { current: usdTry,    change: null } : null,
      'Euro/TL':    eurTry   != null ? { current: eurTry,    change: null } : null,
      'BIST 100':   null,
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
