// Seed-based deterministic signal — replaced with real logic when API is wired
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function getSignalFromSeed(name) {
  let seed = 0
  for (let i = 0; i < name.length; i++) seed += name.charCodeAt(i)
  const r = seededRandom(seed)
  if (r < 0.33) return 'firsat'
  if (r < 0.66) return 'bekle'
  return 'dikkat'
}

export const SIGNAL_CONFIG = {
  firsat: { label: 'Fırsat', color: 'bg-green-500/20 text-green-400 border border-green-500/30', dot: '🟢' },
  bekle:  { label: 'Bekle',  color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', dot: '🟡' },
  dikkat: { label: 'Dikkat', color: 'bg-red-500/20 text-red-400 border border-red-500/30', dot: '🔴' },
}

export const DEFAULT_INSTRUMENTS = [
  { id: 'altin', tip: 'Altın', isim: 'Gram Altın', fiyat: '3.142,50 ₺', degisim: '+1.24' },
  { id: 'usd',   tip: 'USD',   isim: 'Dolar/TL',   fiyat: '38,42 ₺',   degisim: '-0.31' },
  { id: 'eur',   tip: 'EUR',   isim: 'Euro/TL',     fiyat: '41,85 ₺',   degisim: '+0.15' },
  { id: 'bist',  tip: 'BIST',  isim: 'BIST 100',    fiyat: '9.876',     degisim: '+0.87' },
]

export function getSignal(isim) {
  return getSignalFromSeed(isim)
}

export function getSummaryText(instruments) {
  const signals = instruments.map(i => getSignal(i.isim))
  const firsat = signals.filter(s => s === 'firsat').length
  const dikkat = signals.filter(s => s === 'dikkat').length
  if (firsat >= 2) return 'Piyasalarda birden fazla fırsat sinyali mevcut. Değerlendirmeye değer.'
  if (dikkat >= 2) return 'Birden fazla enstrümanda dikkat sinyali var. Temkinli olun.'
  return 'Piyasalar karışık sinyal veriyor. Bekleme stratejisi uygun görünüyor.'
}
