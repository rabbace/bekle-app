const CONFIG = {
  WEIGHTS: {
    valuation: 0.20,
    profit: 0.20,
    growth: 0.20,
    health: 0.15,
    technical: 0.15,
    analyst: 0.10,
  },
  VERDICT_BANDS: [
    { min: 75, label: 'GÜÇLÜ AL',  color: '#2ecc71' },
    { min: 60, label: 'AL',         color: '#1f9d57' },
    { min: 45, label: 'TUT / NÖTR', color: '#f5b942' },
    { min: 32, label: 'SAT',        color: '#ff8a5c' },
    { min: 0,  label: 'GÜÇLÜ SAT', color: '#ff5c6c' },
  ],
  THRESHOLDS: {
    pe:          { dir: 'down', t: [15, 25, 40, 60] },
    pb:          { dir: 'down', t: [1.5, 3, 6, 10] },
    ps:          { dir: 'down', t: [2, 5, 10, 18] },
    roe:         { dir: 'up',   t: [20, 12, 5, 0] },
    roa:         { dir: 'up',   t: [12, 7, 3, 0] },
    netMargin:   { dir: 'up',   t: [20, 10, 3, 0] },
    grossMargin: { dir: 'up',   t: [50, 35, 20, 10] },
    revGrowth:   { dir: 'up',   t: [20, 8, 2, -5] },
    epsGrowth:   { dir: 'up',   t: [20, 8, 0, -10] },
    rev5y:       { dir: 'up',   t: [15, 8, 3, 0] },
    currentRatio:{ dir: 'up',   t: [2, 1.5, 1, 0.8] },
    debtEquity:  { dir: 'down', t: [0.5, 1, 2, 3] },
    quickRatio:  { dir: 'up',   t: [1.5, 1, 0.7, 0.4] },
    ret52:       { dir: 'up',   t: [25, 8, -5, -25] },
    ret13:       { dir: 'up',   t: [15, 3, -5, -15] },
    rangePos:    { dir: 'up',   t: [60, 40, 20, 5] },
  },
}

// ── helpers ──────────────────────────────────────────────────────────────────

