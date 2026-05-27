import { useState, useEffect, useRef, useCallback } from 'react'
import { getFinnhubKey } from '../utils/storage'
import { fetchAll, searchSymbol } from '../utils/finnhub'
import { analyze, fmt, fmtPct, verdictOf } from '../utils/analyzer'

const POPULAR_ABD  = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'AMD']
const POPULAR_BIST = ['THYAO.IS', 'TUPRS.IS', 'AKBNK.IS', 'GARAN.IS', 'FROTO.IS', 'ISCTR.IS', 'KCHOL.IS', 'SASA.IS', 'ASELS.IS', 'EREGL.IS']

function isBist(symbol) { return symbol?.toUpperCase().endsWith('.IS') }
function currencySymbol(symbol) { return isBist(symbol) ? '₺' : '$' }

function scoreColor(score) {
  if (score == null) return 'text-slate-400'
  if (score >= 75) return 'text-green-400'
  if (score >= 60) return 'text-green-300'
  if (score >= 45) return 'text-yellow-400'
  if (score >= 32) return 'text-orange-400'
  return 'text-red-400'
}

function scoreBg(score) {
  if (score == null) return 'bg-slate-600'
  if (score >= 75) return 'bg-green-500'
  if (score >= 60) return 'bg-green-400'
  if (score >= 45) return 'bg-yellow-400'
  if (score >= 32) return 'bg-orange-400'
  return 'bg-red-500'
}

function verdictBadgeClass(label) {
  if (!label) return 'bg-slate-700 text-slate-300'
  if (label === 'GÜÇLÜ AL') return 'bg-green-500/20 text-green-400 border border-green-500/40'
  if (label === 'AL') return 'bg-green-500/15 text-green-300 border border-green-400/30'
  if (label === 'TUT / NÖTR') return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
  if (label === 'SAT') return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
  return 'bg-red-500/20 text-red-400 border border-red-500/30'
}

function ReturnChip({ label, value }) {
  const color = value == null
    ? 'text-slate-500'
    : value >= 0 ? 'text-green-400' : 'text-red-400'
  return (
    <div className="flex flex-col items-center gap-0.5 bg-slate-700/60 rounded-xl px-3 py-2">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{fmtPct(value)}</span>
    </div>
  )
}

function ScoreCircle({ score, color }) {
  const clampedScore = score ?? 0
  const rotation = Math.round((clampedScore / 100) * 360)
  const borderColor = color || '#94a3b8'

  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: 88,
        height: 88,
        background: `conic-gradient(${borderColor} ${rotation}deg, #334155 ${rotation}deg)`,
        padding: 4,
      }}
    >
      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
        <span
          className="text-2xl font-bold"
          style={{ color: borderColor }}
        >
          {score != null ? score : '—'}
        </span>
      </div>
    </div>
  )
}

