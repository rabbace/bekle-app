// open.er-api.com: ücretsiz, API key yok, CORS destekli
const ER_API = 'https://open.er-api.com/v6/latest/USD'

// Change hesabı için bir önceki değerleri saklarız
const CACHE_KEY = 'bekle_rate_cache'
const TROY_TO_GRAM = 31.1035

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}

function saveCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() }))
}

export async function fetchAllPrices() {
  const res = await fetch(ER_API)
  if (!res.ok) throw new Error(`ExchangeRate API hatası: ${res.status}`)
  const data = await res.json()
  if (data.result !== 'success') throw new Error('ExchangeRate API başarısız yanıt döndürdü')

  const rates = data.rates
  const prev = loadCache()

  // USD/TRY
  const usdTry  = rates.TRY
  // EUR/TRY  (1 EUR = TRY/EUR USD cinsinden)
  const eurTry  = rates.EUR ? rates.TRY / rates.EUR : null
  // Gram Altın: rates.XAU = troy oz başına USD, yani 1 USD = rates.XAU oz altın
  // → 1 oz = 1/rates.XAU USD → gram = (1/rates.XAU * usdTry) / 31.1035
  const gramAltin = rates.XAU ? (usdTry / rates.XAU) / TROY_TO_GRAM : null

  function pct(current, prevVal) {
    if (!current || !prevVal) return null
    return ((current - prevVal) / prevVal) * 100
  }

  const prices = {
    'Gram Altın': gramAltin != null ? {
      current: gramAltin,
      change: pct(gramAltin, prev.gramAltin),
      closes: [],
    } : null,
    'Dolar/TL': usdTry != null ? {
      current: usdTry,
      change: pct(usdTry, prev.usdTry),
      closes: [],
    } : null,
    'Euro/TL': eurTry != null ? {
      current: eurTry,
      change: pct(eurTry, prev.eurTry),
      closes: [],
    } : null,
    'BIST 100': null, // Ücretsiz CORS-friendly kaynak yok, atlanıyor
  }

  // Sonraki çağrı için önbellek güncelle
  saveCache({ usdTry, eurTry, gramAltin })

  const errors = []
  if (!rates.XAU) errors.push('Altın: XAU verisi yok')
  if (!eurTry)    errors.push('EUR/TL: EUR verisi yok')

  return { prices, errors }
}

export function formatPrice(name, value) {
  if (value == null) return '—'
  if (name === 'BIST 100')   return value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })
  if (name === 'Gram Altın') return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
  return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}