export function fmt(v, decimals = 2) {
  if (v == null || isNaN(v)) return '—'
  return Number(v).toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function fmtPct(v) {
  if (v == null || isNaN(v)) return '—'
  return `${v >= 0 ? '+' : ''}${Number(v).toFixed(1)}%`
}

export function verdictOf(score) {
  if (score == null) return { label: '—', color: '#94a3b8' }
  for (const band of CONFIG.VERDICT_BANDS) {
    if (score >= band.min) return band
  }
  return CONFIG.VERDICT_BANDS[CONFIG.VERDICT_BANDS.length - 1]
}

function scoreMetric(key, value) {
  if (value == null || isNaN(value)) return null
  const cfg = CONFIG.THRESHOLDS[key]
  if (!cfg) return null
  const [t0, t1, t2, t3] = cfg.t
  const up = cfg.dir === 'up'
  if (up) {
    if (value >= t0) return 100
    if (value >= t1) return 75
    if (value >= t2) return 50
    if (value >= t3) return 25
    return 0
  } else {
    if (value <= t0) return 100
    if (value <= t1) return 75
    if (value <= t2) return 50
    if (value <= t3) return 25
    return 0
  }
}

function avgScores(scores) {
  const valid = scores.filter(s => s != null)
  if (!valid.length) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function msg(score) {
  if (score == null) return 'Veri yok'
  if (score >= 75) return 'Güçlü'
  if (score >= 50) return 'İyi'
  if (score >= 25) return 'Zayıf'
  return 'Çok zayıf'
}

// ── dimension builders ────────────────────────────────────────────────────────

function buildValuation(m) {
  const pe = m['peNormalizedAnnual'] ?? m['peTTM'] ?? null
  const pb = m['pbAnnual'] ?? m['pbQuarterly'] ?? null
  const ps = m['psTTM'] ?? null

  const subs = [
    {
      label: 'F/K Oranı',
      display: fmt(pe, 1),
      score: scoreMetric('pe', pe),
      msg: msg(scoreMetric('pe', pe)),
      note: 'Hisse fiyatı / kazanç',
    },
    {
      label: 'F/DD Oranı',
      display: fmt(pb, 2),
      score: scoreMetric('pb', pb),
      msg: msg(scoreMetric('pb', pb)),
      note: 'Fiyat / defter değeri',
    },
    {
      label: 'F/S Oranı',
      display: fmt(ps, 2),
      score: scoreMetric('ps', ps),
      msg: msg(scoreMetric('ps', ps)),
      note: 'Fiyat / satış',
    },
  ]
  return {
    name: 'Değerleme',
    weight: CONFIG.WEIGHTS.valuation,
    score: avgScores(subs.map(s => s.score)),
    q: 'Hisse pahalı mı, ucuz mu?',
    subs,
  }
}

function buildProfit(m) {
  const roe = m['roeRfy'] ?? m['roeTTM'] ?? null
  const roa = m['roaTTM'] ?? null
  const net = m['netProfitMarginTTM'] ?? m['netProfitMarginAnnual'] ?? null
  const gross = m['grossMarginTTM'] ?? m['grossMarginAnnual'] ?? null

  const subs = [
    {
      label: 'Öz Sermaye Kârlılığı (ROE)',
      display: fmtPct(roe),
      score: scoreMetric('roe', roe),
      msg: msg(scoreMetric('roe', roe)),
      note: '',
    },
    {
      label: 'Varlık Kârlılığı (ROA)',
      display: fmtPct(roa),
      score: scoreMetric('roa', roa),
      msg: msg(scoreMetric('roa', roa)),
      note: '',
    },
    {
      label: 'Net Kâr Marjı',
      display: fmtPct(net),
      score: scoreMetric('netMargin', net),
      msg: msg(scoreMetric('netMargin', net)),
      note: '',
    },
    {
      label: 'Brüt Kâr Marjı',
      display: fmtPct(gross),
      score: scoreMetric('grossMargin', gross),
      msg: msg(scoreMetric('grossMargin', gross)),
      note: '',
    },
  ]
  return {
    name: 'Kârlılık',
    weight: CONFIG.WEIGHTS.profit,
    score: avgScores(subs.map(s => s.score)),
    q: 'Şirket kâr üretebiliyor mu?',
    subs,
  }
}

function buildGrowth(m) {
  const rev = m['revenueGrowthTTMYoy'] ?? m['revenueGrowthQuarterlyYoy'] ?? null
  const eps = m['epsGrowthTTMYoy'] ?? m['epsGrowthQuarterlyYoy'] ?? null
  const rev5 = m['revenueGrowth5Y'] ?? null

  const subs = [
    {
      label: 'Gelir Büyümesi (YoY)',
      display: fmtPct(rev),
      score: scoreMetric('revGrowth', rev),
      msg: msg(scoreMetric('revGrowth', rev)),
      note: '',
    },
    {
      label: 'EPS Büyümesi (YoY)',
      display: fmtPct(eps),
      score: scoreMetric('epsGrowth', eps),
      msg: msg(scoreMetric('epsGrowth', eps)),
      note: '',
    },
    {
      label: '5 Yıllık Gelir Büyümesi',
      display: fmtPct(rev5),
      score: scoreMetric('rev5y', rev5),
      msg: msg(scoreMetric('rev5y', rev5)),
      note: '',
    },
  ]
  return {
    name: 'Büyüme',
    weight: CONFIG.WEIGHTS.growth,
    score: avgScores(subs.map(s => s.score)),
    q: 'Şirket büyüyor mu?',
    subs,
  }
}

function buildHealth(m) {
  const cr = m['currentRatioAnnual'] ?? m['currentRatioQuarterly'] ?? null
  const de = m['totalDebt/totalEquityAnnual'] ?? m['totalDebt/totalEquityQuarterly'] ?? null
  const qr = m['quickRatioAnnual'] ?? m['quickRatioQuarterly'] ?? null

  const subs = [
    {
      label: 'Cari Oran',
      display: fmt(cr, 2),
      score: scoreMetric('currentRatio', cr),
      msg: msg(scoreMetric('currentRatio', cr)),
      note: 'Dönen varlık / kısa vadeli borç',
    },
    {
      label: 'Borç / Öz Sermaye',
      display: fmt(de, 2),
      score: scoreMetric('debtEquity', de),
      msg: msg(scoreMetric('debtEquity', de)),
      note: '',
    },
    {
      label: 'Asit-Test Oranı',
      display: fmt(qr, 2),
      score: scoreMetric('quickRatio', qr),
      msg: msg(scoreMetric('quickRatio', qr)),
      note: '',
    },
  ]
  return {
    name: 'Mali Sağlık',
    weight: CONFIG.WEIGHTS.health,
    score: avgScores(subs.map(s => s.score)),
    q: 'Bilanço ne kadar sağlıklı?',
    subs,
  }
}

function buildTechnical(m, quote) {
  const hi52 = m['52WeekHigh'] ?? null
  const lo52 = m['52WeekLow'] ?? null
  const ret52 = m['52WeekPriceReturnDaily'] ?? null
  const ret13 = m['13WeekPriceReturnDaily'] ?? null

  let rangePos = null
  if (hi52 != null && lo52 != null && hi52 > lo52 && quote?.c) {
    rangePos = ((quote.c - lo52) / (hi52 - lo52)) * 100
  }

  const subs = [
    {
      label: '52 Hafta Getirisi',
      display: fmtPct(ret52),
      score: scoreMetric('ret52', ret52),
      msg: msg(scoreMetric('ret52', ret52)),
      note: '',
    },
    {
      label: '13 Hafta Getirisi',
      display: fmtPct(ret13),
      score: scoreMetric('ret13', ret13),
      msg: msg(scoreMetric('ret13', ret13)),
      note: '',
    },
    {
      label: '52H Bant Konumu',
      display: rangePos != null ? `${rangePos.toFixed(0)}%` : '—',
      score: scoreMetric('rangePos', rangePos),
      msg: msg(scoreMetric('rangePos', rangePos)),
      note: 'Düşük/yüksek arasındaki yüzde',
    },
  ]
  return {
    name: 'Teknik',
    weight: CONFIG.WEIGHTS.technical,
    score: avgScores(subs.map(s => s.score)),
    q: 'Fiyat trendi nasıl?',
    subs,
    _rangePos: rangePos,
    _hi52: hi52,
    _lo52: lo52,
  }
}

function buildAnalyst(recs) {
  const latest = Array.isArray(recs) && recs.length > 0 ? recs[0] : null
  const strongBuy = latest?.strongBuy ?? 0
  const buy = latest?.buy ?? 0
  const hold = latest?.hold ?? 0
  const sell = latest?.sell ?? 0
  const strongSell = latest?.strongSell ?? 0
  const total = strongBuy + buy + hold + sell + strongSell

  let analystScore = null
  if (total > 0) {
    const weighted = (strongBuy * 100 + buy * 75 + hold * 50 + sell * 25 + strongSell * 0) / total
    analystScore = weighted
  }

  const subs = [
    {
      label: 'Analist Görüşü',
      display: total > 0 ? `${strongBuy + buy}/${total} AL` : '—',
      score: analystScore,
      msg: msg(analystScore),
      note: '',
    },
  ]
  return {
    name: 'Analist',
    weight: CONFIG.WEIGHTS.analyst,
    score: analystScore,
    q: 'Analistler ne düşünüyor?',
    subs,
    _dist: { strongBuy, buy, hold, sell, strongSell, total },
  }
}

// ── main export ───────────────────────────────────────────────────────────────

export function analyze(metricsData, quote, recommendations) {
  const m = metricsData?.metric ?? {}

  const valDim  = buildValuation(m)
  const profDim = buildProfit(m)
  const growDim = buildGrowth(m)
  const healDim = buildHealth(m)
  const techDim = buildTechnical(m, quote)
  const anlDim  = buildAnalyst(recommendations)

  const dims = [valDim, profDim, growDim, healDim, techDim, anlDim]

  // Weighted overall score
  let weightedSum = 0
  let weightTotal = 0
  for (const d of dims) {
    if (d.score != null) {
      weightedSum += d.score * d.weight
      weightTotal += d.weight
    }
  }
  const overall = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : null
  const verdict = verdictOf(overall)

  // pros / cons
  const pros = []
  const cons = []
  for (const d of dims) {
    for (const s of d.subs) {
      if (s.score != null) {
        if (s.score >= 75) pros.push(`${s.label}: ${s.display}`)
        if (s.score <= 25) cons.push(`${s.label}: ${s.display}`)
      }
    }
  }

  // Türkçe özet
  const summary = buildSummary(overall, verdict, valDim, profDim, growDim, healDim)

  // returns from quote
  const dp = quote?.dp ?? null
  const returns = {
    d5:  m['5DayPriceReturnDaily'] ?? null,
    m1:  m['monthToDatePriceReturnDaily'] ?? null,
    m3:  m['3MonthPriceReturnDaily'] ?? null,
    ytd: m['yearToDatePriceReturnDaily'] ?? null,
    y1:  m['52WeekPriceReturnDaily'] ?? null,
  }

  return {
    overall,
    verdict,
    summary,
    dims,
    pros,
    cons,
    rangePos: techDim._rangePos,
    hi: techDim._hi52,
    lo: techDim._lo52,
    recDist: anlDim._dist,
    returns,
    dp,
  }
}

function buildSummary(overall, verdict, val, prof, grow, heal) {
  if (overall == null) return 'Analiz için yeterli veri bulunamadı.'

  const parts = []

  if (val.score != null) {
    if (val.score >= 75) parts.push('değerleme açısından cazip seviyelerde')
    else if (val.score >= 50) parts.push('makul değerlenmiş')
    else if (val.score < 25) parts.push('yüksek değerlenmiş')
  }
  if (prof.score != null) {
    if (prof.score >= 75) parts.push('güçlü kârlılık')
    else if (prof.score < 25) parts.push('zayıf kârlılık')
  }
  if (grow.score != null) {
    if (grow.score >= 75) parts.push('hızlı büyüme')
    else if (grow.score < 25) parts.push('büyüme baskısı')
  }
  if (heal.score != null) {
    if (heal.score >= 75) parts.push('sağlıklı bilanço')
    else if (heal.score < 25) parts.push('borç yükü')
  }

  const desc = parts.length > 0
    ? `${parts.join(', ')} öne çıkıyor.`
    : 'karma sinyaller mevcut.'

  return `Genel skor <strong>${overall}/100</strong> — <span style="color:${verdict.color}">${verdict.label}</span>. ${desc}`
}
