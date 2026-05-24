import InstrumentCard from './InstrumentCard'
import { DEFAULT_INSTRUMENTS, getSummaryText } from '../utils/signals'

export default function AnaEkran() {
  const summary = getSummaryText(DEFAULT_INSTRUMENTS)

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Özet kartı */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-blue-500/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Bugünün Özeti</span>
          <span className="text-slate-500 text-xs">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
        <p className="text-slate-500 text-xs mt-2">Sinyaller statik — API bağlantısı kurulunca güncellenecek.</p>
      </div>

      {/* Enstrüman listesi */}
      <div className="flex flex-col gap-3">
        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Takip Listesi</h2>
        {DEFAULT_INSTRUMENTS.map(instrument => (
          <InstrumentCard key={instrument.id} instrument={instrument} />
        ))}
      </div>
    </div>
  )
}