function DimCard({ dim }) {
  const scoreVal = dim.score != null ? Math.round(dim.score) : null
  return (
    <div className="bg-slate-700/40 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-white text-sm font-semibold">{dim.name}</p>
          <p className="text-slate-400 text-xs mt-0.5">{dim.q}</p>
        </div>
        <span className={`text-lg font-bold ${scoreColor(scoreVal)} whitespace-nowrap`}>
          {scoreVal != null ? scoreVal : '—'}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-slate-600 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${scoreBg(scoreVal)}`}
          style={{ width: `${scoreVal ?? 0}%` }}
        />
      </div>
      {/* Sub metrics */}
      <div className="flex flex-col gap-1 mt-0.5">
        {dim.subs.map((sub, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-slate-400 truncate mr-2">{sub.label}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-white font-mono">{sub.display}</span>
              <span className={`text-xs ${scoreColor(sub.score)}`}>{sub.msg}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RangeBand({ rangePos, hi, lo, symbol }) {
  if (rangePos == null || hi == null || lo == null) return null
  const clamped = Math.max(0, Math.min(100, rangePos))
  const cur = currencySymbol(symbol)
  return (
    <div className="bg-slate-800 rounded-2xl p-4">
      <h3 className="text-white font-semibold text-sm mb-3">52 Haftalık Bant</h3>
      <div className="relative h-4 rounded-full overflow-hidden"
        style={{ background: 'linear-gradient(to right, #ef4444, #f97316, #facc15, #4ade80, #22c55e)' }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-slate-900 shadow"
          style={{ left: `calc(${clamped}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-slate-400">{cur}{fmt(lo, 2)} <span className="text-red-400">52H Düşük</span></span>
        <span className="text-xs text-slate-400"><span className="text-green-400">52H Yüksek</span> {cur}{fmt(hi, 2)}</span>
      </div>
    </div>
  )
}

function AnalystBar({ recDist }) {
  if (!recDist || recDist.total === 0) return null
  const { strongBuy, buy, hold, sell, strongSell, total } = recDist
  const pct = (n) => `${((n / total) * 100).toFixed(0)}%`

  return (
    <div className="bg-slate-800 rounded-2xl p-4">
      <h3 className="text-white font-semibold text-sm mb-3">
        Analist Görüşü <span className="text-slate-500 font-normal text-xs ml-1">({total} analist)</span>
      </h3>
      <div className="flex rounded-full overflow-hidden h-5">
        {strongBuy > 0 && (
          <div style={{ width: pct(strongBuy) }} className="bg-green-500 flex items-center justify-center">
            <span className="text-xs text-white font-bold">{strongBuy}</span>
          </div>
        )}
        {buy > 0 && (
          <div style={{ width: pct(buy) }} className="bg-green-300 flex items-center justify-center">
            <span className="text-xs text-slate-800 font-bold">{buy}</span>
          </div>
        )}
        {hold > 0 && (
          <div style={{ width: pct(hold) }} className="bg-yellow-400 flex items-center justify-center">
            <span className="text-xs text-slate-800 font-bold">{hold}</span>
          </div>
        )}
        {sell > 0 && (
          <div style={{ width: pct(sell) }} className="bg-orange-400 flex items-center justify-center">
            <span className="text-xs text-white font-bold">{sell}</span>
          </div>
        )}
        {strongSell > 0 && (
          <div style={{ width: pct(strongSell) }} className="bg-red-500 flex items-center justify-center">
            <span className="text-xs text-white font-bold">{strongSell}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {strongBuy > 0 && <span className="text-xs text-green-500">● Güçlü Al: {strongBuy}</span>}
        {buy > 0 && <span className="text-xs text-green-300">● Al: {buy}</span>}
        {hold > 0 && <span className="text-xs text-yellow-400">● Tut: {hold}</span>}
        {sell > 0 && <span className="text-xs text-orange-400">● Sat: {sell}</span>}
        {strongSell > 0 && <span className="text-xs text-red-500">● Güçlü Sat: {strongSell}</span>}
      </div>
    </div>
  )
}

export default function HisseAnaliz() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [state, setState] = useState('idle') // idle | loading | result | error
  const [result, setResult] = useState(null)
  const [profile, setProfile] = useState(null)
  const [quote, setQuote] = useState(null)
  const [currentSymbol, setCurrentSymbol] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  const apiKey = getFinnhubKey()

  const runSearch = useCallback(async (q) => {
    if (!q || q.length < 1) {
      setSuggestions([])
      return
    }
    try {
      const results = await searchSymbol(q, apiKey)
      setSuggestions(results.slice(0, 6))
      setShowSuggestions(true)
    } catch {
      setSuggestions([])
    }
  }, [apiKey])

  useEffect(() => {
    if (!apiKey) return
    clearTimeout(debounceRef.current)
    if (!query) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(() => runSearch(query), 400)
    return () => clearTimeout(debounceRef.current)
  }, [query, apiKey, runSearch])

  async function loadSymbol(symbol) {
    if (!symbol) return
    setShowSuggestions(false)
    setSuggestions([])
    setQuery(symbol)
    setState('loading')
    setCurrentSymbol(symbol)
    try {
      const { profile: p, quote: q, metrics, recommendations } = await fetchAll(symbol, apiKey)
      const analysisResult = analyze(metrics, q, recommendations)
      setProfile(p)
      setQuote(q)
      setResult(analysisResult)
      setState('result')
    } catch (err) {
      setErrorMsg(err.message || 'Veri alınamadı.')
      setState('error')
    }
  }

  function handleQueryChange(e) {
    setQuery(e.target.value)
    if (!e.target.value) setShowSuggestions(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && query.trim()) {
      loadSymbol(query.trim().toUpperCase())
    }
    if (e.key === 'Escape') setShowSuggestions(false)
  }

  // No API key state
  if (!apiKey) {
    return (
      <div className="flex flex-col gap-4 pb-4">
        <h2 className="text-white font-bold text-lg">Hisse Analizi</h2>
        <div className="bg-slate-800 rounded-2xl p-5 flex flex-col items-center gap-4 text-center">
          <span className="text-4xl">🔑</span>
          <div>
            <p className="text-white font-semibold">Finnhub API Anahtarı Gerekli</p>
            <p className="text-slate-400 text-sm mt-1">
              Hisse analizi için Finnhub API anahtarınızı Ayarlar bölümünden ekleyin.
            </p>
          </div>
          <a
            href="https://finnhub.io/register"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 text-sm underline"
          >
            finnhub.io/register — ücretsiz kayıt
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <h2 className="text-white font-bold text-lg">Hisse Analizi</h2>

      {/* Search */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="Sembol ara... (AAPL, THYAO.IS, GARAN.IS...)"
          className="w-full bg-slate-800 text-white rounded-2xl px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
        />
        <button
          onClick={() => query.trim() && loadSymbol(query.trim().toUpperCase())}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-lg"
          aria-label="Ara"
        >
          🔍
        </button>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => loadSymbol(s.symbol)}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-700 flex items-center gap-3 transition-colors"
              >
                <span className="text-blue-400 font-mono text-sm font-semibold w-16 shrink-0">{s.symbol}</span>
                <span className="text-slate-300 text-xs truncate">{s.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular chips */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-slate-500 text-xs self-center mr-1">ABD</span>
          {POPULAR_ABD.map(sym => (
            <button key={sym} onClick={() => loadSymbol(sym)}
              className="px-2.5 py-1 bg-slate-700/60 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition-colors">
              {sym}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-slate-500 text-xs self-center mr-1">BIST</span>
          {POPULAR_BIST.map(sym => (
            <button key={sym} onClick={() => loadSymbol(sym)}
              className="px-2.5 py-1 bg-blue-900/40 hover:bg-blue-800/50 text-blue-300 hover:text-white rounded-lg text-xs font-mono font-semibold transition-colors">
              {sym.replace('.IS', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {state === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">{currentSymbol} analiz ediliyor…</p>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col gap-2">
          <p className="text-red-400 font-semibold text-sm">Hata</p>
          <p className="text-slate-300 text-sm">{errorMsg}</p>
          <button
            onClick={() => setState('idle')}
            className="self-start text-xs text-slate-400 hover:text-white underline mt-1"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Result */}
      {state === 'result' && result && (
        <div className="flex flex-col gap-4">

          {/* Hero card */}
          <div className="bg-slate-800 rounded-2xl p-4">
            <div className="flex items-start gap-4">
              {/* Logo or placeholder */}
              <div className="shrink-0">
                {profile?.logo ? (
                  <img
                    src={profile.logo}
                    alt={profile.name}
                    className="w-12 h-12 rounded-xl object-contain bg-white p-1"
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-xl">
                    📊
                  </div>
                )}
              </div>

              {/* Company info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base leading-tight truncate">
                  {profile?.name || currentSymbol}
                </p>
                <p className="text-blue-400 font-mono text-sm">{currentSymbol}</p>
                {quote && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white font-bold text-lg">
                      {currencySymbol(currentSymbol)}{fmt(quote.c, 2)}
                    </span>
                    <span className={`text-sm font-semibold ${
                      (quote.dp ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {fmtPct(quote.dp)}
                    </span>
                  </div>
                )}
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${verdictBadgeClass(result.verdict?.label)}`}
                >
                  {result.verdict?.label || '—'}
                </span>
              </div>

              {/* Score circle */}
              <div className="shrink-0">
                <ScoreCircle score={result.overall} color={result.verdict?.color} />
              </div>
            </div>

            {/* Summary */}
            {result.summary && (
              <p
                className="text-slate-300 text-sm leading-relaxed mt-3 pt-3 border-t border-slate-700/60"
                dangerouslySetInnerHTML={{ __html: result.summary }}
              />
            )}
          </div>

          {/* 6 Dimensions */}
          <div className="bg-slate-800 rounded-2xl p-4">
            <h3 className="text-white font-semibold text-sm mb-3">6 Boyutlu Analiz</h3>
            <div className="flex flex-col gap-2">
              {result.dims.map((dim, i) => (
                <DimCard key={i} dim={dim} />
              ))}
            </div>
          </div>

          {/* Pros & Cons */}
          {(result.pros.length > 0 || result.cons.length > 0) && (
            <div className="flex flex-col gap-2">
              {result.pros.length > 0 && (
                <div className="bg-slate-800 rounded-2xl p-4">
                  <h3 className="text-green-400 font-semibold text-sm mb-2">✓ Güçlü Yönler</h3>
                  <ul className="flex flex-col gap-1">
                    {result.pros.map((p, i) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                        <span className="text-green-400 mt-0.5 shrink-0">●</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.cons.length > 0 && (
                <div className="bg-slate-800 rounded-2xl p-4">
                  <h3 className="text-red-400 font-semibold text-sm mb-2">✗ Zayıf Yönler</h3>
                  <ul className="flex flex-col gap-1">
                    {result.cons.map((c, i) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5 shrink-0">●</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 52-week range */}
          <RangeBand rangePos={result.rangePos} hi={result.hi} lo={result.lo} symbol={currentSymbol} />

          {/* Analyst bar */}
          <AnalystBar recDist={result.recDist} />

          {/* Performance chips */}
          <div className="bg-slate-800 rounded-2xl p-4">
            <h3 className="text-white font-semibold text-sm mb-3">Performans</h3>
            <div className="grid grid-cols-5 gap-1.5">
              <ReturnChip label="5G" value={result.returns.d5} />
              <ReturnChip label="1A" value={result.returns.m1} />
              <ReturnChip label="3A" value={result.returns.m3} />
              <ReturnChip label="YTD" value={result.returns.ytd} />
              <ReturnChip label="1Y" value={result.returns.y1} />
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
