import { useState } from 'react'
import InstrumentCard from './InstrumentCard'
import { DEFAULT_INSTRUMENTS, getSummaryText, getSignal } from '../utils/signals'
import { fetchAllPrices, formatPrice } from '../utils/finance'
import { analyzeWithClaude } from '../utils/claude'
import { getApiKey } from '../utils/storage'

export default function AnaEkran() {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [liveData, setLiveData] = useState(null)   // { prices, sinyaller, ozet, fetchErrors, updatedAt }
  const [errorMsg, setErrorMsg] = useState('')

  const apiKey = getApiKey()

  async function handleAnaliz() {
    setState('loading')
    setErrorMsg('')
    try {
      const { prices, errors } = await fetchAllPrices()

      const hasPrices = Object.values(prices).some(v => v !== null)
      if (!hasPrices) throw new Error('Hiçbir fiyat verisi alınamadı. CORS kısıtlaması olabilir.')

      const { sinyaller, ozet } = await analyzeWithClaude(apiKey, prices)

      setLiveData({ prices, sinyaller, ozet, fetchErrors: errors, updatedAt: new Date() })
      setState('done')
    } catch (err) {
      setErrorMsg(err.message)
      setState('error')
    }
  }

  // Canlı veriden enstrüman kartı verisi üret
  const instruments = DEFAULT_INSTRUMENTS.map(inst => {
    if (!liveData) return inst
    const priceData = liveData.prices[inst.isim]
    const signal = liveData.sinyaller?.[inst.isim]
    return {
      ...inst,
      fiyat: priceData ? formatPrice(inst.isim, priceData.current) : inst.fiyat,
      degisim: priceData ? priceData.change.toFixed(2) : inst.degisim,
      liveSignal: signal ?? null,
    }
  })

  const summaryText = liveData?.ozet ?? getSummaryText(DEFAULT_INSTRUMENTS)
  const updatedAt = liveData?.updatedAt

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Özet kartı */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-blue-500/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Bugünün Özeti</span>
            <span className="text-slate-500 text-xs">
              {updatedAt
                ? updatedAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
            </span>
          </div>
          {updatedAt && (
            <button
              onClick={handleAnaliz}
              disabled={state === 'loading'}
              className="text-slate-500 hover:text-blue-400 text-xs transition-colors disabled:opacity-40"
            >
              ↻ Yenile
            </button>
          )}
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{summaryText}</p>
        {!liveData && (
          <p className="text-slate-500 text-xs mt-2">
            {apiKey ? 'Gerçek zamanlı analiz için aşağıdaki butona tıklayın.' : 'Ayarlar\'dan Claude API anahtarı ekleyin.'}
          </p>
        )}
        {liveData?.fetchErrors?.length > 0 && (
          <p className="text-yellow-500/70 text-xs mt-2">⚠ Bazı veriler alınamadı: {liveData.fetchErrors.join(', ')}</p>
        )}
      </div>

      {/* Analiz butonu */}
      {!updatedAt && apiKey && (
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

      {/* Hata mesajı */}
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
        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Takip Listesi</h2>
        {instruments.map(instrument => (
          <InstrumentCard key={instrument.id} instrument={instrument} loading={state === 'loading'} />
        ))}
      </div>
    </div>
  )
}
