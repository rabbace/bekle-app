import { useState } from 'react'
import InstrumentCard from './InstrumentCard'
import { DEFAULT_INSTRUMENTS, getSummaryText } from '../utils/signals'
import { fetchAllPrices, formatPrice } from '../utils/finance'
import { analyzeWithClaude } from '../utils/claude'
import { getApiKey, loadAnalysisCache, saveAnalysisCache } from '../utils/storage'

function timeAgo(ts) {
  if (!ts) return ''
  const mins = Math.round((Date.now() - ts) / 60000)
  if (mins < 1) return 'az önce'
  if (mins < 60) return `${mins} dk önce`
  const hrs = Math.round(mins / 60)
  return `${hrs} saat önce`
}

export default function AnaEkran() {
  // Sayfa açılışında cache'den yükle — böylece sinyal değişmez
  const [state, setState] = useState('idle')
  const [liveData, setLiveData] = useState(() => loadAnalysisCache())
  const [errorMsg, setErrorMsg] = useState('')

  const apiKey = getApiKey()

  async function handleAnaliz() {
    setState('loading')
    setErrorMsg('')
    try {
      const { prices, errors } = await fetchAllPrices()

      const hasPrices = Object.values(prices).some(v => v !== null)
      if (!hasPrices) throw new Error('Fiyat verisi alınamadı. İnternet bağlantınızı kontrol edin.')

      const { sinyaller, ozet } = await analyzeWithClaude(apiKey, prices)

      const result = { prices, sinyaller, ozet, fetchErrors: errors, ts: Date.now() }
      saveAnalysisCache(result)
      setLiveData(result)
      setState('done')
    } catch (err) {
      setErrorMsg(err.message)
      setState('error')
    }
  }

  const instruments = DEFAULT_INSTRUMENTS.map(inst => {
    if (!liveData) return inst
    const priceData = liveData.prices?.[inst.isim]
    const signal = liveData.sinyaller?.[inst.isim] ?? null
    return {
      ...inst,
      fiyat: priceData ? formatPrice(inst.isim, priceData.current) : inst.fiyat,
      degisim: inst.degisim, // change % şimdilik statik (API gelince güncellenecek)
      liveSignal: signal,
    }
  })

  const summaryText = liveData?.ozet ?? getSummaryText(DEFAULT_INSTRUMENTS)
  const lastTs = liveData?.ts

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Özet kartı */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-blue-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
            Bugünün Özeti
          </span>
          <div className="flex items-center gap-2">
            {lastTs && (
              <span className="text-slate-500 text-xs">{timeAgo(lastTs)}</span>
            )}
            {liveData && (
              <button
                onClick={handleAnaliz}
                disabled={state === 'loading'}
                className="text-slate-500 hover:text-blue-400 text-xs transition-colors disabled:opacity-40"
              >
                ↻ Yenile
              </button>
            )}
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{summaryText}</p>
        {!liveData && (
          <p className="text-slate-500 text-xs mt-2">
            {apiKey
              ? 'Gerçek zamanlı analiz için aşağıdaki butona tıklayın.'
              : 'Ayarlar\'dan Claude API anahtarı ekleyin.'}
          </p>
        )}
        {liveData?.fetchErrors?.length > 0 && (
          <p className="text-yellow-500/70 text-xs mt-2">
            ⚠ {liveData.fetchErrors.join(' · ')}
          </p>
        )}
      </div>

      {/* Analiz butonu — sadece hiç analiz yoksa göster */}
      {!liveData && apiKey && (
        <button
          onClick={handleAnaliz}
          disabled={state === 'loading'}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-2xl py-3 transition-colors flex items-center justify-center gap-2"
        >
          {state === 'loading' ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analiz ediliyor…
            </>
          ) : (
            '✦ Şimdi Analiz Et'
          )}
        </button>
      )}

      {/* Loading göstergesi — yenilemede */}
      {state === 'loading' && liveData && (
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="inline-block w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Güncelleniyor…</span>
        </div>
      )}

      {/* Hata */}
      {state === 'error' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3">
          <p className="text-red-400 text-sm">{errorMsg}</p>
          <button onClick={handleAnaliz} className="text-red-300 text-xs mt-1 underline">
            Tekrar dene
          </button>
        </div>
      )}

      {/* Enstrüman listesi */}
      <div className="flex flex-col gap-3">
        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Takip Listesi
        </h2>
        {instruments.map(instrument => (
          <InstrumentCard
            key={instrument.id}
            instrument={instrument}
            loading={state === 'loading'}
          />
        ))}
      </div>
    </div>
  )
}
